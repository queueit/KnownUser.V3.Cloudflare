'use strict'

declare global {
  const QUEUE_IT_SECRET_KEY: string
  const BYPASS_STAGING: string
  const BYPASS_PROD: string
}

const QUEUEIT_CUSTOMERID = "genies";
const QUEUEIT_SECRETKEY = QUEUE_IT_SECRET_KEY ?? "";

// Set to true, if you have any trigger(s) containing experimental 'RequestBody' condition.
const READ_REQUEST_BODY = false;
import QueueITRequestResponseHandler from "./requestResponseHandler";

declare var addEventListener: any;
declare var fetch: any;

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event))
})

const handleRequest = async function (event: any) {
  const {request} = event;
  const handler = new QueueITRequestResponseHandler(QUEUEIT_CUSTOMERID, QUEUEIT_SECRETKEY, READ_REQUEST_BODY);

  // exit early based on env variables
  if (
    (request.url.includes('staging') && BYPASS_STAGING === 'true') ||
    (!request.url.includes('staging') && BYPASS_PROD === 'true')
  ) {
    const response = await fetch(request);
    return await handler.onClientResponse(response);
  }

  let queueitResponse = await handler.onClientRequest(request);
  if (queueitResponse) {
    //it is a redirect- break the flow
    return await handler.onClientResponse(queueitResponse);
  } else {
    //call backend
    const response = await fetch(request);
    return await handler.onClientResponse(response);
  }

}