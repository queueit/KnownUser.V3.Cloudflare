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
                KnownUser._resolveQueueRequestByLocalConfig = function (targetUrl, queueitToken, queueConfig, customerId, secretKey, httpContextProvider, debugEntries, isDebug) {
                    if (isDebug) {
                        debugEntries["SdkVersion"] = SDK.UserInQueueService.SDK_VERSION;
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
                KnownUser._cancelRequestByLocalConfig = function (targetUrl, queueitToken, cancelConfig, customerId, secretKey, httpContextProvider, debugEntries, isDebug) {
                    targetUrl = this.generateTargetUrl(targetUrl, httpContextProvider);
                    if (isDebug) {
                        debugEntries["SdkVersion"] = SDK.UserInQueueService.SDK_VERSION;
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
                KnownUser.handleQueueAction = function (currentUrlWithoutQueueITToken, queueitToken, customerIntegrationInfo, customerId, secretKey, matchedConfig, httpContextProvider, debugEntries, isDebug) {
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
                    var queueEventConfig = new SDK.QueueEventConfig(matchedConfig.EventId, matchedConfig.LayoutName, matchedConfig.Culture, matchedConfig.QueueDomain, matchedConfig.ExtendCookieValidity, matchedConfig.CookieValidityMinute, matchedConfig.CookieDomain, customerIntegrationInfo.Version, matchedConfig.Name);
                    return this._resolveQueueRequestByLocalConfig(targetUrl, queueitToken, queueEventConfig, customerId, secretKey, httpContextProvider, debugEntries, isDebug);
                };
                KnownUser.handleCancelAction = function (currentUrlWithoutQueueITToken, queueitToken, customerIntegrationInfo, customerId, secretKey, matchedConfig, httpContextProvider, debugEntries, isDebug) {
                    var cancelEventConfig = new SDK.CancelEventConfig(matchedConfig.EventId, matchedConfig.QueueDomain, matchedConfig.CookieDomain, customerIntegrationInfo.Version, matchedConfig.Name);
                    var targetUrl = this.generateTargetUrl(currentUrlWithoutQueueITToken, httpContextProvider);
                    return this._cancelRequestByLocalConfig(targetUrl, queueitToken, cancelEventConfig, customerId, secretKey, httpContextProvider, debugEntries, isDebug);
                };
                KnownUser.handleIgnoreAction = function (httpContextProvider, actionName) {
                    var userInQueueService = this.getUserInQueueService(httpContextProvider);
                    var result = userInQueueService.getIgnoreResult(actionName);
                    result.isAjaxResult = this.isQueueAjaxCall(httpContextProvider);
                    return result;
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
                    var connectorDiagnostics = SDK.ConnectorDiagnostics.verify(customerId, secretKey, queueitToken);
                    if (connectorDiagnostics.hasError)
                        return connectorDiagnostics.validationResult;
                    try {
                        targetUrl = this.generateTargetUrl(targetUrl, httpContextProvider);
                        return this._resolveQueueRequestByLocalConfig(targetUrl, queueitToken, queueConfig, customerId, secretKey, httpContextProvider, debugEntries, connectorDiagnostics.isEnabled);
                    }
                    catch (e) {
                        if (connectorDiagnostics.isEnabled)
                            debugEntries["Exception"] = e.message;
                        throw e;
                    }
                    finally {
                        this.setDebugCookie(debugEntries, httpContextProvider);
                    }
                };
                KnownUser.validateRequestByIntegrationConfig = function (currentUrlWithoutQueueITToken, queueitToken, integrationsConfigString, customerId, secretKey, httpContextProvider) {
                    var debugEntries = {};
                    var customerIntegrationInfo;
                    var connectorDiagnostics = SDK.ConnectorDiagnostics.verify(customerId, secretKey, queueitToken);
                    if (connectorDiagnostics.hasError)
                        return connectorDiagnostics.validationResult;
                    try {
                        if (connectorDiagnostics.isEnabled) {
                            debugEntries["SdkVersion"] = SDK.UserInQueueService.SDK_VERSION;
                            debugEntries["PureUrl"] = currentUrlWithoutQueueITToken;
                            debugEntries["QueueitToken"] = queueitToken;
                            debugEntries["OriginalUrl"] = httpContextProvider.getHttpRequest().getAbsoluteUri();
                            this.logExtraRequestDetails(debugEntries, httpContextProvider);
                        }
                        customerIntegrationInfo = JSON.parse(integrationsConfigString);
                        if (connectorDiagnostics.isEnabled) {
                            debugEntries["ConfigVersion"] = customerIntegrationInfo && customerIntegrationInfo.Version ? customerIntegrationInfo.Version.toString() : "NULL";
                        }
                        if (!currentUrlWithoutQueueITToken)
                            throw new SDK.KnownUserException("currentUrlWithoutQueueITToken can not be null or empty.");
                        if (!customerIntegrationInfo || !customerIntegrationInfo.Version)
                            throw new SDK.KnownUserException("integrationsConfigString can not be null or empty.");
                        var configEvaluater = new SDK.IntegrationConfig.IntegrationEvaluator();
                        var matchedConfig = configEvaluater.getMatchedIntegrationConfig(customerIntegrationInfo, currentUrlWithoutQueueITToken, httpContextProvider.getHttpRequest());
                        if (connectorDiagnostics.isEnabled) {
                            debugEntries["MatchedConfig"] = matchedConfig ? matchedConfig.Name : "NULL";
                        }
                        if (!matchedConfig)
                            return new SDK.RequestValidationResult(null, null, null, null, null, null);
                        switch (matchedConfig.ActionType) {
                            case SDK.ActionTypes.QueueAction: {
                                return this.handleQueueAction(currentUrlWithoutQueueITToken, queueitToken, customerIntegrationInfo, customerId, secretKey, matchedConfig, httpContextProvider, debugEntries, connectorDiagnostics.isEnabled);
                            }
                            case SDK.ActionTypes.CancelAction: {
                                return this.handleCancelAction(currentUrlWithoutQueueITToken, queueitToken, customerIntegrationInfo, customerId, secretKey, matchedConfig, httpContextProvider, debugEntries, connectorDiagnostics.isEnabled);
                            }
                            default: {
                                return this.handleIgnoreAction(httpContextProvider, matchedConfig.Name);
                            }
                        }
                    }
                    catch (e) {
                        if (connectorDiagnostics.isEnabled)
                            debugEntries["Exception"] = e.message;
                        throw e;
                    }
                    finally {
                        this.setDebugCookie(debugEntries, httpContextProvider);
                    }
                };
                KnownUser.cancelRequestByLocalConfig = function (targetUrl, queueitToken, cancelConfig, customerId, secretKey, httpContextProvider) {
                    var debugEntries = {};
                    var connectorDiagnostics = SDK.ConnectorDiagnostics.verify(customerId, secretKey, queueitToken);
                    if (connectorDiagnostics.hasError)
                        return connectorDiagnostics.validationResult;
                    try {
                        return this._cancelRequestByLocalConfig(targetUrl, queueitToken, cancelConfig, customerId, secretKey, httpContextProvider, debugEntries, connectorDiagnostics.isEnabled);
                    }
                    catch (e) {
                        if (connectorDiagnostics.isEnabled)
                            debugEntries["Exception"] = e.message;
                        throw e;
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
                function QueueEventConfig(eventId, layoutName, culture, queueDomain, extendCookieValidity, cookieValidityMinute, cookieDomain, version, actionName) {
                    if (actionName === void 0) { actionName = 'unspecified'; }
                    this.eventId = eventId;
                    this.layoutName = layoutName;
                    this.culture = culture;
                    this.queueDomain = queueDomain;
                    this.extendCookieValidity = extendCookieValidity;
                    this.cookieValidityMinute = cookieValidityMinute;
                    this.cookieDomain = cookieDomain;
                    this.version = version;
                    this.actionName = actionName;
                }
                QueueEventConfig.prototype.getString = function () {
                    return "EventId:" + this.eventId + "&Version:" + this.version + "&ActionName:" + this.actionName + "&QueueDomain:" + this.queueDomain +
                        ("&CookieDomain:" + this.cookieDomain + "&ExtendCookieValidity:" + this.extendCookieValidity) +
                        ("&CookieValidityMinute:" + this.cookieValidityMinute + "&LayoutName:" + this.layoutName + "&Culture:" + this.culture);
                };
                return QueueEventConfig;
            }());
            SDK.QueueEventConfig = QueueEventConfig;
            var CancelEventConfig = /** @class */ (function () {
                function CancelEventConfig(eventId, queueDomain, cookieDomain, version, actionName) {
                    if (actionName === void 0) { actionName = 'unspecified'; }
                    this.eventId = eventId;
                    this.queueDomain = queueDomain;
                    this.cookieDomain = cookieDomain;
                    this.version = version;
                    this.actionName = actionName;
                }
                CancelEventConfig.prototype.getString = function () {
                    return "EventId:" + this.eventId + "&Version:" + this.version +
                        ("&QueueDomain:" + this.queueDomain + "&CookieDomain:" + this.cookieDomain + "&ActionName:" + this.actionName);
                };
                return CancelEventConfig;
            }());
            SDK.CancelEventConfig = CancelEventConfig;
            var RequestValidationResult = /** @class */ (function () {
                function RequestValidationResult(actionType, eventId, queueId, redirectUrl, redirectType, actionName) {
                    this.actionType = actionType;
                    this.eventId = eventId;
                    this.queueId = queueId;
                    this.redirectUrl = redirectUrl;
                    this.redirectType = redirectType;
                    this.actionName = actionName;
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
                    return encodeURIComponent(url).replace(/[!'()*]/g, function (c) {
                        // More stringent in adhering to RFC 3986 (which reserves!, ', (, ), and *)
                        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
                        return '%' + c.charCodeAt(0).toString(16);
                    });
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
                    if (!queueitToken) {
                        return null;
                    }
                    var result = new QueueUrlParams();
                    result.queueITToken = queueitToken;
                    var paramList = result.queueITToken.split(QueueParameterHelper.KeyValueSeparatorGroupChar);
                    for (var _i = 0, paramList_1 = paramList; _i < paramList_1.length; _i++) {
                        var paramKeyValue = paramList_1[_i];
                        var keyValueArr = paramKeyValue.split(QueueParameterHelper.KeyValueSeparatorChar);
                        if (keyValueArr.length !== 2) {
                            continue;
                        }
                        switch (keyValueArr[0]) {
                            case QueueParameterHelper.HashKey:
                                result.hashCode = keyValueArr[1] || "";
                                break;
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
            var ConnectorDiagnostics = /** @class */ (function () {
                function ConnectorDiagnostics() {
                    this.isEnabled = false;
                    this.hasError = false;
                }
                ConnectorDiagnostics.prototype.setStateWithTokenError = function (customerId, errorCode) {
                    this.hasError = true;
                    var redirectUrl = "https://" + customerId + ".api2.queue-it.net/" + customerId + "/diagnostics/connector/error/?code=" + errorCode;
                    this.validationResult = new SDK.RequestValidationResult("ConnectorDiagnosticsRedirect", null, null, redirectUrl, null, null);
                };
                ConnectorDiagnostics.prototype.setStateWithSetupError = function () {
                    this.hasError = true;
                    this.validationResult = new SDK.RequestValidationResult("ConnectorDiagnosticsRedirect", null, null, "https://api2.queue-it.net/diagnostics/connector/error/?code=setup", null, null);
                };
                ConnectorDiagnostics.verify = function (customerId, secretKey, queueitToken) {
                    var diagnostics = new ConnectorDiagnostics();
                    var qParams = QueueParameterHelper.extractQueueParams(queueitToken);
                    if (qParams == null)
                        return diagnostics;
                    if (qParams.redirectType == null)
                        return diagnostics;
                    if (qParams.redirectType !== "debug")
                        return diagnostics;
                    if (!(customerId && secretKey)) {
                        diagnostics.setStateWithSetupError();
                        return diagnostics;
                    }
                    if (Utils.generateSHA256Hash(secretKey, qParams.queueITTokenWithoutHash) != qParams.hashCode) {
                        diagnostics.setStateWithTokenError(customerId, "hash");
                        return diagnostics;
                    }
                    if (qParams.timeStamp < Utils.getCurrentTime()) {
                        diagnostics.setStateWithTokenError(customerId, "timestamp");
                        return diagnostics;
                    }
                    diagnostics.isEnabled = true;
                    return diagnostics;
                };
                return ConnectorDiagnostics;
            }());
            SDK.ConnectorDiagnostics = ConnectorDiagnostics;
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
                }
                UserInQueueService.prototype.getValidTokenResult = function (config, queueParams, secretKey) {
                    this.userInQueueStateRepository.store(config.eventId, queueParams.queueId, queueParams.cookieValidityMinutes, config.cookieDomain, queueParams.redirectType, secretKey);
                    return new SDK.RequestValidationResult(SDK.ActionTypes.QueueAction, config.eventId, queueParams.queueId, null, queueParams.redirectType, config.actionName);
                };
                UserInQueueService.prototype.getErrorResult = function (customerId, targetUrl, config, qParams, errorCode) {
                    var query = this.getQueryString(customerId, config.eventId, config.version, config.culture, config.layoutName, config.actionName) +
                        ("&queueittoken=" + qParams.queueITToken) +
                        ("&ts=" + SDK.Utils.getCurrentTime()) +
                        (targetUrl ? "&t=" + SDK.Utils.encodeUrl(targetUrl) : "");
                    var uriPath = "error/" + errorCode + "/";
                    var redirectUrl = this.generateRedirectUrl(config.queueDomain, uriPath, query);
                    return new SDK.RequestValidationResult(SDK.ActionTypes.QueueAction, config.eventId, null, redirectUrl, null, config.actionName);
                };
                UserInQueueService.prototype.getQueueResult = function (targetUrl, config, customerId) {
                    var query = this.getQueryString(customerId, config.eventId, config.version, config.culture, config.layoutName, config.actionName) +
                        (targetUrl ? "&t=" + SDK.Utils.encodeUrl(targetUrl) : "");
                    var redirectUrl = this.generateRedirectUrl(config.queueDomain, "", query);
                    return new SDK.RequestValidationResult(SDK.ActionTypes.QueueAction, config.eventId, null, redirectUrl, null, config.actionName);
                };
                UserInQueueService.prototype.getQueryString = function (customerId, eventId, configVersion, culture, layoutName, actionName) {
                    var queryStringList = new Array();
                    queryStringList.push("c=" + SDK.Utils.encodeUrl(customerId));
                    queryStringList.push("e=" + SDK.Utils.encodeUrl(eventId));
                    queryStringList.push("ver=" + UserInQueueService.SDK_VERSION);
                    queryStringList.push("cver=" + configVersion);
                    queryStringList.push("man=" + SDK.Utils.encodeUrl(actionName));
                    if (culture)
                        queryStringList.push("cid=" + SDK.Utils.encodeUrl(culture));
                    if (layoutName)
                        queryStringList.push("l=" + SDK.Utils.encodeUrl(layoutName));
                    return queryStringList.join("&");
                };
                UserInQueueService.prototype.generateRedirectUrl = function (queueDomain, uriPath, query) {
                    if (!SDK.Utils.endsWith(queueDomain, "/"))
                        queueDomain = queueDomain + "/";
                    var redirectUrl = "https://" + queueDomain + uriPath + "?" + query;
                    return redirectUrl;
                };
                UserInQueueService.prototype.validateQueueRequest = function (targetUrl, queueitToken, config, customerId, secretKey) {
                    var state = this.userInQueueStateRepository.getState(config.eventId, config.cookieValidityMinute, secretKey, true);
                    if (state.isValid) {
                        if (state.isStateExtendable() && config.extendCookieValidity) {
                            this.userInQueueStateRepository.store(config.eventId, state.queueId, null, config.cookieDomain, state.redirectType, secretKey);
                        }
                        return new SDK.RequestValidationResult(SDK.ActionTypes.QueueAction, config.eventId, state.queueId, null, state.redirectType, config.actionName);
                    }
                    var queueParams = SDK.QueueParameterHelper.extractQueueParams(queueitToken);
                    var requestValidationResult = null;
                    var isTokenValid = false;
                    if (queueParams != null) {
                        var tokenValidationResult = this.validateToken(config, queueParams, secretKey);
                        isTokenValid = tokenValidationResult.isValid;
                        if (isTokenValid) {
                            requestValidationResult = this.getValidTokenResult(config, queueParams, secretKey);
                        }
                        else {
                            requestValidationResult = this.getErrorResult(customerId, targetUrl, config, queueParams, tokenValidationResult.errorCode);
                        }
                    }
                    else {
                        requestValidationResult = this.getQueueResult(targetUrl, config, customerId);
                    }
                    if (state.isFound && !isTokenValid) {
                        this.userInQueueStateRepository.cancelQueueCookie(config.eventId, config.cookieDomain);
                    }
                    return requestValidationResult;
                };
                UserInQueueService.prototype.validateCancelRequest = function (targetUrl, config, customerId, secretKey) {
                    //we do not care how long cookie is valid while canceling cookie
                    var state = this.userInQueueStateRepository.getState(config.eventId, -1, secretKey, false);
                    if (state.isValid) {
                        this.userInQueueStateRepository.cancelQueueCookie(config.eventId, config.cookieDomain);
                        var query = this.getQueryString(customerId, config.eventId, config.version, null, null, config.actionName) +
                            (targetUrl ? "&r=" + SDK.Utils.encodeUrl(targetUrl) : "");
                        var uriPath = "cancel/" + customerId + "/" + config.eventId + "/";
                        var redirectUrl = this.generateRedirectUrl(config.queueDomain, uriPath, query);
                        return new SDK.RequestValidationResult(SDK.ActionTypes.CancelAction, config.eventId, state.queueId, redirectUrl, state.redirectType, config.actionName);
                    }
                    else {
                        return new SDK.RequestValidationResult(SDK.ActionTypes.CancelAction, config.eventId, null, null, null, config.actionName);
                    }
                };
                UserInQueueService.prototype.extendQueueCookie = function (eventId, cookieValidityMinutes, cookieDomain, secretKey) {
                    this.userInQueueStateRepository.reissueQueueCookie(eventId, cookieValidityMinutes, cookieDomain, secretKey);
                };
                UserInQueueService.prototype.getIgnoreResult = function (actionName) {
                    return new SDK.RequestValidationResult(SDK.ActionTypes.IgnoreAction, null, null, null, null, actionName);
                };
                UserInQueueService.prototype.validateToken = function (config, queueParams, secretKey) {
                    var calculatedHash = SDK.Utils.generateSHA256Hash(secretKey, queueParams.queueITTokenWithoutHash);
                    if (calculatedHash !== queueParams.hashCode)
                        return new TokenValidationResult(false, "hash");
                    if (queueParams.eventId !== config.eventId)
                        return new TokenValidationResult(false, "eventid");
                    if (queueParams.timeStamp < SDK.Utils.getCurrentTime())
                        return new TokenValidationResult(false, "timestamp");
                    return new TokenValidationResult(true, null);
                };
                UserInQueueService.SDK_VERSION = "v3-javascript-" + "3.6.1";
                return UserInQueueService;
            }());
            SDK.UserInQueueService = UserInQueueService;
            var TokenValidationResult = /** @class */ (function () {
                function TokenValidationResult(isValid, errorCode) {
                    this.isValid = isValid;
                    this.errorCode = errorCode;
                }
                return TokenValidationResult;
            }());
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
                            return new StateInfo(false, false, "", null, "");
                        var cookieValues = SDK.CookieHelper.toMapFromValue(cookie);
                        if (!this.isCookieValid(secretKey, cookieValues, eventId, cookieValidityMinutes, validateTime))
                            return new StateInfo(true, false, "", null, "");
                        return new StateInfo(true, true, cookieValues[UserInQueueStateCookieRepository._QueueIdKey], cookieValues[UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey]
                            ? parseInt(cookieValues[UserInQueueStateCookieRepository._FixedCookieValidityMinutesKey])
                            : null, cookieValues[UserInQueueStateCookieRepository._RedirectTypeKey]);
                    }
                    catch (ex) {
                        return new StateInfo(true, false, "", null, "");
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
                function StateInfo(isFound, isValid, queueId, fixedCookieValidityMinutes, redirectType) {
                    this.isFound = isFound;
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
                IntegrationConfig.UrlValidatorHelper = UrlValidatorHelper;
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
                IntegrationConfig.CookieValidatorHelper = CookieValidatorHelper;
                var UserAgentValidatorHelper = /** @class */ (function () {
                    function UserAgentValidatorHelper() {
                    }
                    UserAgentValidatorHelper.evaluate = function (triggerPart, userAgent) {
                        return ComparisonOperatorHelper.evaluate(triggerPart.Operator, triggerPart.IsNegative, triggerPart.IsIgnoreCase, userAgent, triggerPart.ValueToCompare, triggerPart.ValuesToCompare);
                    };
                    return UserAgentValidatorHelper;
                }());
                IntegrationConfig.UserAgentValidatorHelper = UserAgentValidatorHelper;
                var RequestBodyValidatorHelper = /** @class */ (function () {
                    function RequestBodyValidatorHelper() {
                    }
                    RequestBodyValidatorHelper.evaluate = function (triggerPart, bodyString) {
                        return ComparisonOperatorHelper.evaluate(triggerPart.Operator, triggerPart.IsNegative, triggerPart.IsIgnoreCase, bodyString, triggerPart.ValueToCompare, triggerPart.ValuesToCompare);
                    };
                    return RequestBodyValidatorHelper;
                }());
                IntegrationConfig.RequestBodyValidatorHelper = RequestBodyValidatorHelper;
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
                        if (valueToCompare === "*" && value)
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
                IntegrationConfig.ComparisonOperatorHelper = ComparisonOperatorHelper;
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
module = module || {};
(exports = (module.exports = QueueIT));
//# sourceMappingURL=queueit-knownuserv3-sdk.js.map