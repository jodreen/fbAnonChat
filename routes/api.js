var FB = require('../fb'),
    config = require('../config');

// exports.friends = function(req, res) {
//     FB.api('me/friends', {
//         fields: 'name,picture,about',
//         limit: 500,
//         access_token: req.session.access_token
//     },
//     function(result) {
//         if (!result || result.error) {
//             return res.send(500, 'error');
//         }
//         res.send(result);
//     });
// };

exports.chat = function(req, res) {
    res.render('chat.ejs');
};