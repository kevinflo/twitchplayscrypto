var irc = require('irc');
var secrets = require('../config/secrets.json');
var config = require('../config/chatConfig.js');

var client = new irc.Client(config.server, config.nick, {
    channels: [config.channel],
    port: config.port || 6667,
    sasl: false,
    nick: config.nick,
    userName: config.nick,
    password: config.password,
    //This has to be false, since SSL in NOT supported by twitch IRC (anymore?)
    // see: http://help.twitch.tv/customer/portal/articles/1302780-twitch-irc
    secure: false,
    floodProtection: config.floodProtection || false,
    floodProtectionDelay: config.floodProtectionDelay || 100,
    autoConnect: false,
    autoRejoin: true
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

client.addListener('connect', function(message) {
    console.log('connect: ', message);
});

client.connect();
console.log('Connecting...');

module.exports = client;