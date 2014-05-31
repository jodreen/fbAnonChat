exports.userHome = function (req, res) {
  res.render('users/home', {
    title: 'Awesome User',
  });
};