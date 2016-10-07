import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as logger from 'morgan';
import { init } from './wx';

(async () => {
  await init();
})();

const app = express();

import index from './routes/index';

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/', index);

app.use((req,res,next) => {
  var err = new Error('Not Found');
  err['status'] = 404;
  next(err);
});

app.use((err: Error,req,res: express.Response,next) => {
  res.status(err['status'] || 500);
  res.json({
    title: 'error',
    message: err.message,
    error: {}
  });
});

process.on('uncaughtException', err => {
  console.log('uncaughtException: ');
  console.log(err.stack);
});

var port = process.env.PORT || 3001;
app.set('port', port);

var server = http.createServer(app);

server.listen(port);
server.on('error',onError);
server.on('listening',onListening);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall != 'listen') {
    throw error;
  }
  
  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  
  //handle specific listen errors with friendly messages
  switch(error.code) {
    case 'EACCES':
      console.error(bind + 'requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + 'is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
  
/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}