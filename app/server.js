var irc = require('irc');
var secrets = require('../config/secrets.json');
var config = require('../config/chatConfig.js');
var bittrex = require('node.bittrex.api');
var secrets = require('../config/secrets.json');


bittrex.options({
  'apikey' : secrets.bittrex.API_KEY,
  'apisecret' : secrets.bittrex.API_SECRET, 
});


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


var messageHandler = {
    '!balance' : function(){           
        bittrex.getbalances( function( data, err ) {
          console.log( data );
        });
    }
}

var commandRegex = config.regexCommands ||
new RegExp('^(' + config.commands.join('|') + ')$', 'i');

client.addListener('message' + config.channel, function(from, message) {
    console.log("MESSAGE", from, message)
    if (message && messageHandler && message in messageHandler) {
        messageHandler[message].call(this);
    }
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

client.addListener('connect', function(message) {
    console.log('connect: ', message);
});

client.connect();
console.log('Connecting...');