'use strict'
const QUEUEIT_CUSTOMERID = "YOUR CUSTOMERID"; 
const QUEUEIT_SECRETKEY = "YOUR SECRET KEY";
const QueueIT = require("./sdk/queueit-knownuserv3-sdk.js");
const contextProvider = require("./contextProvider.js");
const helpers = require("./queueitHelpers.js");
const integrationConfigProvider = require("./integrationConfigProvider.js");


addEventListener('fetch', event => {   

    event.respondWith( fetchAndApply(event.request));
  })
  async function fetchAndApply(request) {

    if(request.url.indexOf('__push_queueit_config') > 0)
    {
      var result = await integrationConfigProvider.tryStoreIntegrationConfig(request,IntegrationConfigKV,QUEUEIT_SECRETKEY);
      return new Response(result? "Success!":"Fail!");
    }

    let integrationConfigJson = await integrationConfigProvider.getIntegrationConfig(IntegrationConfigKV) || "";

    helpers.configureKnownUserHashing();


    const bodyText = await request.clone().text();
    const httpProvider = contextProvider.getHttpHandler(request,bodyText);
    
    var knownUser = QueueIT.KnownUserV3.SDK.KnownUser;
    var queueitToken = helpers.getParameterByName(request.url,knownUser.QueueITTokenKey );
    var requestUrl = request.url;
    var requestUrlWithoutToken = requestUrl.replace(new RegExp("([\?&])(" + knownUser.QueueITTokenKey + "=[^&]*)", 'i'), "");
    // The requestUrlWithoutToken is used to match Triggeclearrs and as the Target url (where to return the users to).
    // It is therefor important that this is exactly the url of the users browsers. So, if your webserver is
    // behind e.g. a load balancer that modifies the host name or port, reformat requestUrlWithoutToken before proceeding.
  
    let response = null;
    try
    {
      var validationResult = knownUser.validateRequestByIntegrationConfig(
        requestUrlWithoutToken, queueitToken, integrationConfigJson,
        QUEUEIT_CUSTOMERID, QUEUEIT_SECRETKEY, httpProvider);
  
      if (validationResult.doRedirect()) {
         response =  new Response();
        // Adding no cache headers to prevent browsers to cache requests
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', 'Fri, 01 Jan 1990 00:00:00 GMT');
  
        if (validationResult.isAjaxResult) {
          // In case of ajax call send the user to the queue by sending a custom queue-it header and redirecting user to queue from javascript
          response.headers.set(validationResult.getAjaxQueueRedirectHeaderKey(),helpers.addKUPlatformVersion(validationResult.getAjaxRedirectUrl()));
            
        }
        else {
          // Send the user to the queue - either because hash was missing or because is was invalid
          response = Response.redirect(helpers.addKUPlatformVersion(validationResult.redirectUrl),'302');
        }
      }
      else {     
        
        // Request can continue - we remove queueittoken form querystring parameter to avoid sharing of user specific token
        if (requestUrl !== requestUrlWithoutToken && validationResult.actionType) {
            response =  new Response(); 
            response = Response.redirect(requestUrlWithoutToken,'302');
        }
        else {
          // Render page
          response = await fetch(request);
        }
      }

      if(httpProvider.outputCookie)
      {
          response = new Response(response.body, response);
          response.headers.append("Set-Cookie",httpProvider.outputCookie);
      }
    }
    catch (e) {
      // There was an error validationg the request
      // Use your own logging framework to log the Exception
     if(console && console.log)
     {
        console.log("ERROR:" + e);
     }
      response = await fetch(request);
    }

    return response;

  }
  
 