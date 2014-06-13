var config = {};

// should end in /
config.rootUrl = process.env.ROOT_URL || 'http://cliquechat.herokuapp.com/';
config.facebook = {
    appId: process.env.FACEBOOK_APPID || '696731517040605',
    appSecret: process.env.FACEBOOK_APPSECRET || 'e9eadf99227937e308476b270fb67d88',
    appNamespace: process.env.FACEBOOK_APPNAMESPACE || 'nodescrumptious',
    redirectUri: process.env.FACEBOOK_REDIRECTURI || config.rootUrl + 'login/callback'
};

module.exports = config;