"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const express = require('express');
const router = express.Router();
const wx_1 = require('../wx');
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = router;
router.post('/register', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    var appId = req.body.appId || null;
    var appSecret = req.body.appSecret || null;
    var receiveUrl = req.body.receiveUrl || '';
    if (!appId || !appSecret) {
        res.json({
            status: -1,
            msg: '缺少参数'
        });
        return;
    }
    var result = yield wx_1.register(appId, appSecret, receiveUrl);
    res.json({
        status: 0,
        token: result.token,
        jsapi: result.jsapi,
    });
}));
router.post('/access_token', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    var appId = req.body.appId || null;
    if (!appId) {
        res.json({
            status: -1,
            msg: '缺少参数'
        });
        return;
    }
    var token = yield wx_1.getLatestToken(appId);
    if (!token) {
        res.json({
            status: -1,
            msg: '该appId未注册',
        });
        return;
    }
    res.json({
        status: 0,
        token: token,
    });
}));
router.post('/jsapi_ticket', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    var appId = req.body.appId || null;
    if (!appId) {
        res.json({
            status: -1,
            msg: '缺少参数'
        });
        return;
    }
    var jsapi = yield wx_1.getLatestJsapiTicket(appId);
    if (!jsapi) {
        res.json({
            status: -1,
            msg: '该appId未注册',
        });
        return;
    }
    res.json({
        status: 0,
        jsapi: jsapi,
    });
}));
//# sourceMappingURL=index.js.map