import * as fs from 'fs';
import * as path from 'path';
import { getAccessToken, getAccessTokenResult, getJsapiTicket, getJsapiTicketResult } from './wxRequest';
import * as request from 'request';

const TOKEN_FOLDER = 'token';
const JSAPI_TICKET_FOLDER = 'jsapiTicket';
if(!fs.existsSync(TOKEN_FOLDER)) {
  fs.mkdirSync(TOKEN_FOLDER);
}
if(!fs.existsSync(JSAPI_TICKET_FOLDER)) {
  fs.mkdirSync(JSAPI_TICKET_FOLDER);
}

export class WXAPI {
  public token: getAccessTokenResult;
  public jsapi: getJsapiTicketResult;
  private appId: string;
  private appSecret: string;
  private receiveUrl: string;

  constructor(appId: string, appSecret: string, receiveUrl) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.receiveUrl = receiveUrl;

    this.jsapi = this.jsapi = null;
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

  private initToken() {
    return new Promise((resolve, reject) => {
      var tokenTxtFileName = path.join(TOKEN_FOLDER,`${this.appId}_token.txt`);
      if(!fs.existsSync(tokenTxtFileName)) {
        (async () => {
          try {
            var token = await this.getLatestToken();
            this.token = token;
            fs.writeFile(tokenTxtFileName, JSON.stringify(token),  async(err) => {
              if(err) return reject(err);
              resolve();
            });  
          }catch(err) {
            reject(err);
          }           
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
          try {
            var jsapi = await this.getLatestJsapiTicket();
            this.jsapi = jsapi;
            fs.writeFile(jsapiTxtFileName, JSON.stringify(jsapi), err => {
              if(err) return reject(err);
              resolve();
            });  
          }catch(err) {
            reject(err);
          }            
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
      // var now = new Date().getTime() / 1000;
      // if(this.token.expireTime - (now - this.token.requestTime) < 180) {

      // }else {
      //   resolve(this.token);
      // }
      (async () => {
        var tokenTxtFileName = path.join(TOKEN_FOLDER,`${this.appId}_token.txt`);
        try {
          var token = await getAccessToken(this.appId, this.appSecret) as getAccessTokenResult;
          fs.writeFile(tokenTxtFileName, JSON.stringify(token), err => {
            if(err) return reject(err);
            resolve();
          });          
          this.token = token;
          console.log(`get access_token: ${this.token.accessToken} time: ${this.token.requestTime2}`);
          resolve(token);
        }catch(err) {
          reject(err);
        }
      })();      
    });
  }

  getLatestJsapiTicket(): Promise<getJsapiTicketResult> {
    return new Promise((resolve, reject) => {
      if(!this.token) {
        return reject(null);
      }
      // var now = new Date().getTime() / 1000;
      // if(this.jsapi.expireTime - (now - this.jsapi.requestTime) < 120) {      
      // }else {
      //   resolve(this.jsapi);
      // }
      (async () => {
        var tokenTxtFileName = path.join(JSAPI_TICKET_FOLDER,`${this.appId}_jsapi.txt`);
        try {
          var jsapi = await getJsapiTicket(this.token.accessToken) as getJsapiTicketResult;
          fs.writeFile(tokenTxtFileName, JSON.stringify(jsapi), err => {
            if(err) return reject(err);
            resolve();
          });          
          this.jsapi = jsapi;
          console.log(`get jsapi_ticket: ${this.jsapi.ticket} time: ${this.jsapi.requestTime2}`);
          resolve(jsapi);
        }catch(err) {
          reject(err);
        }
      })();        
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
  getTokenTimer(api);
  getJsapiTimer(api);
  wxApis[appId] = api;
  console.log(`register appId: ${appId}`);
  console.log(`access_token: ${api.token.accessToken} time: ${api.token.requestTime2}`);
  console.log(`jsapi_ticket: ${api.jsapi.ticket} time: ${api.jsapi.requestTime2}`);
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
  setTimeout(async () => {
    try {
      await api.getLatestToken();
      await api.sendToken();
    }catch(err) {
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
  setTimeout(async () => {
    try {
      await api.getLatestJsapiTicket();
      await api.sendJsapi();
    }catch(err) {
      console.log(err.message);
    }
    getJsapiTimer(api);
  }, restTime);
}