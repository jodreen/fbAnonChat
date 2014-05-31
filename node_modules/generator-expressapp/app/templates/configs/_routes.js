module.exports = function(app) {

  //Index page
  app.get('/', function(req, res) {
    <% if (tmplate === 'jshtml') { %>
    res.locals({
      title: 'Awsome'
    });
    res.render('index');
    <% } else { %>
    res.render('index', { title: 'Awsome' });
    <% } %>
  });

  // User Routes
  var users = require('../app/controllers/users');
  app.get( '/user', users.userHome );
}
