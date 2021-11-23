"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const concat = require("concat-stream");
const express_1 = __importDefault(require("express"));
const __1 = require("../");
const helpers_2 = require("./helpers");
const integrationConfig_1 = require("./helpers/integrationConfig");
const CUSTOMER_ID = "queueitknownusertst";
const API_KEY = "d6bbb9f0-31e9-4ba7-903a-113781ab3d30";
const SECRET_KEY = "954656b7-bcfa-4de5-9c82-ff3805edd953737070fd-2f5d-4a11-b5ac-5c23e1b097b1";
const ORIGIN = {
    host: "cloudflareknownuser.cloudflare-queue-it.com.s3-website-eu-west-1.amazonaws.com",
    hostInHeaders: "cloudflareknownuser.cloudflare-queue-it.com"
};
const PORT = process.env.PORT || 80;
(0, __1.setIntegrationDetails)(CUSTOMER_ID, SECRET_KEY);
const kvStorage = {};
global.IntegrationConfigKV = {
    get: (fieldName) => kvStorage[fieldName],
    put: (field, value) => kvStorage[field] = value
};
global.Request = helpers_2.Request;
global.Response = helpers_2.Response;
const app = (0, express_1.default)();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        kvStorage["info"] = yield (0, integrationConfig_1.getIntegrationConfiguration)(CUSTOMER_ID, API_KEY);
        app.listen(PORT, () => console.log(`Test server listening on port ${PORT}`));
    });
}
app.use(function (req, res, next) {
    req.pipe(concat(function (data) {
        req.body = data;
        next();
    }));
});
app.use((req, res, _) => __awaiter(void 0, void 0, void 0, function* () {
    const cflRequest = new helpers_1.CloudFlareRequestWrapper(req);
    let queueitResponse = yield (0, __1.onClientRequest)(cflRequest);
    if (queueitResponse) {
        queueitResponse = yield (0, __1.onClientResponse)(queueitResponse);
        //it is a redirect- break the flow
        res.status(parseInt(queueitResponse.statusText, 10))
            .header((0, helpers_1.getHeadersFromCloudflareResponse)(queueitResponse))
            .send(queueitResponse.body);
        return;
    }
    // Call origin if the connector returned null | undefined
    let originResponse = yield (0, helpers_1.callOrigin)(ORIGIN, req);
    originResponse = yield (0, __1.onClientResponse)(originResponse);
    res.status(parseInt(originResponse.statusText || "200", 10))
        .header((0, helpers_1.getHeadersFromCloudflareResponse)(originResponse))
        .send(originResponse.body);
}));
main();
//# sourceMappingURL=testServer.js.map