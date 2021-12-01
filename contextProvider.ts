import {IHttpContextProvider, IHttpRequest, IHttpResponse} from 'queueit-knownuser/dist/HttpContextProvider'

export default class CloudflareHttpContextProvider implements IHttpContextProvider {
    _httpRequest: RequestProvider;
    _httpResponse: ResponseProvider;
    _outputCookie: string;

    isError: boolean;

    constructor(public request: any, public bodyString: string) {
        this._httpRequest = new RequestProvider(this);
        this._httpResponse = new ResponseProvider(this);
    }

    public getHttpRequest() {
        return this._httpRequest;
    }

    public getHttpResponse() {
        return this._httpResponse;
    }

    public setOutputCookie(setCookie: string) {
        this._outputCookie = setCookie;
    }

    public getOutputCookie() {
        return this._outputCookie;
    }
}

class RequestProvider implements IHttpRequest {
    _parsedCookieDic: Record<string, string>;

    constructor(private _context: CloudflareHttpContextProvider) {
    }

    public getUserAgent() {
        return this.getHeader("user-agent");
    }

    public getHeader(name: string) {
        return this._context.request.headers.get(name) || "";
    }

    public getAbsoluteUri() {
        return this._context.request.url;
    }

    public getUserHostAddress() {
        return this.getHeader("cf-connecting-ip");
    }

    public getCookieValue(name: string) {
        if (!this._parsedCookieDic) {
            this._parsedCookieDic = this.__parseCookies(this.getHeader('cookie'));
        }
        var cookieValue = this._parsedCookieDic[name];

        if (cookieValue)
            return decodeURIComponent(cookieValue);

        return cookieValue;
    }

    public getRequestBodyAsString() {
        return this._context.bodyString;
    }

    private __parseCookies(cookieValue: string) {
        let parsedCookie = {};
        cookieValue.split(';').forEach(function (cookie) {
            if (cookie) {
                var parts = cookie.split('=');
                if (parts.length >= 2)
                    parsedCookie[parts[0].trim()] = parts[1].trim();
            }
        });
        return parsedCookie;
    }

}

class ResponseProvider implements IHttpResponse {
    constructor(private _context: CloudflareHttpContextProvider) {
    }

    public setCookie(cookieName: string, cookieValue: string, domain: string, expiration: number, httpOnly: boolean, isSecure: boolean) {

        // expiration is in secs, but Date needs it in milisecs
        let expirationDate = new Date(expiration * 1000);

        let setCookieString = `${cookieName}=${encodeURIComponent(cookieValue)}; expires=${expirationDate.toUTCString()};`;
        if (domain) {
            setCookieString += ` domain=${domain};`;
        }

        if (httpOnly) {
            setCookieString += ' HttpOnly;'
        }

        if (isSecure) {
            setCookieString += ' Secure;'
        }

        setCookieString += " path=/";
        this._context.setOutputCookie(setCookieString);
    }
}
