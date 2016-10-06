import * as fs from 'fs';
import * as path from 'path';
import { getAccessToken, getAccessTokenResult, getJsapiTicket, getJsapiTicketResult } from './wxRequest';

const TOKEN_FOLDER = 'token';
const JSAPI_TICKET_FOLDER = 'jsapiTicket';
if(!fs.existsSync(TOKEN_FOLDER)) {
  fs.mkdirSync(TOKEN_FOLDER);
}
if(!fs.existsSync(JSAPI_TICKET_FOLDER)) {
  fs.mkdirSync(JSAPI_TICKET_FOLDER);
}

export class WXAPI {
  private token: getAccessTokenResult;
  private jsapi: getJsapiTicketResult;
  private appId: string;
  private appSecret: string;
  private receiveUrl: string;

  constructor(appId: string, appSecret: string, receiveUrl) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.receiveUrl = receiveUrl;

    this.jsapi = this.jsapi = null;
  }

  async init() {
    await this.initToken();
    await this.initJsapi();
  }

  private initToken() {
    return new Promise((resolve, reject) => {
      var tokenTxtFileName = path.join(TOKEN_FOLDER,`${this.appId}_token.txt`);
      if(!fs.existsSync(tokenTxtFileName)) {
        (async () => {
          var token = await getAccessToken(this.appId, this.appSecret);
          this.token = token;
          fs.writeFile(tokenTxtFileName, JSON.stringify(token),  async(err) => {
            if(err) return reject(err);
            resolve();
          });             
        })();    
      }else {
        fs.readFile(tokenTxtFileName, 'utf-8', (err, txt) => {
          if(err) return reject(err);
          this.token = JSON.parse(txt);
          resolve();
        });        
      } 
    });
  }

  private initJsapi() {
    var jsapiTxtFileName = path.join(JSAPI_TICKET_FOLDER, `${this.appId}_jsapi.txt`);
    return new Promise((resolve, reject) => {
      if(!fs.existsSync(jsapiTxtFileName)) {
        (async () => {
          var jsapi = await getJsapiTicket(this.token.accessToken);
          this.jsapi = this.jsapi;
          fs.writeFile(jsapiTxtFileName, JSON.stringify(jsapi), err => {
            if(err) return reject(err);
            resolve();
          });              
        })();    
      }else {
        fs.readFile(jsapiTxtFileName, 'utf-8', (err, txt) => {
          if(err) return reject(err);
          this.jsapi = JSON.parse(txt);
          resolve(); 
        });        
      }
    });    
  }

  getLatestToken(): Promise<getAccessTokenResult> {
    return new Promise((resolve, reject) => {
      var now = new Date().getTime() / 1000;
      if(this.token.expireTime - (now - this.token.requestTime) < 120) {
        (async () => {
          var tokenTxtFileName = path.join(TOKEN_FOLDER,`${this.appId}_token.txt`);
          var token = await getAccessToken(this.appId, this.appSecret) as getAccessTokenResult;
          fs.writeFile(tokenTxtFileName, JSON.stringify(token), err => {
            if(err) return reject(err);
            resolve();
          });          
          this.token = token;
          resolve(token);
        })();        
      }else {
        resolve(this.token);
      }
    });
  }

  getLatestJsapiTicket(): Promise<getJsapiTicketResult> {
    return new Promise((resolve, reject) => {
      if(!this.token) {
        return reject(null);
      }
      var now = new Date().getTime() / 1000;
      if(this.jsapi.expireTime - (now - this.jsapi.requestTime) < 120) {
        (async () => {
          var tokenTxtFileName = path.join(TOKEN_FOLDER,`${this.appId}_token.txt`);
          var jsapi = await getJsapiTicket(this.token.accessToken) as getJsapiTicketResult;
          fs.writeFile(tokenTxtFileName, JSON.stringify(jsapi), err => {
            if(err) return reject(err);
            resolve();
          });          
          this.jsapi = jsapi;
          resolve(jsapi);
        })();        
      }else {
        resolve(this.jsapi);
      }
    });    
  }
}

export var wxApis = {};

export async function getLatestToken(appId) {
  var api = wxApis[appId] as WXAPI;
  if(api) {
    let token = await api.getLatestToken();
    return token;
  }else {
    return null;
  }
}

export async function getLatestJsapiTicket(appId) {
  var api = wxApis[appId] as WXAPI;
  if(api) {
    let jsapi = await api.getLatestJsapiTicket();
    return jsapi;
  }else {
    return null;
  }  
}

export async function register(appId, appSecret, receiveUrl) {  
  var api = new WXAPI(appId, appSecret, receiveUrl);
  await api.init();
  var token = await api.getLatestToken();
  var jsapi = await api.getLatestJsapiTicket();
  wxApis[appId] = api;
  return {
    token: token,
    jsapi: jsapi,
  };  
}