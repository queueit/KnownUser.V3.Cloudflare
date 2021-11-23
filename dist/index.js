var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let QUEUEIT_CUSTOMERID = "YOUR CUSTOMERID";
let QUEUEIT_SECRETKEY = "YOUR SECRET KEY";
const { onClientRequest, onClientResponse } = require("./requestResponseHandler.js");
exports.setIntegrationDetails = (customerId, secretKey) => {
    QUEUEIT_CUSTOMERID = customerId;
    QUEUEIT_SECRETKEY = secretKey;
};
exports.onClientRequest = (request) => __awaiter(this, void 0, void 0, function* () {
    return yield onClientRequest(request, QUEUEIT_CUSTOMERID, QUEUEIT_SECRETKEY);
});
exports.onClientResponse = (response) => __awaiter(this, void 0, void 0, function* () {
    return yield onClientResponse(response);
});
//# sourceMappingURL=index.js.map