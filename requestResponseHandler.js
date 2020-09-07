// Set to true, if you have any trigger(s) containing experimental 'RequestBody' condition.
const READ_REQUEST_BODY = false;
const QUEUEIT_FAILED_HEADERNAME = "x-queueit-failed";

const knownUser = require("queueit-knownuser").KnownUser;
const utils = require("queueit-knownuser").Utils;
var httpProvider = null;
const contextProvider = require("./contextProvider.js");
const helpers = require("./queueitHelpers.js");
const integrationConfigProvider = require("./integrationConfigProvider.js");

//this function returns a response object where the execution follow should break 
//if it returns null then caller should decide how to procced with the request
exports.onQueueITRequest = async function (request, customerId, secretKey) {

    if (request.url.indexOf('__push_queueit_config') > 0) {
        var result = await integrationConfigProvider.tryStoreIntegrationConfig(request, IntegrationConfigKV, secretKey);
        return new Response(result ? "Success!" : "Fail!");
    }

    try {
        let integrationConfigJson = await integrationConfigProvider.getIntegrationConfig(IntegrationConfigKV) || "";

        helpers.configureKnownUserHashing(utils);

        let bodyText = "";
        if (READ_REQUEST_BODY) {
            //reading maximum 2k characters of body to do the mathcing
            bodyText = (await request.clone().text() || "").substring(0, 2048);
        }
        httpProvider = contextProvider.getHttpHandler(request, bodyText);

        var queueitToken = helpers.getParameterByName(request.url, knownUser.QueueITTokenKey);
        var requestUrl = request.url;
        var requestUrlWithoutToken = requestUrl.replace(new RegExp("([\?&])(" + knownUser.QueueITTokenKey + "=[^&]*)", 'i'), "");
        // The requestUrlWithoutToken is used to match Triggers and as the Target url (where to return the users to).
        // It is therefor important that this is exactly the url of the users browsers. So, if your webserver is
        // behind e.g. a load balancer that modifies the host name or port, reformat requestUrlWithoutToken before proceeding.


        var validationResult = knownUser.validateRequestByIntegrationConfig(
            requestUrlWithoutToken, queueitToken, integrationConfigJson,
            customerId, secretKey, httpProvider);

        if (validationResult.doRedirect()) {
            if (validationResult.isAjaxResult) {
                let response = new Response();
                // In case of ajax call send the user to the queue by sending a custom queue-it header and redirecting user to queue from javascript
                response.headers.set(validationResult.getAjaxQueueRedirectHeaderKey(), helpers.addKUPlatformVersion(validationResult.getAjaxRedirectUrl()));
                addNoCacheHeaders(response);
                return response;

            }
            else {
                let response = new Response(null, { status: 302 });
                // Send the user to the queue - either because hash was missing or because is was invalid
                response.headers.set('Location', helpers.addKUPlatformVersion(validationResult.redirectUrl));
                addNoCacheHeaders(response);
                return response;
            }
        }
        else {
            // Request can continue - we remove queueittoken form querystring parameter to avoid sharing of user specific token
            if (requestUrl !== requestUrlWithoutToken && validationResult.actionType === 'Queue') {
                let response = new Response(null, { status: 302 });
                response.headers.set('Location', requestUrlWithoutToken);
                addNoCacheHeaders(response);
                return response;
            }
            else {
                // lets caller decides the next step
                return null;
            }
        }
    }
    catch (e) {
        // There was an error validationg the request
        // Use your own logging framework to log the Exception
        if (console && console.log) {
            console.log("ERROR:" + e);
        }
        if (httpProvider) {
            httpProvider.isError = true;
        }
        // lets caller decides the next step
        return null;
    }

}

exports.onQueueITResponse = async function (response) {

    let newResponse = new Response(response.body, response);
    if (httpProvider) {
        if (httpProvider.outputCookie) {
            newResponse.headers.append("Set-Cookie", httpProvider.outputCookie);
        }
        if (httpProvider.isError) {
            newResponse.headers.append(QUEUEIT_FAILED_HEADERNAME, "true");
        }
    }
    return newResponse;
}

let addNoCacheHeaders = function (response) {
    // Adding no cache headers to prevent browsers to cache requests
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', 'Fri, 01 Jan 1990 00:00:00 GMT');
}
