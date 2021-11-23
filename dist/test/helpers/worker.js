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
exports.Headers = exports.Response = exports.ReadableStreamDefaultReader = exports.Request = exports.Body = void 0;
class Body {
    constructor(init) {
        if (!init) {
            return;
        }
        this.body = init;
    }
    arrayBuffer() {
        return new Promise((res, rej) => {
            res(this.body);
        });
    }
    text() {
        return new Promise((res) => {
            res(this.body.toString());
        });
    }
    json() {
        return new Promise((res) => __awaiter(this, void 0, void 0, function* () {
            const text = yield this.text();
            const data = JSON.parse(text || "");
            res(data);
        }));
    }
}
exports.Body = Body;
class Request extends Body {
    constructor(input, init) {
        super(init === null || init === void 0 ? void 0 : init.body);
        if (typeof input === "string") {
            this.url = input;
        }
        if (init == null)
            return;
        this.method = init.method || "";
        this.headers = init.headers || new Headers();
        this.redirect = "";
    }
    clone() {
        return this;
    }
}
exports.Request = Request;
class ReadableStreamDefaultReader {
}
exports.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
class Response extends Body {
    constructor(bodyInit, maybeInit) {
        super(bodyInit);
        if (!maybeInit) {
            this.headers = new Headers();
            this.status = 200;
            this.statusText = "200";
            return;
        }
        this.headers = maybeInit.headers || new Headers();
        this.status = maybeInit.status || 200;
        this.statusText = this.status.toString();
    }
    clone() {
        return this;
    }
}
exports.Response = Response;
class Headers {
    constructor() {
        this.headers = {};
    }
    get(name) {
        return this.headers[name];
    }
    getAll(name) {
        return (this.headers[name] || "").split(";");
    }
    has(name) {
        return !!this.headers[name];
    }
    set(name, value) {
        this.headers[name] = value;
    }
    append(name, value) {
        let c = this.get(name) || "";
        if (c == "")
            c = value;
        else {
            c += "; " + value;
        }
        this.headers[name] = c;
    }
    delete(name) {
        delete this.headers[name];
    }
    forEach(callback) {
        const keys = Object.keys(this.headers);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            callback(key, this.headers[key]);
        }
    }
    keys() {
        return Object.keys(this.headers);
    }
    values() {
        return Object.values(this.headers);
    }
}
exports.Headers = Headers;
//# sourceMappingURL=worker.js.map