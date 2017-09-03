var irc = require('irc');
var secrets = require('../config/secrets.json');
var config = require('../config/chatConfig.js');
var bittrex = require('node.bittrex.api');
var secrets = require('../config/secrets.json');

// express stuff
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMiddleware = require('less-middleware');

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





//EXPRESS

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
