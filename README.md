# KnownUser.V3.Cloudflare
Before getting started please read the [documentation](https://github.com/queueit/Documentation/tree/main/edge-connectors) to get acquainted with edge connectors.

This connector is using [Cloudflare Workers](https://developers.cloudflare.com/workers/)
and [Cloudflare Workers KV](https://developers.cloudflare.com/workers/kv/) to integrate a Cloudflare protected WebServer
with [Queue-it](https://queue-it.com/).

## Installation

1. **Create a KV namespace**:
   * From the  Cloudflare dashboard -> select "Workers" -> and press "Manage KV namespaces".  Press "Create namespace", in the "Namespace Name" field, enter `IntegrationConfigKV` and click "Add".
2. **Create a new worker**:
   * On the Workers panel press "Create a Service". Consider changing the service name to something meaningful. e.g. `queue-itconnector`. Press "Create service" (the "starter" type doesn't matter as you will be replacing the code anyway.)
   * Once the worker is created, press "Quick edit" and replace all the code in the left panel with the code from `queueitknownuser.bundle.js` (can be found under assets of the [latests release](https://github.com/queueit/KnownUser.V3.Cloudflare/releases/latest) of the repository KnownUser.V3.Cloudflare).
   * Search for `QUEUEIT_CUSTOMERID` and `QUEUEIT_SECRETKEY` in the worker code (from `queueitknownuser.bundle.js`) and replace their values with
   your customerId and secretKey found in the Go Queue-It self-service platform.
   * If you have any action(s) with trigger(s) using the experimental request body condition, then search
   for `READ_REQUEST_BODY` and set this variable to true.
   * Click "Save and Deploy"
3. **Bind the KV namespace to the worker**:
   * Go back to the Worker Setup page by clicking the "<" button next to the new title of the newly created Worker. On the "Settings" tab, press the "Variables" menu item, and under "KV Namespace Bindings" click the "Add binding" button. For "Variable
   name" enter "`IntegrationConfigKV`" and for "KV namespace" select "`IntegrationConfigKV`" from the dropdown which you
   had added before in Step 1. Click "Save".
4. **Configure your publishing point in Go**:
   * Within the Go Queue-it Platform, go to Integration -> Overview -> Settings and fill in the "Publish web endpoint" field. This allows the Go platform to push your configuration to the Edgeworker and EdgeKV storage on Cloudflare.
   * The value should be `https://[Worker URL]/?__push_queueit_config`. The worker URL can be copied from the Triggers tab in the Cloudflare worker settings. So the URL should be e.g. `https://queue-itconnector.youraccount.workers.dev/?__push_queueit_config`.

5. **Add routes to the Cloudflare worker**:
   * On the Triggers tab, configure the routes (URLs) that should be covered by the Edgeworker
   * First, exclude routes that should not have Queue-it enabled, for instance all static resources (e.g. https://PROTECTED.YOURDOMAIN.COM/MEDIA/*) by selecting
    the "NONE" worker (read more about the route matching
    here: [Cloudflare matching-behavior](https://developers.cloudflare.com/workers/about/routes/#matching-behavior)
   * Then, add routes you need to be protected by Queue-it (e.g. https://PROTECTED.YOURDOMAIN.COM/*) and assign them to the Queue-it worker.

6. **Configure Triggers and Actions and publish your configuration**:
   * Create the appropriate Triggers and Actions in the Integration section of Go. Note: for simple URL-based Ignore actions, consider using a NONE route in Cloudflare instead, to incur fewer EdgeWorker invocations (lower cost).
   * Go to Integration -> Overview and click the "Publish Now" button - the page will prompt you whether you also want to publish to the web endpoint, which you should accept - success/failure of the publish will be indicated in as status message at the bottom of the screen.

### Using the NPM package

If you already have a worker and would like to integrate or chain the Queue-it connector in your code you need to follow these steps:
1. Since you already have a worker, you only need to create the KV binding.
You can do this by following step 1 in the above installation instructions.
2. Install the `@queue-it/cloudflare` [![npm version](https://badge.fury.io/js/@queue-it%2Fcloudflare.svg)](https://badge.fury.io/js/@queue-it%2Fcloudflare) npm package by running `npm i --save @queue-it/cloudflare` from within your worker's source directory.
3. Add this snippet in the file where you want to add the Queue-it connector.
```js
import * as QueueIt from "@queue-it/cloudflare";
```
4. Add this snippet on top of your source code and replace the values
with your customerId and secretKey found in the Go Queue-It self-service platform.
If you have any action(s) with trigger(s) using the experimental request body condition, then set the `readRequestBody` to true.
```js
const readRequestBody = false;
QueueIt.setIntegrationDetails("YOUR CUSTOMERID HERE", "YOUR SECRET KEY HERE", readRequestBody);
```
5. Place the following snippet in the place where you handle the incoming requests and would like to add Queue-it.
```js
const queueItResponse = await QueueIt.onClientRequest(cloudflareRequest);
// We got a valid response, return it to the user.
if (queueItResponse) {
    queueitResponse = await QueueIt.onClientResponse(queueitResponse);
    return queueItResponse;
}
```
6. Make sure you return the `queueItResponse` variable from your worker if it has any value.
7. You need to build your worker and deploy it
8. Follow steps 9-15 from the instruction.

### Combining queueit code with other custom codes

You can update app.js to execute your custom codes before or after calling queueit validation methods during request or
response. After changing the code in app.js you need use browserify to regenerate the bundle and then use it in your
cloudflare distribution.

> Please contact [queue-it support](https://support.queue-it.com/hc/en-us) for further information and instructions.


## Environment Variables
Set the env variable `QUEUE_IT_SECRET_KEY` in the cloudflare worker which is the known user secret. This can be retrievd from a Waiting Room > Deployment.  
Set the env variable `BYPASS_STAGING` to `'true'` to bypass the validation on staging.  
Set the env variable `BYPASS_PROD` to `'true'` to bypass the validation on prod.  
