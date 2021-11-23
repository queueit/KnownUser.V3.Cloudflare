"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.callHttpOrigin = exports.callOrigin = void 0;
const http = __importStar(require("http"));
const _1 = require("./");
function callOrigin(origin, request) {
    return __awaiter(this, void 0, void 0, function* () {
        const path = request.url;
        if (origin.hostInHeaders) {
            request.headers["host"] = origin.hostInHeaders;
        }
        return yield callHttpOrigin(origin.host, path, request.method, request.headers);
    });
}
exports.callOrigin = callOrigin;
function callHttpOrigin(originHost, path, method, headers) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            headers = headers || {};
            if (!headers['host']) {
                headers['host'] = originHost;
            }
            const options = {
                host: originHost,
                path: path,
                method: method || "GET",
                headers: headers || {}
            };
            const request = http.request(options, (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                res.on('error', (err) => reject(err));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const statusCode = res.statusCode || 200;
                    let resp = new _1.Response(buffer, {
                        status: statusCode,
                        statusText: statusCode.toString(),
                        headers: getHeadersFromIncomingHttpHeaders(res.headers),
                    });
                    resolve(resp);
                });
            });
            request.on('error', (e) => console.error(e));
            request.end();
        });
    });
}
exports.callHttpOrigin = callHttpOrigin;
function getHeadersFromIncomingHttpHeaders(incomingHttpHeaders) {
    const headers = new _1.Headers();
    const keys = Object.keys(incomingHttpHeaders);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = incomingHttpHeaders[key];
        if (Array.isArray(value))
            value = value[0];
        headers.set(key, value || "");
    }
    return headers;
}
//# sourceMappingURL=origin.js.map