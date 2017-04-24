import * as fs from 'fs';
import * as path from 'path';
import { getAccessToken, getAccessTokenResult, getJsapiTicket, getJsapiTicketResult } from './wxRequest';
import * as request from 'request';
import { REGISTER_WX, TOKEN_FOLDER, JSAPI_TICKET_FOLDER } from '../config';
import * as BPromise from 'bluebird';
const { promisify } = BPromise;
const writeFile = promisify<any, string, any>(fs.writeFile);
const readFile = promisify<string, string, string>(fs.readFile);

if(!fs.existsSync(TOKEN_FOLDER)) {
  fs.mkdirSync(TOKEN_FOLDER);
}
if(!fs.existsSync(JSAPI_TICKET_FOLDER)) {
  fs.mkdirSync(JSAPI_TICKET_FOLDER);
}

export class WXAPI {
  public token: getAccessTokenResult;
  public jsapi: getJsapiTicketResult;
  public tokenTimer: NodeJS.Timer;
  public jsapiTimer: NodeJS.Timer;
  public appId: string;
  public appSecret: string;
  public receiveUrl: string;

  constructor(appId: string, appSecret: string, receiveUrl) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.receiveUrl = receiveUrl;

    this.token = this.jsapi = null;
    this.tokenTimer = this.jsapiTimer = null;
  }

  sendToken() {
    return new Promise((resolve, reject) => {
      request(
      {
        url: this.receiveUrl,
        json: true,
        method: 'POST',
        body: {
          token: this.token,
        },
      }, 
      (err, res, body) => {
        if(err) {
          reject(err);
        }else {
          resolve();
        }
      });
    });    
  }

  sendJsapi() {
    return new Promise((resolve, reject) => {
      request(
      {
        url: this.receiveUrl,
        json: true,
        method: 'POST',
        body: {
          jsapi: this.jsapi,
        },
      }, 
      (err, res, body) => {
        if(err) {
          reject(err);
        }else {
          resolve();
        }
      });
    });    
  }

  async init() {
    await this.initToken();
    await this.initJsapi();
  }

  private async initToken() {
    var tokenTxtFileName = path.join(TOKEN_FOLDER,`${this.appId}_token.txt`);
    if(!fs.existsSync(tokenTxtFileName)) {
      var token = await this.getLatestToken();
      this.token = token;
      await writeFile(tokenTxtFileName, JSON.stringify(token));
    }else {
      this.token = JSON.parse(await readFile(tokenTxtFileName, 'utf-8'));      
    }
  }

  private async initJsapi() {
    var jsapiTxtFileName = path.join(JSAPI_TICKET_FOLDER, `${this.appId}_jsapi.txt`);
    if(!fs.existsSync(jsapiTxtFileName)) {
      var jsapi = await this.getLatestJsapiTicket();
      this.jsapi = jsapi;
      await writeFile(jsapiTxtFileName, JSON.stringify(jsapi));   
    }else {
      this.jsapi = JSON.parse(await readFile(jsapiTxtFileName, 'utf-8'));      
    }
  }

  async getLatestToken() {
    var tokenTxtFileName = path.join(TOKEN_FOLDER,`${this.appId}_token.txt`);
    var token = await getAccessToken(this.appId, this.appSecret);
    await writeFile(tokenTxtFileName, JSON.stringify(token));
    this.token = token;
    console.log(`get access_token: ${this.token.accessToken} time: ${this.token.requestTime2}`);
    return Promise.resolve(token);
  }

  async getLatestJsapiTicket() {
    if (!this.token) {
      return Promise.reject(null);
    }
    var jsapiTxtFileName = path.join(JSAPI_TICKET_FOLDER,`${this.appId}_jsapi.txt`);
    var jsapi = await getJsapiTicket(this.token.accessToken);
    await writeFile(jsapiTxtFileName, JSON.stringify(jsapi));
    this.jsapi = jsapi;
    console.log(`get jsapi_ticket: ${this.jsapi.ticket} time: ${this.jsapi.requestTime2}`);
    return Promise.resolve(jsapi);
  }
}

export var wxApis = {};

export async function register(appId, appSecret, receiveUrl) {
  var api: WXAPI = wxApis[appId];
  if(!api) {
    console.log(`first register appid: ${appId}`);
    api = new WXAPI(appId, appSecret, receiveUrl);
    await api.init();
    wxApis[appId] = api;
  }else {
    console.log(`update register appid: ${appId}`);
    api.receiveUrl = receiveUrl;
  }
  getTokenTimer(api);
  getJsapiTimer(api);
  console.log(`register appId: ${appId}`);
  console.log(`access_token: ${api.token.accessToken} time: ${api.token.requestTime2}`);
  console.log(`jsapi_ticket: ${api.jsapi.ticket} time: ${api.jsapi.requestTime2}`); 
  await addRegister(appId, appSecret, receiveUrl);
  return {
    token: api.token,
    jsapi: api.jsapi,
  };  
}

async function getTokenTimer(api: WXAPI) {
  var now = new Date().getTime() / 1000;
  var restTime = api.token.expireTime - (now - api.token.requestTime) -  180;
  if(restTime < 0) {
    restTime = 0;
  }
  clearTimeout(api.tokenTimer);
  api.tokenTimer = setTimeout(async () => {
    try {
      await api.getLatestToken();
      if (api.receiveUrl) {
        await api.sendToken();
      }
    }catch(err) {
      console.log(`appid: ${api.appId} get token error`);
      console.log(err.message);
    }
    getTokenTimer(api);
  }, restTime * 1000);
}

async function getJsapiTimer(api: WXAPI) {
  var now = new Date().getTime() / 1000;
  var restTime = api.jsapi.expireTime - (now - api.jsapi.requestTime) -  120;
  if(restTime < 0) {
    restTime = 0;
  }
  clearTimeout(api.jsapiTimer);
  api.jsapiTimer = setTimeout(async () => {
    try {
      await api.getLatestJsapiTicket();
      if (api.receiveUrl) {
        await api.sendJsapi();
      }
    }catch(err) {
      console.log(`appid: ${api.appId} get jsapi error`);
      console.log(err.message);
    }
    getJsapiTimer(api);
  }, restTime * 1000);
}

export async function init() {
  var registerWX = await getRegister();
  for(var appid in registerWX) {
    console.log(`re register appid: ${appid}`);
    await register(appid, registerWX[appid].appSecret, registerWX[appid].receiveUrl);
  }
}

async function getRegister() {
  if(fs.existsSync(REGISTER_WX)) {
    let data = await readFile(REGISTER_WX, 'utf-8');
    return Promise.resolve(JSON.parse(data));
  }else {
    return Promise.resolve({});
  }
}

async function addRegister(appId, appSecret, receiveUrl) {
  var registerWX = await getRegister();
  registerWX[appId] = {
    appSecret: appSecret,
    receiveUrl: receiveUrl,
  };
  await writeFile(REGISTER_WX, JSON.stringify(registerWX));
  return Promise.resolve();
}