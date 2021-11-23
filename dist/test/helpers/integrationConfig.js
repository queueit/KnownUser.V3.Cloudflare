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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntegrationConfiguration = void 0;
const https = require("https");
const CacheTimeoutMS = 5 * 60 * 1000;
const RequestTimeoutMS = 1000;
let GlobalCache = null;
function getIntegrationConfiguration(customerId, apiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            if (isGLobalCacheValid()) {
                resolve(GlobalCache.integrationConfig);
                return;
            }
            const options = {
                hostname: `${customerId}.test.queue-it.net`,
                path: `/status/integrationconfig/secure/${customerId}`,
                method: 'GET',
                headers: { 'api-key': apiKey },
                port: 443
            };
            let request = https.get(options, (resp) => {
                let data = '';
                resp.setEncoding('utf8');
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    if (resp.statusCode == 200) {
                        const newCached = {
                            expirationTime: (Date.now()) + CacheTimeoutMS,
                            integrationConfig: data
                        };
                        GlobalCache = newCached;
                        resolve(GlobalCache.integrationConfig);
                    }
                    else {
                        reject(new Error(data));
                    }
                });
            });
            request.on('error', (error) => reject(error));
            request.setTimeout(RequestTimeoutMS, () => {
                let timeoutMessage = `Timeout: It took more than ${RequestTimeoutMS} to retrieve Integrationconfig.`;
                if (GlobalCache) {
                    console.log(timeoutMessage + ' (using old config)');
                    resolve(GlobalCache.integrationConfig);
                }
                else {
                    reject(new Error(timeoutMessage));
                }
            });
        });
    });
}
exports.getIntegrationConfiguration = getIntegrationConfiguration;
;
function isGLobalCacheValid() {
    return GlobalCache &&
        (GlobalCache.expirationTime.valueOf() > Date.now());
}
//# sourceMappingURL=integrationConfig.js.map