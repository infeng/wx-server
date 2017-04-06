import * as request from 'request';

function makeWxRequestErrorMessage(result) {
  return `errorcode: ${result.errcode}, errmsg: ${result.errmsg}`;
}

export interface getAccessTokenResult {
  accessToken: string,
  /** 有效事件（秒） */
  expireTime: number,
  /** 请求事件（秒） */
  requestTime: number,  
  requestTime2: string,
}

export function getAccessToken(appId: string, appSecret: string) {
  return new Promise<getAccessTokenResult>((resolve, reject) => {
    request.get(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`, 
    (err, res, body) => {
      if(err) {
        reject(err);
      }else {
        var result = JSON.parse(body);
        if(result.errcode) {
          reject(new Error(makeWxRequestErrorMessage(result)));
        }else {
          resolve({
            accessToken: result.access_token,
            expireTime: result.expires_in,
            requestTime: new Date().getTime() / 1000,
            requestTime2: new Date().toLocaleString(),
          });
        }
      }
    });
  });
}

export interface getJsapiTicketResult {
  ticket: string,
  expireTime: number;
  requestTime: number;
  requestTime2: string,
}

export function getJsapiTicket(accessToken: string) {
  return new Promise<getJsapiTicketResult>((resolve, reject) => {
    request.get(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`, 
    (err, res, body) => {
      if(err) {
        reject(err);
      }else {
        var result = JSON.parse(body);
        if(result.errcode !== 0) {
          reject(new Error(makeWxRequestErrorMessage(result)));
        }else {
          resolve({
            ticket: result.ticket,
            expireTime: result.expires_in,
            requestTime: new Date().getTime() / 1000,
            requestTime2: new Date().toLocaleString(),
          });
        }
      }
    });
  });
}