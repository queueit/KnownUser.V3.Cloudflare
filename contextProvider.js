exports.getHttpHandler = function(request, bodyString)
{   
  var httpProvider =  {
        getHttpRequest: function () {
            var httpRequest = {
                getUserAgent: function () {
                    return this.getHeader("user-agent");
                },
                getHeader: function (headerNameArg) {
                   return request.headers.get(headerNameArg) || "";
                },
                getAbsoluteUri: function () {
                    return request.url;
                },
                getUserHostAddress: function () {
                    return this.getHeader("cf-connecting-ip");
                },
                getCookieValue: function (cookieKey) {
                    if (!this.parsedCookieDic) {
                        this.parsedCookieDic = this.__parseCookies(this.getHeader('cookie'));
                    }
                    return decodeURIComponent(this.parsedCookieDic[cookieKey]);
                },
                getBodyAsString:function()
                {
                    return bodyString;
                },
				 __parseCookies:function(cookieValue) {
				  let parsedCookie = [];
					  cookieValue.split(';').forEach(function (cookie) {
								if (cookie) {
									var parts = cookie.split('=');
									if (parts.length >= 2)
										parsedCookie[parts[0].trim()] = parts[1].trim();
								}
							});
					return parsedCookie;
				}
				
            };
            return httpRequest;
        },
        getHttpResponse: function () {
            var httpResponse = {
                setCookie: function (cookieName, cookieValue, domain, expiration) {

                    // expiration is in secs, but Date needs it in milisecs
                    let expirationDate = new Date(expiration * 1000);

                    var setCookieString = `${cookieName}=${encodeURIComponent(cookieValue)}; expires=${expirationDate.toGMTString()};`;
                    if (domain) {
                        setCookieString += ` domain=${domain};`;
                    }
                    setCookieString += " path=/";
                    httpProvider.outputCookie = setCookieString;

                }
            };
            return httpResponse;
        },
  };
  return httpProvider;
};
