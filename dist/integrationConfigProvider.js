var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const crypto = require('js-sha256');
const helpers = require('./queueitHelpers');
const __IntegrationConfixFieldName = "info";
exports.tryStoreIntegrationConfig = function (request, integrationConfigKV, secretKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const bodyJSON = yield request.json();
        const hash = bodyJSON.hash;
        const configInHex = bodyJSON.integrationInfo;
        if (console && console.warn) {
            if (!hash) {
                console.warn("Hash is missing");
            }
            if (!configInHex) {
                console.warn("Integration configuration is missing");
            }
            if (integrationConfigKV == null) {
                console.warn("IntegrationConfigKV is not available");
            }
        }
        if (!(hash && configInHex)) {
            return false;
        }
        if (crypto.sha256.hmac(secretKey, configInHex) !== hash) {
            if (console && console.warn) {
                console.warn("Hash didn't match the expected value");
            }
            return false;
        }
        yield integrationConfigKV.put(__IntegrationConfixFieldName, helpers.hex2bin(configInHex));
        return true;
    });
};
exports.getIntegrationConfig = function (integrationConfigKV) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield integrationConfigKV.get(__IntegrationConfixFieldName, "text");
    });
};
//# sourceMappingURL=integrationConfigProvider.js.map