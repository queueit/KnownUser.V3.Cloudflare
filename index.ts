import QueueITRequestResponseHandler from "./requestResponseHandler";

let handler: QueueITRequestResponseHandler | null;

export function setIntegrationDetails(customerId: string, secretKey: string, readRequestBody: boolean = false) {
    handler = new QueueITRequestResponseHandler(customerId, secretKey, readRequestBody);
}

export async function onClientRequest(request: any) {
    return handler?.onClientRequest(request);
}

export async function onClientResponse(response: any) {
    return handler?.onClientResponse(response);
}