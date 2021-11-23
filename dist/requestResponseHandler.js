var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Set to true, if you have any trigger(s) containing experimental 'RequestBody' condition.
const READ_REQUEST_BODY = false;
const QUEUEIT_FAILED_HEADERNAME = "x-queueit-failed";
const QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME = 'x-queueit-connector';
const SHOULD_IGNORE_OPTIONS_REQUESTS = false;
const QueueIT = require("queueit-knownuser");
const knownUser = QueueIT.KnownUser;
const utils = require("queueit-knownuser").Utils;
var httpProvider = null;
const contextProvider = require("./contextProvider.js");
const helpers = require("./queueitHelpers.js");
const integrationConfigProvider = require("./integrationConfigProvider.js");
let sendNoCacheHeaders = false;
//this function returns a response object where the execution follow should break
//if it returns null then caller should decide how to procced with the request
exports.onQueueITRequest = function (request, customerId, secretKey) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isIgnored(request)) {
            return null;
        }
        if (request.url.indexOf('__push_queueit_config') > 0) {
            var result = yield integrationConfigProvider.tryStoreIntegrationConfig(request, IntegrationConfigKV, secretKey);
            return new Response(result ? "Success!" : "Fail!", result ? undefined : { status: 400 });
        }
        try {
            let integrationConfigJson = (yield integrationConfigProvider.getIntegrationConfig(IntegrationConfigKV)) || "";
            helpers.configureKnownUserHashing(utils);
            let bodyText = "";
            if (READ_REQUEST_BODY) {
                //reading maximum 2k characters of body to do the mathcing
                bodyText = ((yield request.clone().text()) || "").substring(0, 2048);
            }
            httpProvider = contextProvider.getHttpHandler(request, bodyText);
            var queueitToken = getQueueItToken(request, httpProvider);
            var requestUrl = request.url;
            var requestUrlWithoutToken = requestUrl.replace(new RegExp("([\?&])(" + knownUser.QueueITTokenKey + "=[^&]*)", 'i'), "");
            // The requestUrlWithoutToken is used to match Triggers and as the Target url (where to return the users to).
            // It is therefor important that this is exactly the url of the users browsers. So, if your webserver is
            // behind e.g. a load balancer that modifies the host name or port, reformat requestUrlWithoutToken before proceeding.
            var validationResult = knownUser.validateRequestByIntegrationConfig(requestUrlWithoutToken, queueitToken, integrationConfigJson, customerId, secretKey, httpProvider);
            if (validationResult.doRedirect()) {
                if (validationResult.isAjaxResult) {
                    let response = new Response();
                    // In case of ajax call send the user to the queue by sending a custom queue-it header and redirecting user to queue from javascript
                    response.headers.set(validationResult.getAjaxQueueRedirectHeaderKey(), helpers.addKUPlatformVersion(validationResult.getAjaxRedirectUrl()));
                    sendNoCacheHeaders = true;
                    return response;
                }
                else {
                    let response = new Response(null, { status: 302 });
                    // Send the user to the queue - either because hash was missing or because is was invalid
                    response.headers.set('Location', helpers.addKUPlatformVersion(validationResult.redirectUrl));
                    sendNoCacheHeaders = true;
                    return response;
                }
            }
            else {
                // Request can continue - we remove queueittoken form querystring parameter to avoid sharing of user specific token
                if (requestUrl !== requestUrlWithoutToken && validationResult.actionType === 'Queue') {
                    let response = new Response(null, { status: 302 });
                    response.headers.set('Location', requestUrlWithoutToken);
                    sendNoCacheHeaders = true;
                    return response;
                }
                else {
                    // lets caller decides the next step
                    return null;
                }
            }
        }
        catch (e) {
            // There was an error validating the request
            // Use your own logging framework to log the Exception
            if (console && console.log) {
                console.log("ERROR:", e);
            }
            if (httpProvider) {
                httpProvider.isError = true;
            }
            // lets caller decides the next step
            return null;
        }
    });
};
exports.onClientRequest = exports.onQueueITRequest;
exports.onQueueITResponse = function (response) {
    return __awaiter(this, void 0, void 0, function* () {
        let newResponse = new Response(response.body, response);
        newResponse.headers.set(QUEUEIT_CONNECTOR_EXECUTED_HEADER_NAME, 'cloudflare');
        if (httpProvider) {
            if (httpProvider.outputCookie) {
                newResponse.headers.append("Set-Cookie", httpProvider.outputCookie);
            }
            if (httpProvider.isError) {
                newResponse.headers.append(QUEUEIT_FAILED_HEADERNAME, "true");
            }
        }
        if (sendNoCacheHeaders) {
            addNoCacheHeaders(newResponse);
        }
        return newResponse;
    });
};
exports.onClientResponse = exports.onQueueITResponse;
function isIgnored(request) {
    return SHOULD_IGNORE_OPTIONS_REQUESTS && request.method === 'OPTIONS';
}
let addNoCacheHeaders = function (response) {
    // Adding no cache headers to prevent browsers to cache requests
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', 'Fri, 01 Jan 1990 00:00:00 GMT');
};
function getQueueItToken(request, httpContext) {
    let queueItToken = helpers.getParameterByName(request.url, knownUser.QueueITTokenKey);
    if (queueItToken) {
        return queueItToken;
    }
    const tokenHeaderName = `x-${knownUser.QueueITTokenKey}`;
    return httpContext.getHttpRequest().getHeader(tokenHeaderName);
}
//# sourceMappingURL=requestResponseHandler.js.map