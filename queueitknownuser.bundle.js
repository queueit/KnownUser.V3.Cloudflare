const QUEUEIT_CUSTOMERID = "YOUR CUSTOMERID"; 
const QUEUEIT_SECRETKEY = "YOUR SERCRET KEY";
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
'use strict'

const QueueIT = require("./sdk/queueit-knownuserv3-sdk.js");
const contextProvider = require("./contextProvider.js");
const helpers = require("./queueitHelpers.js");
const integrationConfigProvider = require("./integrationConfigProvider.js");


addEventListener('fetch', event => {   

    event.respondWith( fetchAndApply(event.request));
  })
  async function fetchAndApply(request) {

    if(request.url.indexOf('__push_queueit_config') > 0)
    {
      var result = await integrationConfigProvider.tryStoreIntegrationConfig(request,IntegrationConfigKV,QUEUEIT_SECRETKEY);
      return new Response(result? "Success!":"Fail!");
    }

    let integrationConfigJson = await integrationConfigProvider.getIntegrationConfig(IntegrationConfigKV) || "";

    helpers.configureKnownUserHashing();


    const bodyText = await request.clone().text();
    const httpProvider = contextProvider.getHttpHandler(request,bodyText);
    
    var knownUser = QueueIT.KnownUserV3.SDK.KnownUser;
    var queueitToken = helpers.getParameterByName(request.url,knownUser.QueueITTokenKey );
    var requestUrl = request.url;
    var requestUrlWithoutToken = requestUrl.replace(new RegExp("([\?&])(" + knownUser.QueueITTokenKey + "=[^&]*)", 'i'), "");
    // The requestUrlWithoutToken is used to match Triggeclearrs and as the Target url (where to return the users to).
    // It is therefor important that this is exactly the url of the users browsers. So, if your webserver is
    // behind e.g. a load balancer that modifies the host name or port, reformat requestUrlWithoutToken before proceeding.
  
    let response = null;
    try
    {
      var validationResult = knownUser.validateRequestByIntegrationConfig(
        requestUrlWithoutToken, queueitToken, integrationConfigJson,
        QUEUEIT_CUSTOMERID, QUEUEIT_SECRETKEY, httpProvider);
  
      if (validationResult.doRedirect()) {
         response =  new Response();
        // Adding no cache headers to prevent browsers to cache requests
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', 'Fri, 01 Jan 1990 00:00:00 GMT');
  
        if (validationResult.isAjaxResult) {
          // In case of ajax call send the user to the queue by sending a custom queue-it header and redirecting user to queue from javascript
          response.headers.set(validationResult.getAjaxQueueRedirectHeaderKey(),helpers.addKUPlatformVersion(validationResult.getAjaxRedirectUrl()));
            
        }
        else {
          // Send the user to the queue - either because hash was missing or because is was invalid
          response = Response.redirect(helpers.addKUPlatformVersion(validationResult.redirectUrl),'302');
        }
      }
      else {     
        
        // Request can continue - we remove queueittoken form querystring parameter to avoid sharing of user specific token
        if (requestUrl !== requestUrlWithoutToken && validationResult.actionType) {
            response =  new Response(); 
            response = Response.redirect(requestUrlWithoutToken,'302');
        }
        else {
          // Render page
          response = await fetch(request);
        }
      }
    }
    catch (e) {
      // There was an error validationg the request
      // Use your own logging framework to log the Exception
      // This was a configuration exception, so we let the user continue
      console.log("ERROR:" + e);
      response = await fetch(request);
    }
    if(httpProvider.outputCookie)
    {
        response = new Response(response.body, response);
        response.headers.set("Set-Cookie",httpProvider.outputCookie);
    }
    return response;

  }
  
 
},{"./contextProvider.js":3,"./integrationConfigProvider.js":4,"./queueitHelpers.js":6,"./sdk/queueit-knownuserv3-sdk.js":7}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
const crypto = require('js-sha256');
const helpers = require('./queueitHelpers');
const __IntegrationConfixFieldName ="info";

exports.tryStoreIntegrationConfig= async function(request, integrationConfigKV ,secretKey)
{
   const bodyJSON = await request.clone().json();
   const hash = bodyJSON.hash;
   const configInHex = bodyJSON.integrationInfo;

  if(hash && configInHex && crypto.sha256.hmac(secretKey, configInHex) == hash)
  {
    await integrationConfigKV.put(__IntegrationConfixFieldName, helpers.hex2bin(configInHex));
    return true;
  }
  return false;
}
exports.getIntegrationConfig = async function(integrationConfigKV)
{
    return  await integrationConfigKV.get(__IntegrationConfixFieldName,"text");
}


},{"./queueitHelpers":6,"js-sha256":5}],5:[function(require,module,exports){
(function (process,global){
/**
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 0.9.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2017
 * @license MIT
 */
/*jslint bitwise: true */
(function () {
  'use strict';

  var ERROR = 'input is invalid type';
  var WINDOW = typeof window === 'object';
  var root = WINDOW ? window : {};
  if (root.JS_SHA256_NO_WINDOW) {
    WINDOW = false;
  }
  var WEB_WORKER = !WINDOW && typeof self === 'object';
  var NODE_JS = !root.JS_SHA256_NO_NODE_JS && typeof process === 'object' && process.versions && process.versions.node;
  if (NODE_JS) {
    root = global;
  } else if (WEB_WORKER) {
    root = self;
  }
  var COMMON_JS = !root.JS_SHA256_NO_COMMON_JS && typeof module === 'object' && module.exports;
  var AMD = typeof define === 'function' && define.amd;
  var ARRAY_BUFFER = !root.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  var OUTPUT_TYPES = ['hex', 'array', 'digest', 'arrayBuffer'];

  var blocks = [];

  if (root.JS_SHA256_NO_NODE_JS || !Array.isArray) {
    Array.isArray = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    };
  }

  if (ARRAY_BUFFER && (root.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
    ArrayBuffer.isView = function (obj) {
      return typeof obj === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
    };
  }

  var createOutputMethod = function (outputType, is224) {
    return function (message) {
      return new Sha256(is224, true).update(message)[outputType]();
    };
  };

  var createMethod = function (is224) {
    var method = createOutputMethod('hex', is224);
    if (NODE_JS) {
      method = nodeWrap(method, is224);
    }
    method.create = function () {
      return new Sha256(is224);
    };
    method.update = function (message) {
      return method.create().update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createOutputMethod(type, is224);
    }
    return method;
  };

  var nodeWrap = function (method, is224) {
    var crypto = eval("require('crypto')");
    var Buffer = eval("require('buffer').Buffer");
    var algorithm = is224 ? 'sha224' : 'sha256';
    var nodeMethod = function (message) {
      if (typeof message === 'string') {
        return crypto.createHash(algorithm).update(message, 'utf8').digest('hex');
      } else {
        if (message === null || message === undefined) {
          throw new Error(ERROR);
        } else if (message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        }
      }
      if (Array.isArray(message) || ArrayBuffer.isView(message) ||
        message.constructor === Buffer) {
        return crypto.createHash(algorithm).update(new Buffer(message)).digest('hex');
      } else {
        return method(message);
      }
    };
    return nodeMethod;
  };

  var createHmacOutputMethod = function (outputType, is224) {
    return function (key, message) {
      return new HmacSha256(key, is224, true).update(message)[outputType]();
    };
  };

  var createHmacMethod = function (is224) {
    var method = createHmacOutputMethod('hex', is224);
    method.create = function (key) {
      return new HmacSha256(key, is224);
    };
    method.update = function (key, message) {
      return method.create(key).update(message);
    };
    for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
      var type = OUTPUT_TYPES[i];
      method[type] = createHmacOutputMethod(type, is224);
    }
    return method;
  };

  function Sha256(is224, sharedMemory) {
    if (sharedMemory) {
      blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      this.blocks = blocks;
    } else {
      this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    if (is224) {
      this.h0 = 0xc1059ed8;
      this.h1 = 0x367cd507;
      this.h2 = 0x3070dd17;
      this.h3 = 0xf70e5939;
      this.h4 = 0xffc00b31;
      this.h5 = 0x68581511;
      this.h6 = 0x64f98fa7;
      this.h7 = 0xbefa4fa4;
    } else { // 256
      this.h0 = 0x6a09e667;
      this.h1 = 0xbb67ae85;
      this.h2 = 0x3c6ef372;
      this.h3 = 0xa54ff53a;
      this.h4 = 0x510e527f;
      this.h5 = 0x9b05688c;
      this.h6 = 0x1f83d9ab;
      this.h7 = 0x5be0cd19;
    }

    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
    this.is224 = is224;
  }

  Sha256.prototype.update = function (message) {
    if (this.finalized) {
      return;
    }
    var notString, type = typeof message;
    if (type !== 'string') {
      if (type === 'object') {
        if (message === null) {
          throw new Error(ERROR);
        } else if (ARRAY_BUFFER && message.constructor === ArrayBuffer) {
          message = new Uint8Array(message);
        } else if (!Array.isArray(message)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
            throw new Error(ERROR);
          }
        }
      } else {
        throw new Error(ERROR);
      }
      notString = true;
    }
    var code, index = 0, i, length = message.length, blocks = this.blocks;

    while (index < length) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        blocks[16] = blocks[1] = blocks[2] = blocks[3] =
          blocks[4] = blocks[5] = blocks[6] = blocks[7] =
          blocks[8] = blocks[9] = blocks[10] = blocks[11] =
          blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }

      if (notString) {
        for (i = this.start; index < length && i < 64; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = this.start; index < length && i < 64; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          }
        }
      }

      this.lastByteIndex = i;
      this.bytes += i - this.start;
      if (i >= 64) {
        this.block = blocks[16];
        this.start = i - 64;
        this.hash();
        this.hashed = true;
      } else {
        this.start = i;
      }
    }
    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };

  Sha256.prototype.finalize = function () {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    var blocks = this.blocks, i = this.lastByteIndex;
    blocks[16] = this.block;
    blocks[i >> 2] |= EXTRA[i & 3];
    this.block = blocks[16];
    if (i >= 56) {
      if (!this.hashed) {
        this.hash();
      }
      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
        blocks[4] = blocks[5] = blocks[6] = blocks[7] =
        blocks[8] = blocks[9] = blocks[10] = blocks[11] =
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    blocks[15] = this.bytes << 3;
    this.hash();
  };

  Sha256.prototype.hash = function () {
    var a = this.h0, b = this.h1, c = this.h2, d = this.h3, e = this.h4, f = this.h5, g = this.h6,
      h = this.h7, blocks = this.blocks, j, s0, s1, maj, t1, t2, ch, ab, da, cd, bc;

    for (j = 16; j < 64; ++j) {
      // rightrotate
      t1 = blocks[j - 15];
      s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
      t1 = blocks[j - 2];
      s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
      blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
    }

    bc = b & c;
    for (j = 0; j < 64; j += 4) {
      if (this.first) {
        if (this.is224) {
          ab = 300032;
          t1 = blocks[0] - 1413257819;
          h = t1 - 150054599 << 0;
          d = t1 + 24177077 << 0;
        } else {
          ab = 704751109;
          t1 = blocks[0] - 210244248;
          h = t1 - 1521486534 << 0;
          d = t1 + 143694565 << 0;
        }
        this.first = false;
      } else {
        s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        ab = a & b;
        maj = ab ^ (a & c) ^ bc;
        ch = (e & f) ^ (~e & g);
        t1 = h + s1 + ch + K[j] + blocks[j];
        t2 = s0 + maj;
        h = d + t1 << 0;
        d = t1 + t2 << 0;
      }
      s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
      s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
      da = d & a;
      maj = da ^ (d & b) ^ ab;
      ch = (h & e) ^ (~h & f);
      t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
      t2 = s0 + maj;
      g = c + t1 << 0;
      c = t1 + t2 << 0;
      s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
      s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
      cd = c & d;
      maj = cd ^ (c & a) ^ da;
      ch = (g & h) ^ (~g & e);
      t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
      t2 = s0 + maj;
      f = b + t1 << 0;
      b = t1 + t2 << 0;
      s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
      s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
      bc = b & c;
      maj = bc ^ (b & d) ^ cd;
      ch = (f & g) ^ (~f & h);
      t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
      t2 = s0 + maj;
      e = a + t1 << 0;
      a = t1 + t2 << 0;
    }

    this.h0 = this.h0 + a << 0;
    this.h1 = this.h1 + b << 0;
    this.h2 = this.h2 + c << 0;
    this.h3 = this.h3 + d << 0;
    this.h4 = this.h4 + e << 0;
    this.h5 = this.h5 + f << 0;
    this.h6 = this.h6 + g << 0;
    this.h7 = this.h7 + h << 0;
  };

  Sha256.prototype.hex = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
      h6 = this.h6, h7 = this.h7;

    var hex = HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
      HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
      HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
      HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
      HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
      HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
      HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
      HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
      HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
      HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
      HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
      HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
      HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
      HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
      HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
      HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
      HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
      HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
      HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
      HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
      HEX_CHARS[(h5 >> 28) & 0x0F] + HEX_CHARS[(h5 >> 24) & 0x0F] +
      HEX_CHARS[(h5 >> 20) & 0x0F] + HEX_CHARS[(h5 >> 16) & 0x0F] +
      HEX_CHARS[(h5 >> 12) & 0x0F] + HEX_CHARS[(h5 >> 8) & 0x0F] +
      HEX_CHARS[(h5 >> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
      HEX_CHARS[(h6 >> 28) & 0x0F] + HEX_CHARS[(h6 >> 24) & 0x0F] +
      HEX_CHARS[(h6 >> 20) & 0x0F] + HEX_CHARS[(h6 >> 16) & 0x0F] +
      HEX_CHARS[(h6 >> 12) & 0x0F] + HEX_CHARS[(h6 >> 8) & 0x0F] +
      HEX_CHARS[(h6 >> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
    if (!this.is224) {
      hex += HEX_CHARS[(h7 >> 28) & 0x0F] + HEX_CHARS[(h7 >> 24) & 0x0F] +
        HEX_CHARS[(h7 >> 20) & 0x0F] + HEX_CHARS[(h7 >> 16) & 0x0F] +
        HEX_CHARS[(h7 >> 12) & 0x0F] + HEX_CHARS[(h7 >> 8) & 0x0F] +
        HEX_CHARS[(h7 >> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
    }
    return hex;
  };

  Sha256.prototype.toString = Sha256.prototype.hex;

  Sha256.prototype.digest = function () {
    this.finalize();

    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3, h4 = this.h4, h5 = this.h5,
      h6 = this.h6, h7 = this.h7;

    var arr = [
      (h0 >> 24) & 0xFF, (h0 >> 16) & 0xFF, (h0 >> 8) & 0xFF, h0 & 0xFF,
      (h1 >> 24) & 0xFF, (h1 >> 16) & 0xFF, (h1 >> 8) & 0xFF, h1 & 0xFF,
      (h2 >> 24) & 0xFF, (h2 >> 16) & 0xFF, (h2 >> 8) & 0xFF, h2 & 0xFF,
      (h3 >> 24) & 0xFF, (h3 >> 16) & 0xFF, (h3 >> 8) & 0xFF, h3 & 0xFF,
      (h4 >> 24) & 0xFF, (h4 >> 16) & 0xFF, (h4 >> 8) & 0xFF, h4 & 0xFF,
      (h5 >> 24) & 0xFF, (h5 >> 16) & 0xFF, (h5 >> 8) & 0xFF, h5 & 0xFF,
      (h6 >> 24) & 0xFF, (h6 >> 16) & 0xFF, (h6 >> 8) & 0xFF, h6 & 0xFF
    ];
    if (!this.is224) {
      arr.push((h7 >> 24) & 0xFF, (h7 >> 16) & 0xFF, (h7 >> 8) & 0xFF, h7 & 0xFF);
    }
    return arr;
  };

  Sha256.prototype.array = Sha256.prototype.digest;

  Sha256.prototype.arrayBuffer = function () {
    this.finalize();

    var buffer = new ArrayBuffer(this.is224 ? 28 : 32);
    var dataView = new DataView(buffer);
    dataView.setUint32(0, this.h0);
    dataView.setUint32(4, this.h1);
    dataView.setUint32(8, this.h2);
    dataView.setUint32(12, this.h3);
    dataView.setUint32(16, this.h4);
    dataView.setUint32(20, this.h5);
    dataView.setUint32(24, this.h6);
    if (!this.is224) {
      dataView.setUint32(28, this.h7);
    }
    return buffer;
  };

  function HmacSha256(key, is224, sharedMemory) {
    var i, type = typeof key;
    if (type === 'string') {
      var bytes = [], length = key.length, index = 0, code;
      for (i = 0; i < length; ++i) {
        code = key.charCodeAt(i);
        if (code < 0x80) {
          bytes[index++] = code;
        } else if (code < 0x800) {
          bytes[index++] = (0xc0 | (code >> 6));
          bytes[index++] = (0x80 | (code & 0x3f));
        } else if (code < 0xd800 || code >= 0xe000) {
          bytes[index++] = (0xe0 | (code >> 12));
          bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
          bytes[index++] = (0x80 | (code & 0x3f));
        } else {
          code = 0x10000 + (((code & 0x3ff) << 10) | (key.charCodeAt(++i) & 0x3ff));
          bytes[index++] = (0xf0 | (code >> 18));
          bytes[index++] = (0x80 | ((code >> 12) & 0x3f));
          bytes[index++] = (0x80 | ((code >> 6) & 0x3f));
          bytes[index++] = (0x80 | (code & 0x3f));
        }
      }
      key = bytes;
    } else {
      if (type === 'object') {
        if (key === null) {
          throw new Error(ERROR);
        } else if (ARRAY_BUFFER && key.constructor === ArrayBuffer) {
          key = new Uint8Array(key);
        } else if (!Array.isArray(key)) {
          if (!ARRAY_BUFFER || !ArrayBuffer.isView(key)) {
            throw new Error(ERROR);
          }
        }
      } else {
        throw new Error(ERROR);
      }
    }

    if (key.length > 64) {
      key = (new Sha256(is224, true)).update(key).array();
    }

    var oKeyPad = [], iKeyPad = [];
    for (i = 0; i < 64; ++i) {
      var b = key[i] || 0;
      oKeyPad[i] = 0x5c ^ b;
      iKeyPad[i] = 0x36 ^ b;
    }

    Sha256.call(this, is224, sharedMemory);

    this.update(iKeyPad);
    this.oKeyPad = oKeyPad;
    this.inner = true;
    this.sharedMemory = sharedMemory;
  }
  HmacSha256.prototype = new Sha256();

  HmacSha256.prototype.finalize = function () {
    Sha256.prototype.finalize.call(this);
    if (this.inner) {
      this.inner = false;
      var innerHash = this.array();
      Sha256.call(this, this.is224, this.sharedMemory);
      this.update(this.oKeyPad);
      this.update(innerHash);
      Sha256.prototype.finalize.call(this);
    }
  };

  var exports = createMethod();
  exports.sha256 = exports;
  exports.sha224 = createMethod(true);
  exports.sha256.hmac = createHmacMethod();
  exports.sha224.hmac = createHmacMethod(true);

  if (COMMON_JS) {
    module.exports = exports;
  } else {
    root.sha256 = exports.sha256;
    root.sha224 = exports.sha224;
    if (AMD) {
      define(function () {
        return exports;
      });
    }
  }
})();

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":1}],6:[function(require,module,exports){

const QueueIT = require("./sdk/queueit-knownuserv3-sdk.js");
const crypto = require('js-sha256');
const CLOUDFLARE_SDK_VERSION = "1.0.0";
exports.getParameterByName = function( url, name) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
exports.configureKnownUserHashing= function() {
    QueueIT.KnownUserV3.SDK.Utils.generateSHA256Hash = function (secretKey, stringToHash) {      
        const hash = crypto.sha256.hmac(secretKey, stringToHash)
        return hash;
    };
}

exports.addKUPlatformVersion= function(redirectQueueUrl)
{
    return redirectQueueUrl + "&kupver=cloudflare-" + CLOUDFLARE_SDK_VERSION;
}

// $CVSHeader: _freebeer/www/lib/bin2hex.js,v 1.2 2004/03/07 17:51:35 ross Exp $

// Copyright (c) 2002-2004, Ross Smith.  All rights reserved.
// Licensed under the BSD or LGPL License. See license.txt for details.


var _hex2bin = [
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0, 0, 0, 0, 0, // 0-9
     0,10,11,12,13,14,15, 0, 0, 0, 0, 0, 0, 0, 0, 0, // A-F
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0,10,11,12,13,14,15, 0, 0, 0, 0, 0, 0, 0, 0, 0, // a-f
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];


exports.hex2bin = function(str) {
    var len = str.length;
    var rv = '';
    var i = 0;

    var c1;
    var c2;

    while (len > 1) {
        h1 = str.charAt(i++);
        c1 = h1.charCodeAt(0);
        h2 = str.charAt(i++);
        c2 = h2.charCodeAt(0);
        
        rv += String.fromCharCode((_hex2bin[c1] << 4) + _hex2bin[c2]);
        len -= 2;
    }

    return rv;
}
},{"./sdk/queueit-knownuserv3-sdk.js":7,"js-sha256":5}],7:[function(require,module,exports){
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

module = module || {};
(exports = (module.exports = QueueIT));
},{}]},{},[2]);
