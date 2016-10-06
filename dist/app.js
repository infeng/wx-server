"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const app = express();
const index_1 = require('./routes/index');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', index_1.default);
app.use((req, res, next) => {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});
app.use((err, req, res, next) => {
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
server.on('error', onError);
server.on('listening', onListening);
function onError(error) {
    if (error.syscall != 'listen') {
        throw error;
    }
    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
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
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}
//# sourceMappingURL=app.js.map