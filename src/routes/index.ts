import * as express from 'express';
const router = express.Router();
import wxApis, { getLatestToken, register, getLatestJsapiTicket } from '../wx';

export default router;

router.post('/register', async (req: express.Request, res: express.Response, next) => {
  var appId = req.body.appId || null;
  var appSecret = req.body.appSecret || null;
  var receiveUrl = req.body.receiveUrl || '';
  if(!appId || !appSecret) {
    res.json({
      status: -1,
      msg: '缺少参数'
    });
    return;
  }
  try {
    var result = await register(appId, appSecret, receiveUrl);
    res.json({
      status: 0,
      token: result.token,
      jsapi: result.jsapi,
    });
  }catch(err) {
    console.log(err.message);
    res.json({
      status: -1,
      msg: err.message,
    });
  }
});

router.post('/access_token', async (req: express.Request, res: express.Response, next) => {
  var appId = req.body.appId || null;
  if(!appId) {
    res.json({
      status: -1,
      msg: '缺少参数'
    });
    return;
  }
  try {
    var token = await getLatestToken(appId);
    if(!token) {
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
  }catch (err) {
    console.log(err.message);
    res.json({
      status: -1,
      msg: err.message,
    });
  }
});

router.post('/jsapi_ticket', async (req: express.Request, res: express.Response, next) => {
  var appId = req.body.appId || null;
  if(!appId) {
    res.json({
      status: -1,
      msg: '缺少参数'
    });
    return;
  }
  try {
    var jsapi = await getLatestJsapiTicket(appId);
    if(!jsapi) {
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
  }catch(err) {
    console.log(err.message);
    res.json({
      status: -1,
      msg: err.message,
    });    
  }
});