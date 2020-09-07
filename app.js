'use strict'
const QUEUEIT_CUSTOMERID = "YOUR CUSTOMERID";
const QUEUEIT_SECRETKEY = "YOUR SECRET KEY";
const queueitHandler = require("./requestResponseHandler");

addEventListener('fetch', (event) => {

  event.respondWith(handleRequest(event.request))
})

const handleRequest = async function (request) {
  let queueitResponse = await queueitHandler.onQueueITRequest(request,QUEUEIT_CUSTOMERID, QUEUEIT_SECRETKEY);
  if (queueitResponse) {
    //it is a redirect- break the flow  
     return await queueitHandler.onQueueITResponse(queueitResponse);
  }
  else {
    //call backend 
    var response = await fetch(request);
    return await queueitHandler.onQueueITResponse(response);
  }
}