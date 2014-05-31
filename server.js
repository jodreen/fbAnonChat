var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , winston = require('winston');

if(!process.env.NODE_ENV) { process.env.NODE_ENV = 'local'; }

// Logging
var logger = new (winston.Logger)({ transports: [ new (winston.transports.Console)({colorize:true}) ] });

// Load configurations
var env = process.env.NODE_ENV
, nconf = require('nconf');

// merge nconf overrides with the configuration file.
nconf.argv().env().file({ file: env+'.json' });
nconf.set('approot', __dirname ); // set approot root

var app = express();

app.use(express.static(__dirname + "/public"));

// Bootstrap models
var modelsPath = path.normalize(path.join(__dirname, '/app/models'));
fs.readdirSync(modelsPath).forEach(function (file) {
  require(path.join(modelsPath, file));
});

// load express settings
require('./configs/express')(app, nconf, express, logger);

// Bootstrap routes
require('./configs/routes')(app);

// start server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
