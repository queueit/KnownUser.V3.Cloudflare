"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeadersFromExpress = exports.getHeadersFromCloudflareResponse = exports.CloudFlareRequestWrapper = void 0;
const _1 = require("./");
class CloudFlareRequestWrapper extends _1.Request {
    constructor(req) {
        super(req.url, {
            url: req.url,
            method: req.method,
            headers: getHeadersFromExpress(req),
            body: req.body
        });
    }
}
exports.CloudFlareRequestWrapper = CloudFlareRequestWrapper;
function getHeadersFromCloudflareResponse(resp) {
    const headers = {};
    resp.headers.forEach((k, v) => {
        headers[k] = v;
    });
    return headers;
}
exports.getHeadersFromCloudflareResponse = getHeadersFromCloudflareResponse;
function getHeadersFromExpress(req) {
    const headers = new _1.Headers();
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
        const key = req.rawHeaders[i];
        const value = req.rawHeaders[i + 1];
        // console.log(`  ${key}: ${value}`);
        const lowerKey = key.toLowerCase();
        if (headers.has(lowerKey)) {
            headers.append(lowerKey, value);
        }
        else {
            headers.set(lowerKey, value);
        }
    }
    return headers;
}
exports.getHeadersFromExpress = getHeadersFromExpress;
//# sourceMappingURL=request.js.map