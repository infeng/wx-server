"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require('fs');
const path = require('path');
const wxRequest_1 = require('./wxRequest');
const TOKEN_FOLDER = 'token';
const JSAPI_TICKET_FOLDER = 'jsapiTicket';
if (!fs.existsSync(TOKEN_FOLDER)) {
    fs.mkdirSync(TOKEN_FOLDER);
}
if (!fs.existsSync(JSAPI_TICKET_FOLDER)) {
    fs.mkdirSync(JSAPI_TICKET_FOLDER);
}
class WXAPI {
    constructor(appId, appSecret, receiveUrl) {
        this.appId = appId;
        this.appSecret = appSecret;
        this.receiveUrl = receiveUrl;
        this.jsapi = this.jsapi = null;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initToken();
            yield this.initJsapi();
        });
    }
    initToken() {
        return new Promise((resolve, reject) => {
            var tokenTxtFileName = path.join(TOKEN_FOLDER, `${this.appId}_token.txt`);
            if (!fs.existsSync(tokenTxtFileName)) {
                (() => __awaiter(this, void 0, void 0, function* () {
                    var token = yield wxRequest_1.getAccessToken(this.appId, this.appSecret);
                    this.token = token;
                    fs.writeFile(tokenTxtFileName, JSON.stringify(token), (err) => __awaiter(this, void 0, void 0, function* () {
                        if (err)
                            return reject(err);
                        resolve();
                    }));
                }))();
            }
            else {
                fs.readFile(tokenTxtFileName, 'utf-8', (err, txt) => {
                    if (err)
                        return reject(err);
                    this.token = JSON.parse(txt);
                    resolve();
                });
            }
        });
    }
    initJsapi() {
        var jsapiTxtFileName = path.join(JSAPI_TICKET_FOLDER, `${this.appId}_jsapi.txt`);
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(jsapiTxtFileName)) {
                (() => __awaiter(this, void 0, void 0, function* () {
                    var jsapi = yield wxRequest_1.getJsapiTicket(this.token.accessToken);
                    this.jsapi = this.jsapi;
                    fs.writeFile(jsapiTxtFileName, JSON.stringify(jsapi), err => {
                        if (err)
                            return reject(err);
                        resolve();
                    });
                }))();
            }
            else {
                fs.readFile(jsapiTxtFileName, 'utf-8', (err, txt) => {
                    if (err)
                        return reject(err);
                    this.jsapi = JSON.parse(txt);
                    resolve();
                });
            }
        });
    }
    getLatestToken() {
        return new Promise((resolve, reject) => {
            var now = new Date().getTime() / 1000;
            if (this.token.expireTime - (now - this.token.requestTime) < 120) {
                (() => __awaiter(this, void 0, void 0, function* () {
                    var tokenTxtFileName = path.join(TOKEN_FOLDER, `${this.appId}_token.txt`);
                    var token = yield wxRequest_1.getAccessToken(this.appId, this.appSecret);
                    fs.writeFile(tokenTxtFileName, JSON.stringify(token), err => {
                        if (err)
                            return reject(err);
                        resolve();
                    });
                    this.token = token;
                    resolve(token);
                }))();
            }
            else {
                resolve(this.token);
            }
        });
    }
    getLatestJsapiTicket() {
        return new Promise((resolve, reject) => {
            if (!this.token) {
                return reject(null);
            }
            var now = new Date().getTime() / 1000;
            if (this.jsapi.expireTime - (now - this.jsapi.requestTime) < 120) {
                (() => __awaiter(this, void 0, void 0, function* () {
                    var tokenTxtFileName = path.join(TOKEN_FOLDER, `${this.appId}_token.txt`);
                    var jsapi = yield wxRequest_1.getJsapiTicket(this.token.accessToken);
                    fs.writeFile(tokenTxtFileName, JSON.stringify(jsapi), err => {
                        if (err)
                            return reject(err);
                        resolve();
                    });
                    this.jsapi = jsapi;
                    resolve(jsapi);
                }))();
            }
            else {
                resolve(this.jsapi);
            }
        });
    }
}
exports.WXAPI = WXAPI;
exports.wxApis = {};
function getLatestToken(appId) {
    return __awaiter(this, void 0, void 0, function* () {
        var api = exports.wxApis[appId];
        if (api) {
            let token = yield api.getLatestToken();
            return token;
        }
        else {
            return null;
        }
    });
}
exports.getLatestToken = getLatestToken;
function getLatestJsapiTicket(appId) {
    return __awaiter(this, void 0, void 0, function* () {
        var api = exports.wxApis[appId];
        if (api) {
            let jsapi = yield api.getLatestJsapiTicket();
            return jsapi;
        }
        else {
            return null;
        }
    });
}
exports.getLatestJsapiTicket = getLatestJsapiTicket;
function register(appId, appSecret, receiveUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        var api = new WXAPI(appId, appSecret, receiveUrl);
        yield api.init();
        var token = yield api.getLatestToken();
        var jsapi = yield api.getLatestJsapiTicket();
        exports.wxApis[appId] = api;
        return {
            token: token,
            jsapi: jsapi,
        };
    });
}
exports.register = register;
//# sourceMappingURL=index.js.map