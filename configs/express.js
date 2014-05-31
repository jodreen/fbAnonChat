var path = require('path')
, requestLogger = require('winston-request-logger')
, flash = require('connect-flash')
, helpers = require('view-helpers');

module.exports = function (app, nconf, express, logger) {

  var assets  = {
    "/js/main.min.js":[
        "/javascripts/main.js"
    ],
    "/css/style.min.css":[
      "/stylesheets/style.css"
    ]
  };

  // Cachify Asset Configuration
  app.use(require('connect-cachify').setup(assets, {
    root: path.normalize(path.join(nconf.get('approot'), 'public')),
    production: nconf.get('cachify'),
    debug: false
  }));

  // Development Configuration
  app.configure('local', 'development', 'test', function () {
    // register the request logger
    app.use(requestLogger.create(logger));
    app.set('DEBUG', true);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  // Production Configuration
  app.configure('production', function () {
    app.set('DEBUG', false);
    app.use(express.errorHandler());
  });

  // all environments
  app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    // set the view folder
    app.set('views', path.normalize(path.join(nconf.get('approot'), 'app/views')));
    
    app.set('view engine', 'ejs');

    // dynamic helpers
    app.use(helpers(nconf.get('app').name));

     // for flash messages
    app.use(flash());

    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser(nconf.get('cookieSecret')));
    app.use(express.session());

    //make the htmls pretty
    app.use(function (req, res, next) {
      app.locals.pretty = true;
      next();
    });

    //app.use(app.router);
    app.use(express.static(path.normalize(path.join(nconf.get('approot'), 'public'))));

  });

};
