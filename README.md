# KnownUser.V3.Cloudflare
Before getting started please read the [documentation](https://github.com/queueit/Documentation/tree/main/edge-connectors) to get acquainted with edge connectors.

This connector is using [Cloudflare Workers](https://developers.cloudflare.com/workers/)
and [Cloudflare Workers KV](https://developers.cloudflare.com/workers/kv/) to integrate a Cloudflare protected WebServer
with [Queue-it](https://queue-it.com/).

## Installation

1. Browse to Cloudflare dashboard -> select Workers -> "Manage KV namespaces" -> in the "Namespace Name" field,
   enter `IntegrationConfigKV` -> click "Add"
2. In the upper-left side, select Workers -> "Create a Worker" -> clear the template code and paste the contents
   of `queueitknownuser.bundle.js` from the latest release.
3. Search for `QUEUEIT_CUSTOMERID` and `QUEUEIT_SECRETKEY` in `queueitknownuser.bundle.js` replace their values with
   your customerId and secretKey found in the Go Queue-It self-service platform.
4. If you have any action(s) with trigger(s) using the experimental request body condition, then search
   for `READ_REQUEST_BODY` and set this variable to true.
5. Rename worker to "queue-itconnector" (located in the upper-left corner)
6. Click Save and Deploy
7. Go back to the Worker Setup page by clicking the "<" button next to the new title of the newly created Worker
8. On the Worker setup page, select the toggle switch on "Deployed to `queue-itconnector.yoursite.workers.dev`" to
   deploy the Worker to production
9. On the "Settings" tab, under the "KV Namespace Bindings" heading, click the "Add variable" button. For "Variable
   name" enter "`IntegrationConfigKV`" and for "KV namespace" select "`IntegrationConfigKV`" from the dropdown which you
   had added before in Step 1. Click "Save".
10. Navigate back to the Cloudflare Dashboard and select "Workers" -> "Add route"
11. Exclude routes that should not have Queue-it enabled (e.g. https://PROTECTED.YOURDOMAIN.COM/MEDIA/*) by selecting
    the "NONE" worker (read more about the route matching
    here: [Cloudflare matching-behavior](https://developers.cloudflare.com/workers/about/routes/#matching-behavior)
12. Add routes you need to be protected by Queue-it (e.g. https://PROTECTED.YOURDOMAIN.COM/*)
13. Within the Go Queue-it Platform, set-up the Publish web endpoint (e.g. [PROTECTED ROUTE]/?__push_queueit_config) in
    Integration -> Overview -> Settings
14. Configure relevant Triggers and Actions in Go Queue-it
15. When ready to deploy the configuration, click Integration -> Overview -> Show/Hide Instructions and click the
    Publish Now button

### Using the NPM package

If you already have a worker and would like to integrate or chain the Queue-it connector in your code you need to follow these steps:
1. Since you already have a worker, you only need to create the KV binding.
You can do this by following step 1 in the instruction.
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
 
