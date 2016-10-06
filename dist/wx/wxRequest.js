"use strict";
const request = require('request');
function makeWxRequestErrorMessage(result) {
    return `errorcode: ${result.errorcode}, errmsg: ${result.errmsg}`;
}
function getAccessToken(appId, appSecret) {
    return new Promise((resolve, reject) => {
        request.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`, (err, res, body) => {
            if (err) {
                reject(err);
            }
            else {
                var result = JSON.parse(body);
                if (result.errcode) {
                    reject(new Error(makeWxRequestErrorMessage(result)));
                }
                else {
                    resolve({
                        accessToken: result.access_token,
                        expireTime: result.expires_in,
                        requestTime: new Date().getTime() / 1000,
                    });
                }
            }
        });
    });
}
exports.getAccessToken = getAccessToken;
function getJsapiTicket(accessToken) {
    return new Promise((resolve, reject) => {
        request.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`, (err, res, body) => {
            if (err) {
                reject(err);
            }
            else {
                var result = JSON.parse(body);
                if (result.errcode !== 0) {
                    reject(new Error(makeWxRequestErrorMessage(result)));
                }
                else {
                    resolve({
                        ticket: result.ticket,
                        expireTime: result.expires_in,
                        requestTime: new Date().getTime() / 1000,
                    });
                }
            }
        });
    });
}
exports.getJsapiTicket = getJsapiTicket;
//# sourceMappingURL=wxRequest.js.map