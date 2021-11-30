let queueitCustomerId = "YOUR CUSTOMERID";
let queueitSecretKey = "YOUR SECRET KEY";
// Set to true, if you have any trigger(s) containing experimental 'RequestBody' condition.
let queueitReadRequestBody: boolean = false;

import {onQueueItRequest, onQueueItResponse} from "./requestResponseHandler";

export function setIntegrationDetails(customerId: string, secretKey: string, readRequestBody: boolean = false) {
    queueitCustomerId = customerId;
    queueitSecretKey = secretKey;
    queueitReadRequestBody = readRequestBody;
}

export async function onClientRequest(request: any) {
    return await onQueueItRequest(request, queueitCustomerId, queueitSecretKey, queueitReadRequestBody);
}

export async function onClientResponse(response: any) {
    return await onQueueItResponse(response);
}