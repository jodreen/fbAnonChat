var config = {};

// Production Configs
config.rootUrl = process.env.ROOT_URL || 'http://cliquechat.herokuapp.com/';
config.facebook = {
    appId: process.env.FACEBOOK_APPID || '696731517040605',
    appSecret: process.env.FACEBOOK_APPSECRET || 'e9eadf99227937e308476b270fb67d88',
    appNamespace: process.env.FACEBOOK_APPNAMESPACE || 'nodescrumptious',
    redirectUri: process.env.FACEBOOK_REDIRECTURI || config.rootUrl + 'login/callback'
};

// Developing Configs
// config.rootUrl = process.env.ROOT_URL || 'http://localhost:3000/';
// config.facebook = {
//     appId: process.env.FACEBOOK_APPID || '130243393813697',
//     appSecret: process.env.FACEBOOK_APPSECRET || 'c82696768ae4ad8b63db874cb64eb558',
//     appNamespace: process.env.FACEBOOK_APPNAMESPACE || 'nodescrumptious',
//     redirectUri: process.env.FACEBOOK_REDIRECTURI || config.rootUrl + 'login/callback'
// };

module.exports = config;
