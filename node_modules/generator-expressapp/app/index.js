'use strict';

var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');

var ExpressappGenerator = module.exports = function ExpressappGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(ExpressappGenerator, yeoman.generators.NamedBase);

ExpressappGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // welcome message
  var welcome =
  '\n     _-----_' +
  '\n    |       |' +
  '\n    |' + '--(o)--'.red + '|   .--------------------------.' +
  '\n   `---------´  |    ' + 'Welcome to Yeoman,'.yellow.bold + '    |' +
  '\n    ' + '( '.yellow + '_' + '´U`'.yellow + '_' + ' )'.yellow + '   |   ' + 'ladies and gentlemen!'.yellow.bold + '  |' +
  '\n    /___A___\\   \'__________________________\'' +
  '\n     |  ~  |'.yellow +
  '\n   __' + '\'.___.\''.yellow + '__' +
  '\n ´   ' + '`  |'.red + '° ' + '´ Y'.red + ' `\n';

  console.log(welcome);

  var prompts = [{
    name: 'tmplate',
    message: 'Choose template <engine> ejs|jshtml|jade',
    default: 'jade',
    //warning: 'Yes: Enabling this will be totally awesome!'
  },
  {
    name: 'css',
    message: 'Choose stylesheet <engine> css|less|stylus',
    default: 'css',
    //warning: 'Yes: Enabling this will be totally awesome!'
  }];

  this.prompt(prompts, function (err, props) {
    if (err) {
      return this.emit('error', err);
    }

    this.tmplate = props.tmplate;
    this.css = props.css;

    cb();
  }.bind(this));
};

ExpressappGenerator.prototype.app = function app() {
  
  this.template('_package.json', 'package.json');
  this.template('_bower.json', 'bower.json');

  //this.mkdir('app');
  this.mkdir('app/models');

  switch(this.tmplate){
    case 'jade':
      this.template('views/_layout.html', 'app/views/layout.'+this.tmplate);
      this.template('views/_user_home.html', 'app/views/users/home.'+this.tmplate);
    case 'jshtml':
      this.template('views/_index.html', 'app/views/index.'+this.tmplate);
      break;
    case 'ejs':
      this.template('views/_index.html', 'app/views/index.ejs');
      break;
  }

  this.copy('controllers/_users.js', 'app/controllers/users.js');

};

ExpressappGenerator.prototype.configs = function configs() {
  this.template('_server.js', 'server.js');
  this.template('configs/_express.js', 'configs/express.js');
  this.template('configs/_routes.js', 'configs/routes.js');
  this.template('local.json', 'local.json');
}

ExpressappGenerator.prototype.publicfiles = function publicfiles() {
  this.mkdir('public/javascripts');
  this.mkdir('public/images');

  switch(this.css){
    case 'css':
    case 'less':
      this.template('public/_style.css', 'public/stylesheets/style.'+this.css);
      break;
    case 'stylus':
      this.template('public/_style.css', 'public/stylesheets/style.styl');
      break;
  }
};

ExpressappGenerator.prototype.projectfiles = function projectfiles() {
  this.copy('editorconfig', '.editorconfig');
  this.copy('jshintrc', '.jshintrc');
};
