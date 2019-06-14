var QueueIT;
(function (QueueIT) {
    var KnownUserV3;
    (function (KnownUserV3) {
        var SDK;
        (function (SDK) {
            var KnownUser = /** @class */ (function () {
                function KnownUser() {
                }
                KnownUser.getUserInQueueService = function (httpContextProvider) {
                    if (!this.UserInQueueService) {
                        return new SDK.UserInQueueService(new SDK.UserInQueueStateCookieRepository(httpContextProvider));
                    }
                    return this.UserInQueueService;
                };
                KnownUser.isQueueAjaxCall = function (httpContextProvider) {
                    return !!httpContextProvider.getHttpRequest().getHeader(this.QueueITAjaxHeaderKey);
                };
                KnownUser.generateTargetUrl = function (originalTargetUrl, httpContextProvider) {
                    return !this.isQueueAjaxCall(httpContextProvider) ?
                        originalTargetUrl :
                        SDK.Utils.decodeUrl(httpContextProvider.getHttpRequest().getHeader(this.QueueITAjaxHeaderKey));
                };
                KnownUser.logExtraRequestDetails = function (debugEntries, httpContextProvider) {
                    debugEntries["ServerUtcTime"] = (new Date()).toISOString().split('.')[0] + "Z";
                    debugEntries["RequestIP"] = httpContextProvider.getHttpRequest().getUserHostAddress();
                    debugEntries["RequestHttpHeader_Via"] = httpContextProvider.getHttpRequest().getHeader("Via");
                    debugEntries["RequestHttpHeader_Forwarded"] = httpContextProvider.getHttpRequest().getHeader("Forwarded");
                    debugEntries["RequestHttpHeader_XForwardedFor"] = httpContextProvider.getHttpRequest().getHeader("X-Forwarded-For");
                    debugEntries["RequestHttpHeader_XForwardedHost"] = httpContextProvider.getHttpRequest().getHeader("X-Forwarded-Host");
                    debugEntries["RequestHttpHeader_XForwardedProto"] = httpContextProvider.getHttpRequest().getHeader("X-Forwarded-Proto");
                };
                KnownUser.getIsDebug = function (queueitToken, secretKey) {
                    var qParams = SDK.QueueParameterHelper.extractQueueParams(queueitToken);
                    if (qParams && qParams.redirectType && qParams.redirectType.toLowerCase() === "debug")
                        return SDK.Utils.generateSHA256Hash(secretKey, qParams.queueITTokenWithoutHash) === qParams.hashCode;
                    return false;
                };
                KnownUser.setDebugCookie = function (debugEntries, httpContextProvider) {
                    var cookieValue = "";
                    for (var key in debugEntries) {
                        cookieValue += key + "=" + debugEntries[key] + "|";
                    }
                    if (cookieValue.lastIndexOf("|") === cookieValue.length - 1) {
                        cookieValue = cookieValue.substring(0, cookieValue.length - 1);
                    }
                    if (!cookieValue)
                        return;
                    httpContextProvider.getHttpResponse().setCookie(this.QueueITDebugKey, cookieValue, null, SDK.Utils.getCurrentTime() + 20 * 60); // now + 20 mins
                };
                KnownUser._resolveQueueRequestByLocalConfig = function (targetUrl, queueitToken, queueConfig, customerId, secretKey, httpContextProvider, debugEntries) {
                    var isDebug = this.getIsDebug(queueitToken, secretKey);
                    if (isDebug) {
                        debugEntries["TargetUrl"] = targetUrl;
                        debugEntries["QueueitToken"] = queueitToken;
                        debugEntries["OriginalUrl"] = httpContextProvider.getHttpRequest().getAbsoluteUri();
                        debugEntries["QueueConfig"] = queueConfig !== null ? queueConfig.getString() : "NULL";
                        this.logExtraRequestDetails(debugEntries, httpContextProvider);
                    }
                    if (!customerId)
                        throw new SDK.KnownUserException("customerId can not be null or empty.");
                    if (!secretKey)
                        throw new SDK.KnownUserException("secretKey can not be null or empty.");
                    if (!queueConfig)
                        throw new SDK.KnownUserException("queueConfig can not be null.");
                    if (!queueConfig.eventId)
                        throw new SDK.KnownUserException("queueConfig.eventId can not be null or empty.");
                    if (!queueConfig.queueDomain)
                        throw new SDK.KnownUserException("queueConfig.queueDomain can not be null or empty.");
                    if (queueConfig.cookieValidityMinute <= 0)
                        throw new SDK.KnownUserException("queueConfig.cookieValidityMinute should be integer greater than 0.");
                    var userInQueueService = this.getUserInQueueService(httpContextProvider);
                    var result = userInQueueService.validateQueueRequest(targetUrl, queueitToken, queueConfig, customerId, secretKey);
                    result.isAjaxResult = this.isQueueAjaxCall(httpContextProvider);
                    return result;
                };
                KnownUser._cancelRequestByLocalConfig = function (targetUrl, queueitToken, cancelConfig, customerId, secretKey, httpContextProvider, debugEntries) {
                    targetUrl = this.generateTargetUrl(targetUrl, httpContextProvider);
                    var isDebug = this.getIsDebug(queueitToken, secretKey);
                    if (isDebug) {
                        debugEntries["TargetUrl"] = targetUrl;
                        debugEntries["QueueitToken"] = queueitToken;
                        debugEntries["CancelConfig"] = cancelConfig !== null ? cancelConfig.getString() : "NULL";
                        debugEntries["OriginalUrl"] = httpContextProvider.getHttpRequest().getAbsoluteUri();
                        this.logExtraRequestDetails(debugEntries, httpContextProvider);
                    }
                    if (!targetUrl)
                        throw new SDK.KnownUserException("targetUrl can not be null or empty.");
                    if (!customerId)
                        throw new SDK.KnownUserException("customerId can not be null or empty.");
                    if (!secretKey)
                        throw new SDK.KnownUserException("secretKey can not be null or empty.");
                    if (!cancelConfig)
                        throw new SDK.KnownUserException("cancelConfig can not be null.");
                    if (!cancelConfig.eventId)
                        throw new SDK.KnownUserException("cancelConfig.eventId can not be null or empty.");
                    if (!cancelConfig.queueDomain)
                        throw new SDK.KnownUserException("cancelConfig.queueDomain can not be null or empty.");
                    var userInQueueService = this.getUserInQueueService(httpContextProvider);
                    var result = userInQueueService.validateCancelRequest(targetUrl, cancelConfig, customerId, secretKey);
                    result.isAjaxResult = this.isQueueAjaxCall(httpContextProvider);
                    return result;
                };
                KnownUser.handleQueueAction = function (currentUrlWithoutQueueITToken, queueitToken, customerIntegrationInfo, customerId, secretKey, matchedConfig, httpContextProvider, debugEntries) {
                    var targetUrl = "";
                    switch (matchedConfig.RedirectLogic) {
                        case "ForcedTargetUrl":
                            targetUrl = matchedConfig.ForcedTargetUrl;
                            break;
                        case "EventTargetUrl":
                            targetUrl = "";
                            break;
                        default:
                            targetUrl = this.generateTargetUrl(currentUrlWithoutQueueITToken, httpContextProvider);
                            break;
                    }
                    var queueEventConfig = new SDK.QueueEventConfig(matchedConfig.EventId, matchedConfig.LayoutName, matchedConfig.Culture, matchedConfig.QueueDomain, matchedConfig.ExtendCookieValidity, matchedConfig.CookieValidityMinute, matchedConfig.CookieDomain, customerIntegrationInfo.Version);
                    return this._resolveQueueRequestByLocalConfig(targetUrl, queueitToken, queueEventConfig, customerId, secretKey, httpContextProvider, debugEntries);
                };
                KnownUser.handleCancelAction = function (currentUrlWithoutQueueITToken, queueitToken, customerIntegrationInfo, customerId, secretKey, matchedConfig, httpContextProvider, debugEntries) {
                    var cancelEventConfig = new SDK.CancelEventConfig(matchedConfig.EventId, matchedConfig.QueueDomain, matchedConfig.CookieDomain, customerIntegrationInfo.Version);
                    var targetUrl = this.generateTargetUrl(currentUrlWithoutQueueITToken, httpContextProvider);
                    return this._cancelRequestByLocalConfig(targetUrl, queueitToken, cancelEventConfig, customerId, secretKey, httpContextProvider, debugEntries);
                };
                KnownUser.extendQueueCookie = function (eventId, cookieValidityMinute, cookieDomain, secretKey, httpContextProvider) {
                    if (!eventId)
                        throw new SDK.KnownUserException("eventId can not be null or empty.");
                    if (!secretKey)
                        throw new SDK.KnownUserException("secretKey can not be null or empty.");
                    if (cookieValidityMinute <= 0)
                        throw new SDK.KnownUserException("cookieValidityMinute should be integer greater than 0.");
                    var userInQueueService = this.getUserInQueueService(httpContextProvider);
                    userInQueueService.extendQueueCookie(eventId, cookieValidityMinute, cookieDomain, secretKey);
                };
                KnownUser.resolveQueueRequestByLocalConfig = function (targetUrl, queueitToken, queueConfig, customerId, secretKey, httpContextProvider) {
                    var debugEntries = {};
                    try {
                        targetUrl = this.generateTargetUrl(targetUrl, httpContextProvider);
                        return this._resolveQueueRequestByLocalConfig(targetUrl, queueitToken, queueConfig, customerId, secretKey, httpContextProvider, debugEntries);
                    }
                    finally {
                        this.setDebugCookie(debugEntries, httpContextProvider);
                    }
                };
                KnownUser.validateRequestByIntegrationConfig = function (currentUrlWithoutQueueITToken, queueitToken, integrationsConfigString, customerId, secretKey, httpContextProvider) {
                    if (!currentUrlWithoutQueueITToken)
                        throw new SDK.KnownUserException("currentUrlWithoutQueueITToken can not be null or empty.");
                    if (!integrationsConfigString)
                        throw new SDK.KnownUserException("integrationsConfigString can not be null or empty.");
                    var debugEntries = {};
                    try {
                        var customerIntegrationInfo = JSON.parse(integrationsConfigString);
                        var isDebug = this.getIsDebug(queueitToken, secretKey);
                        if (isDebug) {
                            debugEntries["ConfigVersion"] = customerIntegrationInfo.Version.toString();
                            debugEntries["PureUrl"] = currentUrlWithoutQueueITToken;
                            debugEntries["QueueitToken"] = queueitToken;
                            debugEntries["OriginalUrl"] = httpContextProvider.getHttpRequest().getAbsoluteUri();
                            this.logExtraRequestDetails(debugEntries, httpContextProvider);
                        }
                        var configEvaluater = new SDK.IntegrationConfig.IntegrationEvaluator();
                        var matchedConfig = configEvaluater.getMatchedIntegrationConfig(customerIntegrationInfo, currentUrlWithoutQueueITToken, httpContextProvider.getHttpRequest());
                        if (isDebug) {
                            debugEntries["MatchedConfig"] = matchedConfig ? matchedConfig.Name : "NULL";
                        }
                        if (!matchedConfig)
                            return new SDK.RequestValidationResult(null, null, null, null, null);
                        switch (matchedConfig.ActionType) {
                            case SDK.ActionTypes.QueueAction: {
                                return this.handleQueueAction(currentUrlWithoutQueueITToken, queueitToken, customerIntegrationInfo, customerId, secretKey, matchedConfig, httpContextProvider, debugEntries);
                            }
                            case SDK.ActionTypes.CancelAction: {
                                return this.handleCancelAction(currentUrlWithoutQueueITToken, queueitToken, customerIntegrationInfo, customerId, secretKey, matchedConfig, httpContextProvider, debugEntries);
                            }
                            default: {
                                var userInQueueService = this.getUserInQueueService(httpContextProvider);
                                var result = userInQueueService.getIgnoreActionResult();
                                result.isAjaxResult = this.isQueueAjaxCall(httpContextProvider);
                                return result;
                            }
                        }
                    }
                    finally {
                        this.setDebugCookie(debugEntries, httpContextProvider);
                    }
                };
                KnownUser.cancelRequestByLocalConfig = function (targetUrl, queueitToken, cancelConfig, customerId, secretKey, httpContextProvider) {
                    var debugEntries = {};
                    try {
                        return this._cancelRequestByLocalConfig(targetUrl, queueitToken, cancelConfig, customerId, secretKey, httpContextProvider, debugEntries);
                    }
                    finally {
                        this.setDebugCookie(debugEntries, httpContextProvider);
                    }
                };
                KnownUser.QueueITTokenKey = "queueittoken";
                KnownUser.QueueITDebugKey = "queueitdebug";
                KnownUser.QueueITAjaxHeaderKey = "x-queueit-ajaxpageurl";
                KnownUser.UserInQueueService = null;
                return KnownUser;
            }());
            SDK.KnownUser = KnownUser;
        })(SDK = KnownUserV3.SDK || (KnownUserV3.SDK = {}));
    })(KnownUserV3 = QueueIT.KnownUserV3 || (QueueIT.KnownUserV3 = {}));
})(QueueIT || (QueueIT = {}));
var QueueIT;
(function (QueueIT) {
    var KnownUserV3;
    (function (KnownUserV3) {
        var SDK;
        (function (SDK) {
            var QueueEventConfig = /** @class */ (function () {
                function QueueEventConfig(eventId, layoutName, culture, queueDomain, extendCookieValidity, cookieValidityMinute, cookieDomain, version) {
                    this.eventId = eventId;
                    this.layoutName = layoutName;
                    this.culture = culture;
                    this.queueDomain = queueDomain;
                    this.extendCookieValidity = extendCookieValidity;
                    this.cookieValidityMinute = cookieValidityMinute;
                    this.cookieDomain = cookieDomain;
                    this.version = version;
                }
                QueueEventConfig.prototype.getString = function () {
                    return "EventId:" + this.eventId + "&Version:" + this.version + "&QueueDomain:" + this.queueDomain +
                        ("&CookieDomain:" + this.cookieDomain + "&ExtendCookieValidity:" + this.extendCookieValidity) +
                        ("&CookieValidityMinute:" + this.cookieValidityMinute + "&LayoutName:" + this.layoutName + "&Culture:" + this.culture);
                };
                return QueueEventConfig;
            }());
            SDK.QueueEventConfig = QueueEventConfig;
            var CancelEventConfig = /** @class */ (function () {
                function CancelEventConfig(eventId, queueDomain, cookieDomain, version) {
                    this.eventId = eventId;
                    this.queueDomain = queueDomain;
                    this.cookieDomain = cookieDomain;
                    this.version = version;
                }
                CancelEventConfig.prototype.getString = function () {
                    return "EventId:" + this.eventId + "&Version:" + this.version +
                        ("&QueueDomain:" + this.queueDomain + "&CookieDomain:" + this.cookieDomain);
                };
                return CancelEventConfig;
            }());
            SDK.CancelEventConfig = CancelEventConfig;
            var RequestValidationResult = /** @class */ (function () {
                function RequestValidationResult(actionType, eventId, queueId, redirectUrl, redirectType) {
                    this.actionType = actionType;
                    this.eventId = eventId;
                    this.queueId = queueId;
                    this.redirectUrl = redirectUrl;
                    this.redirectType = redirectType;
                }
                RequestValidationResult.prototype.doRedirect = function () {
                    return !!this.redirectUrl;
                };
                RequestValidationResult.prototype.getAjaxQueueRedirectHeaderKey = function () {
                    return "x-queueit-redirect";
                };
                RequestValidationResult.prototype.getAjaxRedirectUrl = function () {
                    if (this.redirectUrl) {
                        return SDK.Utils.encodeUrl(this.redirectUrl);
                    }
                    return "";
                };
                return RequestValidationResult;
            }());
            SDK.RequestValidationResult = RequestValidationResult;
            var KnownUserException = /** @class */ (function () {
                function KnownUserException(message) {
                    this.message = message;
                }
                return KnownUserException;
            }());
            SDK.KnownUserException = KnownUserException;
            var ActionTypes = /** @class */ (function () {
                function ActionTypes() {
                }
                ActionTypes.QueueAction = "Queue";
                ActionTypes.CancelAction = "Cancel";
                ActionTypes.IgnoreAction = "Ignore";
                return ActionTypes;
            }());
            SDK.ActionTypes = ActionTypes;
        })(SDK = KnownUserV3.SDK || (KnownUserV3.SDK = {}));
    })(KnownUserV3 = QueueIT.KnownUserV3 || (QueueIT.KnownUserV3 = {}));
})(QueueIT || (QueueIT = {}));
var QueueIT;
(function (QueueIT) {
    var KnownUserV3;
    (function (KnownUserV3) {
        var SDK;
        (function (SDK) {
            var Utils = /** @class */ (function () {
                function Utils() {
                }
                Utils.encodeUrl = function (url) {
                    if (!url)
                        return "";
                    url = url.replace(/ /g, "+"); // Replace whitespace with +
                    return encodeURIComponent(url);
                };
                Utils.decodeUrl = function (url) {
                    return decodeURIComponent(url);
                };
                Utils.generateSHA256Hash = function (secretKey, stringToHash) {
                    throw new SDK.KnownUserException("Missing implementation for generateSHA256Hash");
                };
                Utils.endsWith = function (str, search) {
                    if (str === search)
                        return true;
                    if (!str || !search)
                        return false;
                    return str.substring(str.length - search.length, str.length) === search;
                };
                Utils.getCurrentTime = function () {
                    return Math.floor(new Date().getTime() / 1000);
                };
                return Utils;
            }());
            SDK.Utils = Utils;
            var QueueUrlParams = /** @class */ (function () {
                function QueueUrlParams() {
                    this.timeStamp = 0;
                    this.extendableCookie = false;
                }
                return QueueUrlParams;
            }());
            SDK.QueueUrlParams = QueueUrlParams;
            var QueueParameterHelper = /** @class */ (function () {
                function QueueParameterHelper() {
                }
                QueueParameterHelper.extractQueueParams = function (queueitToken) {
                    try {
                        if (!queueitToken) {
                            return null;
                        }
                        var result = new QueueUrlParams();
                        result.queueITToken = queueitToken;
                        var paramList = result.queueITToken.split(QueueParameterHelper.KeyValueSeparatorGroupChar);
                        for (var _i = 0, paramList_1 = paramList; _i < paramList_1.length; _i++) {
                            var paramKeyValue = paramList_1[_i];
                            var keyValueArr = paramKeyValue.split(QueueParameterHelper.KeyValueSeparatorChar);
                            switch (keyValueArr[0]) {
                                case QueueParameterHelper.TimeStampKey: {
                                    result.timeStamp = parseInt(keyValueArr[1]);
                                    if (!result.timeStamp) {
                                        result.timeStamp = 0;
                                    }
                                    break;
                                }
                                case QueueParameterHelper.CookieValidityMinutesKey: {
                                    result.cookieValidityMinutes = parseInt(keyValueArr[1]);
                                    if (!result.cookieValidityMinutes) {
                                        result.cookieValidityMinutes = null;
                                    }
                                    break;
                                }
                                case QueueParameterHelper.EventIdKey:
                                    result.eventId = keyValueArr[1] || "";
                                    break;
                                case QueueParameterHelper.ExtendableCookieKey: {
                                    var extendCookie = (keyValueArr[1] || "false").toLowerCase();
                                    result.extendableCookie = extendCookie === "true";
                                    break;
                                }
                                case QueueParameterHelper.HashKey:
                                    result.hashCode = keyValueArr[1] || "";
                                    break;
                                case QueueParameterHelper.QueueIdKey:
                                    result.queueId = keyValueArr[1] || "";
                                    break;
                                case QueueParameterHelper.RedirectTypeKey:
                                    result.redirectType = keyValueArr[1] || "";
                                    break;
                            }
                        }
                        var hashWithPrefix = "" + QueueParameterHelper.KeyValueSeparatorGroupChar + QueueParameterHelper.HashKey + QueueParameterHelper.KeyValueSeparatorChar + result.hashCode;
                        result.queueITTokenWithoutHash = result.queueITToken.replace(hashWithPrefix, "");
                        return result;
                    }
                    catch (_a) {
                        return null;
                    }
                };
                QueueParameterHelper.TimeStampKey = "ts";
                QueueParameterHelper.ExtendableCookieKey = "ce";
                QueueParameterHelper.CookieValidityMinutesKey = "cv";
                QueueParameterHelper.HashKey = "h";
                QueueParameterHelper.EventIdKey = "e";
                QueueParameterHelper.QueueIdKey = "q";
                QueueParameterHelper.RedirectTypeKey = "rt";
                QueueParameterHelper.KeyValueSeparatorChar = '_';
                QueueParameterHelper.KeyValueSeparatorGroupChar = '~';
                return QueueParameterHelper;
            }());
            SDK.QueueParameterHelper = QueueParameterHelper;
            var CookieHelper = /** @class */ (function () {
                function CookieHelper() {
                }
                CookieHelper.toMapFromValue = function (cookieValue) {
                    try {
                        var result = {};
                        var decoded = cookieValue;
                        var items = decoded.split('&');
                        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                            var item = items_1[_i];
                            var keyValue = item.split('=');
                            result[keyValue[0]] = keyValue[1];
                        }
                        return result;
                    }
                    catch (_a) {
                        return {};
                    }
                };
                CookieHelper.toValueFromKeyValueCollection = function (cookieValues) {
                    var values = new Array();
                    for (var _i = 0, cookieValues_1 = cookieValues; _i < cookieValues_1.length; _i++) {
                        var keyVal = cookieValues_1[_i];
                        values.push(keyVal.key + "=" + keyVal.value);
                    }
                    var result = values.join("&");
                    return result;
                };
                return CookieHelper;
            }());
            SDK.CookieHelper = CookieHelper;
        })(SDK = KnownUserV3.SDK || (KnownUserV3.SDK = {}));
    })(KnownUserV3 = QueueIT.KnownUserV3 || (QueueIT.KnownUserV3 = {}));
})(QueueIT || (QueueIT = {}));
var QueueIT;
(function (QueueIT) {
    var KnownUserV3;
    (function (KnownUserV3) {
        var SDK;
        (function (SDK) {
            var UserInQueueService = /** @class */ (function () {
                function UserInQueueService(userInQueueStateRepository) {
                    this.userInQueueStateRepository = userInQueueStateRepository;
                    this.SDK_VERSION = "3.5.2";
                }
                UserInQueueService.prototype.getQueueITTokenValidationResult = function (targetUrl, eventId, config, queueParams, customerId, secretKey) {
                    var calculatedHash = SDK.Utils.generateSHA256Hash(secretKey, queueParams.queueITTokenWithoutHash);
                    if (calculatedHash !== queueParams.hashCode)
                        return this.getVaidationErrorResult(customerId, targetUrl, config, queueParams, "hash");
                    if (queueParams.eventId !== eventId)
                        return this.getVaidationErrorResult(customerId, targetUrl, config, queueParams, "eventid");
                    if (queueParams.timeStamp < SDK.Utils.getCurrentTime())
                        return this.getVaidationErrorResult(customerId, targetUrl, config, queueParams, "timestamp");
                    this.userInQueueStateRepository.store(config.eventId, queueParams.queueId, queueParams.cookieValidityMinutes, config.cookieDomain, queueParams.redirectType, secretKey);
                    return new SDK.RequestValidationResult(SDK.ActionTypes.QueueAction, config.eventId, queueParams.queueId, null, queueParams.redirectType);
                };
                UserInQueueService.prototype.getVaidationErrorResult = function (customerId, targetUrl, config, qParams, errorCode) {
                    var query = this.getQueryString(customerId, config.eventId, config.version, config.culture, config.layoutName) +
                        ("&queueittoken=" + qParams.queueITToken + "&ts=" + SDK.Utils.getCurrentTime()) +
                        (targetUrl ? "&t=" + SDK.Utils.encodeUrl(targetUrl) : "");
                    var domainAlias = config.queueDomain;
                    if (!SDK.Utils.endsWith(domainAlias, "/"))
                        domainAlias = domainAlias + "/";
                    var redirectUrl = "https://" + domainAlias + "error/" + errorCode + "/?" + query;
                    return new SDK.RequestValidationResult(SDK.ActionTypes.QueueAction, config.eventId, null, redirectUrl, null);
                };
                UserInQueueService.prototype.getInQueueRedirectResult = function (targetUrl, config, customerId) {
                    var redirectUrl = "https://" + config.queueDomain + "/?" +
                        this.getQueryString(customerId, config.eventId, config.version, config.culture, config.layoutName) +
                        (targetUrl ? "&t=" + SDK.Utils.encodeUrl(targetUrl) : "");
                    return new SDK.RequestValidationResult(SDK.ActionTypes.QueueAction, config.eventId, null, redirectUrl, null);
                };
                UserInQueueService.prototype.getQueryString = function (customerId, eventId, configVersion, culture, layoutName) {
                    var queryStringList = new Array();
                    queryStringList.push("c=" + SDK.Utils.encodeUrl(customerId));
                    queryStringList.push("e=" + SDK.Utils.encodeUrl(eventId));
                    queryStringList.push("ver=v3-javascript-" + this.SDK_VERSION);
                    queryStringList.push("cver=" + configVersion);
                    if (culture)
                        queryStringList.push("cid=" + SDK.Utils.encodeUrl(culture));
                    if (layoutName)
                        queryStringList.push("l=" + SDK.Utils.encodeUrl(layoutName));
                    return queryStringList.join("&");
                };
                UserInQueueService.prototype.validateQueueRequest = function (targetUrl, queueitToken, config, customerId, secretKey) {
                    var state = this.userInQueueStateRepository.getState(config.eventId, config.cookieValidityMinute, secretKey, true);
                    if (state.isValid) {
                        if (state.isStateExtendable() && config.extendCookieValidity) {
                            this.userInQueueStateRepository.store(config.eventId, state.queueId, null, config.cookieDomain, state.redirectType, secretKey);
                        }
                        return new SDK.RequestValidationResult(SDK.ActionTypes.QueueAction, config.eventId, state.queueId, null, state.redirectType);
                    }
                    var queueParmas = SDK.QueueParameterHelper.extractQueueParams(queueitToken);
                    if (queueParmas !== null) {
                        return this.getQueueITTokenValidationResult(targetUrl, config.eventId, config, queueParmas, customerId, secretKey);
                    }
                    else {
                        return this.getInQueueRedirectResult(targetUrl, config, customerId);
                    }
                };
                UserInQueueService.prototype.validateCancelRequest = function (targetUrl, config, customerId, secretKey) {
                    //we do not care how long cookie is valid while canceling cookie
                    var state = this.userInQueueStateRepository.getState(config.eventId, -1, secretKey, false);
                    if (state.isValid) {
                        this.userInQueueStateRepository.cancelQueueCookie(config.eventId, config.cookieDomain);
                        var query = this.getQueryString(customerId, config.eventId, config.version, null, null) +
                            (targetUrl ? "&r=" + SDK.Utils.encodeUrl(targetUrl) : "");
                        var domainAlias = config.queueDomain;
                        if (!SDK.Utils.endsWith(domainAlias, "/"))
                            domainAlias = domainAlias + "/";
                        var redirectUrl = "https://" + domainAlias + "cancel/" + customerId + "/" + config.eventId + "/?" + query;
                        return new SDK.RequestValidationResult(SDK.ActionTypes.CancelAction, config.eventId, state.queueId, redirectUrl, state.redirectType);
                    }
                    else {
                        return new SDK.RequestValidationResult(SDK.ActionTypes.CancelAction, config.eventId, null, null, null);
                    }
                };
                UserInQueueService.prototype.extendQueueCookie = function (eventId, cookieValidityMinutes, cookieDomain, secretKey) {
                    this.userInQueueStateRepository.reissueQueueCookie(eventId, cookieValidityMinutes, cookieDomain, secretKey);
                };
                UserInQueueService.prototype.getIgnoreActionResult = function () {
                    return new SDK.RequestValidationResult(SDK.ActionTypes.IgnoreAction, null, null, null, null);
                };
                return UserInQueueService;
            }());
            SDK.UserInQueueService = UserInQueueService;
        })(SDK = KnownUserV3.SDK || (KnownUserV3.SDK = {}));
    })(KnownUserV3 = QueueIT.KnownUserV3 || (QueueIT.KnownUserV3 = {}));
})(QueueIT || (QueueIT = {}));
var QueueIT;
(function (QueueIT) {
    var KnownUserV3;
    (function (KnownUserV3) {
        var SDK;
        (function (SDK) {
            var UserInQueueStateCookieRepository = /** @class */ (function () {
                function UserInQueueStateCookieRepository(httpContextProvider) {
                    this.httpContextProvider = httpContextProvider;
                }
                UserInQueueStateCookieRepository.getCookieKey = function (eventId) {
                    return UserInQueueStateCookieRepository._QueueITDataKey + "_" + eventId;
                };
                UserInQueueStateCookieRepository.prototype.store = function (eventId, queueId, fixedCookieValidityMinutes, cookieDomain, redirectType, secretKey) {
                    this.createCookie(eventId, queueId, fixedCookieValidityMinutes ? fixedCookieValidityMinutes.toString() : "", redirectType, cookieDomain, secretKey);
                };
                UserInQueueStateCookieRepository.prototype.createCookie = function (eventId, queueId, fixedCookieValidityMinutes, redirectType, cookieDomain, secretKey) {
                    var cookieKey = UserInQueueStateCookieRepository.getCookieKey(eventId);
                    var issueTime = SDK.Utils.getCurrentTime().toString();
                    var cookieValues = new Array();
                    cookieValues.push({ key: UserInQueueStateCookieRepository._EventIdKey, value: eventId });
                    cookieValues.push({ key: UserInQueueStateCookieRepository._QueueIdKey, value: queueId });
                    if (fixedCookieValidityMinutes) {
                        cookieValues.push({ key: UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey, value: fixedCookieValidityMinutes });
                    }
                    cookieValues.push({ key: UserInQueueStateCookieRepository._RedirectTypeKey, value: redirectType.toLowerCase() });
                    cookieValues.push({ key: UserInQueueStateCookieRepository._IssueTimeKey, value: issueTime });
                    cookieValues.push({
                        key: UserInQueueStateCookieRepository._HashKey,
                        value: this.generateHash(eventId.toLowerCase(), queueId, fixedCookieValidityMinutes, redirectType.toLowerCase(), issueTime, secretKey)
                    });
                    var tommorrow = new Date();
                    tommorrow.setDate(tommorrow.getDate() + 1);
                    var expire = Math.floor(tommorrow.getTime() / 1000);
                    this.httpContextProvider.getHttpResponse().setCookie(cookieKey, SDK.CookieHelper.toValueFromKeyValueCollection(cookieValues), cookieDomain, expire);
                };
                UserInQueueStateCookieRepository.prototype.getState = function (eventId, cookieValidityMinutes, secretKey, validateTime) {
                    try {
                        var cookieKey = UserInQueueStateCookieRepository.getCookieKey(eventId);
                        var cookie = this.httpContextProvider.getHttpRequest().getCookieValue(cookieKey);
                        if (!cookie)
                            return new StateInfo(false, "", null, "");
                        var cookieValues = SDK.CookieHelper.toMapFromValue(cookie);
                        if (!this.isCookieValid(secretKey, cookieValues, eventId, cookieValidityMinutes, validateTime))
                            return new StateInfo(false, "", null, "");
                        return new StateInfo(true, cookieValues[UserInQueueStateCookieRepository._QueueIdKey], cookieValues[UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey]
                            ? parseInt(cookieValues[UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey])
                            : null, cookieValues[UserInQueueStateCookieRepository._RedirectTypeKey]);
                    }
                    catch (ex) {
                        return new StateInfo(false, "", null, "");
                    }
                };
                UserInQueueStateCookieRepository.prototype.isCookieValid = function (secretKey, cookieValueMap, eventId, cookieValidityMinutes, validateTime) {
                    try {
                        var storedHash = cookieValueMap[UserInQueueStateCookieRepository._HashKey] || "";
                        var issueTimeString = cookieValueMap[UserInQueueStateCookieRepository._IssueTimeKey] || "";
                        var queueId = cookieValueMap[UserInQueueStateCookieRepository._QueueIdKey] || "";
                        var eventIdFromCookie = cookieValueMap[UserInQueueStateCookieRepository._EventIdKey] || "";
                        var redirectType = cookieValueMap[UserInQueueStateCookieRepository._RedirectTypeKey] || "";
                        var fixedCookieValidityMinutes = cookieValueMap[UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey] || "";
                        var expectedHash = this.generateHash(eventIdFromCookie, queueId, fixedCookieValidityMinutes, redirectType, issueTimeString, secretKey);
                        if (expectedHash !== storedHash)
                            return false;
                        if (eventId.toLowerCase() !== eventIdFromCookie.toLowerCase())
                            return false;
                        if (validateTime) {
                            var validity = fixedCookieValidityMinutes ? parseInt(fixedCookieValidityMinutes) : cookieValidityMinutes;
                            var expirationTime = parseInt(issueTimeString) + validity * 60;
                            if (expirationTime < SDK.Utils.getCurrentTime())
                                return false;
                        }
                        return true;
                    }
                    catch (_a) {
                        return false;
                    }
                };
                UserInQueueStateCookieRepository.prototype.cancelQueueCookie = function (eventId, cookieDomain) {
                    var cookieKey = UserInQueueStateCookieRepository.getCookieKey(eventId);
                    this.httpContextProvider.getHttpResponse().setCookie(cookieKey, "", cookieDomain, 0);
                };
                UserInQueueStateCookieRepository.prototype.reissueQueueCookie = function (eventId, cookieValidityMinutes, cookieDomain, secretKey) {
                    var cookieKey = UserInQueueStateCookieRepository.getCookieKey(eventId);
                    var cookie = this.httpContextProvider.getHttpRequest().getCookieValue(cookieKey);
                    if (!cookie)
                        return;
                    var cookieValues = SDK.CookieHelper.toMapFromValue(cookie);
                    if (!this.isCookieValid(secretKey, cookieValues, eventId, cookieValidityMinutes, true))
                        return;
                    var fixedCookieValidityMinutes = "";
                    if (cookieValues[UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey])
                        fixedCookieValidityMinutes = cookieValues[UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey].toString();
                    this.createCookie(eventId, cookieValues[UserInQueueStateCookieRepository._QueueIdKey], fixedCookieValidityMinutes, cookieValues[UserInQueueStateCookieRepository._RedirectTypeKey], cookieDomain, secretKey);
                };
                UserInQueueStateCookieRepository.prototype.generateHash = function (eventId, queueId, fixedCookieValidityMinutes, redirectType, issueTime, secretKey) {
                    var valueToHash = eventId + queueId + fixedCookieValidityMinutes + redirectType + issueTime;
                    return SDK.Utils.generateSHA256Hash(secretKey, valueToHash);
                };
                UserInQueueStateCookieRepository._QueueITDataKey = "QueueITAccepted-SDFrts345E-V3";
                UserInQueueStateCookieRepository._HashKey = "Hash";
                UserInQueueStateCookieRepository._IssueTimeKey = "IssueTime";
                UserInQueueStateCookieRepository._QueueIdKey = "QueueId";
                UserInQueueStateCookieRepository._EventIdKey = "EventId";
                UserInQueueStateCookieRepository._RedirectTypeKey = "RedirectType";
                UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey = "FixedValidityMins";
                return UserInQueueStateCookieRepository;
            }());
            SDK.UserInQueueStateCookieRepository = UserInQueueStateCookieRepository;
            var StateInfo = /** @class */ (function () {
                function StateInfo(isValid, queueId, fixedCookieValidityMinutes, redirectType) {
                    this.isValid = isValid;
                    this.queueId = queueId;
                    this.fixedCookieValidityMinutes = fixedCookieValidityMinutes;
                    this.redirectType = redirectType;
                }
                StateInfo.prototype.isStateExtendable = function () {
                    return this.isValid && !this.fixedCookieValidityMinutes;
                };
                return StateInfo;
            }());
            SDK.StateInfo = StateInfo;
        })(SDK = KnownUserV3.SDK || (KnownUserV3.SDK = {}));
    })(KnownUserV3 = QueueIT.KnownUserV3 || (QueueIT.KnownUserV3 = {}));
})(QueueIT || (QueueIT = {}));
var QueueIT;
(function (QueueIT) {
    var KnownUserV3;
    (function (KnownUserV3) {
        var SDK;
        (function (SDK) {
            var IntegrationConfig;
            (function (IntegrationConfig) {
                var IntegrationEvaluator = /** @class */ (function () {
                    function IntegrationEvaluator() {
                    }
                    IntegrationEvaluator.prototype.getMatchedIntegrationConfig = function (customerIntegration, currentPageUrl, request) {
                        if (!request)
                            throw new SDK.KnownUserException("request is null");
                        if (!customerIntegration)
                            throw new SDK.KnownUserException("customerIntegration is null");
                        for (var _i = 0, _a = customerIntegration.Integrations || []; _i < _a.length; _i++) {
                            var integration = _a[_i];
                            for (var _b = 0, _c = integration.Triggers; _b < _c.length; _b++) {
                                var trigger = _c[_b];
                                if (this.evaluateTrigger(trigger, currentPageUrl, request)) {
                                    return integration;
                                }
                            }
                        }
                        return null;
                    };
                    IntegrationEvaluator.prototype.evaluateTrigger = function (trigger, currentPageUrl, request) {
                        var part;
                        if (trigger.LogicalOperator === IntegrationConfig.LogicalOperatorType.Or) {
                            for (var _i = 0, _a = trigger.TriggerParts; _i < _a.length; _i++) {
                                part = _a[_i];
                                if (this.evaluateTriggerPart(part, currentPageUrl, request))
                                    return true;
                            }
                            return false;
                        }
                        else {
                            for (var _b = 0, _c = trigger.TriggerParts; _b < _c.length; _b++) {
                                part = _c[_b];
                                if (!this.evaluateTriggerPart(part, currentPageUrl, request))
                                    return false;
                            }
                            return true;
                        }
                    };
                    IntegrationEvaluator.prototype.evaluateTriggerPart = function (triggerPart, currentPageUrl, request) {
                        switch (triggerPart.ValidatorType) {
                            case IntegrationConfig.ValidatorType.UrlValidator:
                                return UrlValidatorHelper.evaluate(triggerPart, currentPageUrl);
                            case IntegrationConfig.ValidatorType.CookieValidator:
                                return CookieValidatorHelper.evaluate(triggerPart, request);
                            case IntegrationConfig.ValidatorType.UserAgentValidator:
                                return UserAgentValidatorHelper.evaluate(triggerPart, request.getUserAgent());
                            case IntegrationConfig.ValidatorType.HttpHeaderValidator:
                                return HttpHeaderValidatorHelper.evaluate(triggerPart, request.getHeader(triggerPart.HttpHeaderName));
                            case IntegrationConfig.ValidatorType.RequestBodyValidator:
                                return RequestBodyValidatorHelper.evaluate(triggerPart, request.getRequestBodyAsString());
                            default:
                                return false;
                        }
                    };
                    return IntegrationEvaluator;
                }());
                IntegrationConfig.IntegrationEvaluator = IntegrationEvaluator;
                var UrlValidatorHelper = /** @class */ (function () {
                    function UrlValidatorHelper() {
                    }
                    UrlValidatorHelper.evaluate = function (triggerPart, url) {
                        return ComparisonOperatorHelper.evaluate(triggerPart.Operator, triggerPart.IsNegative, triggerPart.IsIgnoreCase, this.getUrlPart(triggerPart, url), triggerPart.ValueToCompare, triggerPart.ValuesToCompare);
                    };
                    UrlValidatorHelper.getUrlPart = function (triggerPart, url) {
                        switch (triggerPart.UrlPart) {
                            case IntegrationConfig.UrlPartType.PagePath:
                                return this.getPathFromUrl(url);
                            case IntegrationConfig.UrlPartType.PageUrl:
                                return url;
                            case IntegrationConfig.UrlPartType.HostName:
                                return this.getHostNameFromUrl(url);
                            default:
                                return "";
                        }
                    };
                    UrlValidatorHelper.getHostNameFromUrl = function (url) {
                        var urlMatcher = /^(([^:/\?#]+):)?(\/\/([^/\?#]*))?([^\?#]*)(\?([^#]*))?(#(.*))?/;
                        var match = urlMatcher.exec(url);
                        if (match && match[4])
                            return match[4];
                        return "";
                    };
                    UrlValidatorHelper.getPathFromUrl = function (url) {
                        var urlMatcher = /^(([^:/\?#]+):)?(\/\/([^/\?#]*))?([^\?#]*)(\?([^#]*))?(#(.*))?/;
                        var match = urlMatcher.exec(url);
                        if (match && match[5])
                            return match[5];
                        return "";
                    };
                    return UrlValidatorHelper;
                }());
                var CookieValidatorHelper = /** @class */ (function () {
                    function CookieValidatorHelper() {
                    }
                    CookieValidatorHelper.evaluate = function (triggerPart, request) {
                        return ComparisonOperatorHelper.evaluate(triggerPart.Operator, triggerPart.IsNegative, triggerPart.IsIgnoreCase, this.getCookie(triggerPart.CookieName, request), triggerPart.ValueToCompare, triggerPart.ValuesToCompare);
                    };
                    CookieValidatorHelper.getCookie = function (cookieName, request) {
                        var cookie = request.getCookieValue(cookieName);
                        if (!cookie)
                            return "";
                        return cookie;
                    };
                    return CookieValidatorHelper;
                }());
                var UserAgentValidatorHelper = /** @class */ (function () {
                    function UserAgentValidatorHelper() {
                    }
                    UserAgentValidatorHelper.evaluate = function (triggerPart, userAgent) {
                        return ComparisonOperatorHelper.evaluate(triggerPart.Operator, triggerPart.IsNegative, triggerPart.IsIgnoreCase, userAgent, triggerPart.ValueToCompare, triggerPart.ValuesToCompare);
                    };
                    return UserAgentValidatorHelper;
                }());
                var RequestBodyValidatorHelper = /** @class */ (function () {
                    function RequestBodyValidatorHelper() {
                    }
                    RequestBodyValidatorHelper.evaluate = function (triggerPart, bodyString) {
                        return ComparisonOperatorHelper.evaluate(triggerPart.Operator, triggerPart.IsNegative, triggerPart.IsIgnoreCase, bodyString, triggerPart.ValueToCompare, triggerPart.ValuesToCompare);
                    };
                    return RequestBodyValidatorHelper;
                }());
                var HttpHeaderValidatorHelper = /** @class */ (function () {
                    function HttpHeaderValidatorHelper() {
                    }
                    HttpHeaderValidatorHelper.evaluate = function (triggerPart, headerValue) {
                        return ComparisonOperatorHelper.evaluate(triggerPart.Operator, triggerPart.IsNegative, triggerPart.IsIgnoreCase, headerValue, triggerPart.ValueToCompare, triggerPart.ValuesToCompare);
                    };
                    return HttpHeaderValidatorHelper;
                }());
                IntegrationConfig.HttpHeaderValidatorHelper = HttpHeaderValidatorHelper;
                var ComparisonOperatorHelper = /** @class */ (function () {
                    function ComparisonOperatorHelper() {
                    }
                    ComparisonOperatorHelper.evaluate = function (opt, isNegative, isIgnoreCase, value, valueToCompare, valuesToCompare) {
                        value = value || "";
                        valueToCompare = valueToCompare || "";
                        valuesToCompare = valuesToCompare || [];
                        switch (opt) {
                            case IntegrationConfig.ComparisonOperatorType.EqualS:
                                return ComparisonOperatorHelper.equalS(value, valueToCompare, isNegative, isIgnoreCase);
                            case IntegrationConfig.ComparisonOperatorType.Contains:
                                return ComparisonOperatorHelper.contains(value, valueToCompare, isNegative, isIgnoreCase);
                            case IntegrationConfig.ComparisonOperatorType.EqualsAny:
                                return ComparisonOperatorHelper.equalsAny(value, valuesToCompare, isNegative, isIgnoreCase);
                            case IntegrationConfig.ComparisonOperatorType.ContainsAny:
                                return ComparisonOperatorHelper.containsAny(value, valuesToCompare, isNegative, isIgnoreCase);
                            default:
                                return false;
                        }
                    };
                    ComparisonOperatorHelper.contains = function (value, valueToCompare, isNegative, ignoreCase) {
                        if (valueToCompare === "*")
                            return true;
                        var evaluation = false;
                        if (ignoreCase)
                            evaluation = value.toUpperCase().indexOf(valueToCompare.toUpperCase()) !== -1;
                        else
                            evaluation = value.indexOf(valueToCompare) !== -1;
                        if (isNegative)
                            return !evaluation;
                        else
                            return evaluation;
                    };
                    ComparisonOperatorHelper.equalS = function (value, valueToCompare, isNegative, ignoreCase) {
                        var evaluation = false;
                        if (ignoreCase)
                            evaluation = value.toUpperCase() === valueToCompare.toUpperCase();
                        else
                            evaluation = value === valueToCompare;
                        if (isNegative)
                            return !evaluation;
                        else
                            return evaluation;
                    };
                    ComparisonOperatorHelper.equalsAny = function (value, valuesToCompare, isNegative, isIgnoreCase) {
                        for (var _i = 0, valuesToCompare_1 = valuesToCompare; _i < valuesToCompare_1.length; _i++) {
                            var valueToCompare = valuesToCompare_1[_i];
                            if (ComparisonOperatorHelper.equalS(value, valueToCompare, false, isIgnoreCase))
                                return !isNegative;
                        }
                        return isNegative;
                    };
                    ComparisonOperatorHelper.containsAny = function (value, valuesToCompare, isNegative, isIgnoreCase) {
                        for (var _i = 0, valuesToCompare_2 = valuesToCompare; _i < valuesToCompare_2.length; _i++) {
                            var valueToCompare = valuesToCompare_2[_i];
                            if (ComparisonOperatorHelper.contains(value, valueToCompare, false, isIgnoreCase))
                                return !isNegative;
                        }
                        return isNegative;
                    };
                    return ComparisonOperatorHelper;
                }());
            })(IntegrationConfig = SDK.IntegrationConfig || (SDK.IntegrationConfig = {}));
        })(SDK = KnownUserV3.SDK || (KnownUserV3.SDK = {}));
    })(KnownUserV3 = QueueIT.KnownUserV3 || (QueueIT.KnownUserV3 = {}));
})(QueueIT || (QueueIT = {}));
var QueueIT;
(function (QueueIT) {
    var KnownUserV3;
    (function (KnownUserV3) {
        var SDK;
        (function (SDK) {
            var IntegrationConfig;
            (function (IntegrationConfig) {
                var IntegrationConfigModel = /** @class */ (function () {
                    function IntegrationConfigModel() {
                    }
                    return IntegrationConfigModel;
                }());
                IntegrationConfig.IntegrationConfigModel = IntegrationConfigModel;
                var CustomerIntegration = /** @class */ (function () {
                    function CustomerIntegration() {
                        this.Integrations = new Array();
                        this.Version = -1;
                    }
                    return CustomerIntegration;
                }());
                IntegrationConfig.CustomerIntegration = CustomerIntegration;
                var TriggerPart = /** @class */ (function () {
                    function TriggerPart() {
                    }
                    return TriggerPart;
                }());
                IntegrationConfig.TriggerPart = TriggerPart;
                var TriggerModel = /** @class */ (function () {
                    function TriggerModel() {
                        this.TriggerParts = new Array();
                    }
                    return TriggerModel;
                }());
                IntegrationConfig.TriggerModel = TriggerModel;
                var ValidatorType = /** @class */ (function () {
                    function ValidatorType() {
                    }
                    ValidatorType.UrlValidator = "UrlValidator";
                    ValidatorType.CookieValidator = "CookieValidator";
                    ValidatorType.UserAgentValidator = "UserAgentValidator";
                    ValidatorType.HttpHeaderValidator = "HttpHeaderValidator";
                    ValidatorType.RequestBodyValidator = "RequestBodyValidator";
                    return ValidatorType;
                }());
                IntegrationConfig.ValidatorType = ValidatorType;
                var UrlPartType = /** @class */ (function () {
                    function UrlPartType() {
                    }
                    UrlPartType.HostName = "HostName";
                    UrlPartType.PagePath = "PagePath";
                    UrlPartType.PageUrl = "PageUrl";
                    return UrlPartType;
                }());
                IntegrationConfig.UrlPartType = UrlPartType;
                var ComparisonOperatorType = /** @class */ (function () {
                    function ComparisonOperatorType() {
                    }
                    ComparisonOperatorType.EqualS = "Equals";
                    ComparisonOperatorType.Contains = "Contains";
                    ComparisonOperatorType.EqualsAny = "EqualsAny";
                    ComparisonOperatorType.ContainsAny = "ContainsAny";
                    ComparisonOperatorType.StartsWith = "StartsWith";
                    ComparisonOperatorType.EndsWith = "EndsWith";
                    ComparisonOperatorType.MatchesWith = "MatchesWith";
                    return ComparisonOperatorType;
                }());
                IntegrationConfig.ComparisonOperatorType = ComparisonOperatorType;
                var LogicalOperatorType = /** @class */ (function () {
                    function LogicalOperatorType() {
                    }
                    LogicalOperatorType.Or = "Or";
                    LogicalOperatorType.And = "And";
                    return LogicalOperatorType;
                }());
                IntegrationConfig.LogicalOperatorType = LogicalOperatorType;
                var ActionType = /** @class */ (function () {
                    function ActionType() {
                    }
                    ActionType.IgnoreAction = "Ignore";
                    ActionType.CancelAction = "Cancel";
                    ActionType.QueueAction = "Queue";
                    return ActionType;
                }());
                IntegrationConfig.ActionType = ActionType;
            })(IntegrationConfig = SDK.IntegrationConfig || (SDK.IntegrationConfig = {}));
        })(SDK = KnownUserV3.SDK || (KnownUserV3.SDK = {}));
    })(KnownUserV3 = QueueIT.KnownUserV3 || (QueueIT.KnownUserV3 = {}));
})(QueueIT || (QueueIT = {}));
//# sourceMappingURL=queueit-knownuserv3-sdk.js.map
module = module || {};
(exports = (module.exports = QueueIT));