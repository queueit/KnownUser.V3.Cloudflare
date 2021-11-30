'use strict'
const QUEUEIT_CUSTOMERID = "YOUR CUSTOMERID";
const QUEUEIT_SECRETKEY = "YOUR SECRET KEY";
// Set to true, if you have any trigger(s) containing experimental 'RequestBody' condition.
const READ_REQUEST_BODY = false;
import { onQueueItRequest, onQueueItResponse } from "./requestResponseHandler";

declare var addEventListener: any;
declare var fetch: any;

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event))
})

const handleRequest = async function (event: any) {
  const {request} = event;

  let queueitResponse = await onQueueItRequest(request, QUEUEIT_CUSTOMERID, QUEUEIT_SECRETKEY, READ_REQUEST_BODY);
  if (queueitResponse) {
    //it is a redirect- break the flow
    return await onQueueItResponse(queueitResponse);
  }
  else {
    //call backend
    const response = await fetch(request);
    return await onQueueItResponse(response);
  }

}