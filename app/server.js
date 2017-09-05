var client = require("./chatClient");
var secrets = require('../config/secrets.json');
var config = require('../config/chatConfig.js');
var bittrex = require('node.bittrex.api');

// express stuff
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMiddleware = require('less-middleware');
var _ = require('lodash');

bittrex.options({
    'apikey': secrets.bittrex.API_KEY,
    'apisecret': secrets.bittrex.API_SECRET,
});

var acceptableSymbolsList = []

function buildAcceptableSymbolsList() {
    bittrex.getmarketsummaries(function(marketData, err) {
        marketData.result.forEach(function(market) {
            if (
                market.MarketName &&
                market.MarketName.indexOf("BTC-") === 0
            ) {
                var symbol = market.MarketName.split("BTC-")[1];
                if (symbol && symbol.toLowerCase) {
                    acceptableSymbolsList.push(symbol.toLowerCase());
                }

            }
        });
    });
}

buildAcceptableSymbolsList();

var defaultRoundState = {
    votes: {
        buy: {

        },
        sell: {

        },
        history: []
    }
}

var roundState = _.extend({}, defaultRoundState);


function resetRoundState() {
    roundState = _.extend({}, defaultRoundState);
}


function validateSymbol(symbol) {
    var validated = false;

    if (acceptableSymbolsList && acceptableSymbolsList.indexOf(symbol) >= 0) {
        validated = true;
    }
    console.log("validating symbol", symbol, validated)

    return validated;
}

function handleBuyVote(from, symbol) {
    console.log("handle buy vote1", from, symbol)
    if (roundState.votes.buy[symbol]) {
        roundState.votes.buy[symbol] += 1;
    } else {
        roundState.votes.buy[symbol] = 1;
    }

    roundState.votes.history.push({ user: from, action: "!buy", symbol: symbol });
}

function handleSellVote() {
    if (roundState.votes.sell[symbol]) {
        roundState.votes.sell[symbol] += 1;
    } else {
        roundState.votes.sell[symbol] = 1;
    }

    roundState.votes.history.push({ user: from, action: "!buy", symbol: symbol });
}

client.addListener('message' + config.channel, function(from, message) {
    console.log("MESSAGE", from, message)
    if (message && message.toLowerCase) {
        var normalizedMessage = message.toLowerCase();
        if (normalizedMessage.indexOf("!buy ") === 0) {
            var symbol = normalizedMessage.split("!buy ").length && normalizedMessage.split("!buy ")[1];

            if (validateSymbol(symbol)) {
                handleBuyVote(from, symbol);
            }
        } else if (normalizedMessage.indexOf("!sell ") === 0) {
            var symbol = normalizedMessage.split("!sell ").length && normalizedMessage.split("!sell ")[1];

            if (validateSymbol(symbol)) {
                handleSellVote(from, symbol)
            }
        }
    }
});

function handleRoundEnd() {
    console.log("HANDLING ROUND END")
}

//EXPRESS

var index = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');

var app = express();
var router = express.Router();

router.post('/start', function(req, res, next) {
    resetRoundState();
})
router.post('/end', function(req, res, next) {
    handleRoundEnd();
})
router.get('/', function(req, res, next) {
    res.json(roundState);
})


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
app.use('/api', api);

/* GET balances */
app.use('/round', router);

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