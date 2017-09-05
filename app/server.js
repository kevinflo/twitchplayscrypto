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
        history: [],
        users: {

        }
    },
    winner: {
        situation: "NO_WINNER"
    }
}

var roundState = _.extend({}, _.clone(defaultRoundState));


function resetRoundState(winner) {
    roundState = defaultRoundState = {
        votes: {
            buy: {

            },
            sell: {

            },
            history: [],
            users: {

            }
        },
        winner: {
            situation: "NO_WINNER"
        }
    }
    if (winner){
        roundState.winner = winner;
    }
}


function validateSymbol(symbol) {
    var validated = false;

    if (acceptableSymbolsList && acceptableSymbolsList.indexOf(symbol) >= 0) {
        validated = true;
    }

    return validated;
}

function handleBuyVote(from, symbol) {
    if (!roundState.votes.users[from]){
        roundState.votes.users[from] = true;

        if (roundState.votes.buy[symbol]) {
            roundState.votes.buy[symbol] += 1;
        } else {
            roundState.votes.buy[symbol] = 1;
        }

        roundState.votes.history.unshift({ user: from, action: "!buy", symbol: symbol });

        if (roundState.votes.history.length > 100){
            roundState.votes.history = roundState.votes.history.slice(0, 60);
        }
    }
}

function handleSellVote(from, symbol) {
    if (!roundState.votes.users[from]){
        roundState.votes.users[from] = true;

        if (roundState.votes.sell[symbol]) {
            roundState.votes.sell[symbol] += 1;
        } else {
            roundState.votes.sell[symbol] = 1;
        }

        roundState.votes.history.unshift({ user: from, action: "!sell", symbol: symbol });

        if (roundState.votes.history.length > 100){
            roundState.votes.history = roundState.votes.history.slice(0, 60);
        }
    }
}

client.addListener('message' + config.channel, function(from, message) {
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


function determineWinner(){
    var best = 0;
    var winner = {
        situation: "NO_WINNER"
    };
    var tie = true;

    Object.keys(roundState.votes.buy).forEach(function(k){
        if (roundState.votes.buy[k] && roundState.votes.buy[k] > best){
            tie = false;
            winner = {
                symbol: k,
                action: "BUY"
            }
        } else if (roundState.votes.buy[k] && roundState.votes.buy[k] === best){
            tie = true;
            winner = {
                situation: "TIE"
            }
        }
    });

    Object.keys(roundState.votes.sell).forEach(function(k){
        if (roundState.votes.sell[k] && roundState.votes.sell[k] > best){
            tie = false;
            winner = {
                symbol: k,
                action: "SELL"
            }
        } else if (roundState.votes.sell[k] && roundState.votes.sell[k] === best){
            tie = true;
            winner = {
                situation: "TIE"
            }
        }
    });

    return winner;
}

var btcLimit = .01;


var marketExample = {
    "MarketName" : "BTC-LTC",
    "High" : 0.01350000,
    "Low" : 0.01200000,
    "Volume" : 3833.97619253,
    "Last" : 0.01349998,
    "BaseVolume" : 47.03987026,
    "TimeStamp" : "2014-07-09T07:22:16.72",
    "Bid" : 0.01271001,
    "Ask" : 0.01291100,
    "OpenBuyOrders" : 45,
    "OpenSellOrders" : 45,
    "PrevDay" : 0.01229501,
    "Created" : "2014-02-13T00:00:00",
    "DisplayMarketName" : null
}

function calculateBuy(resp, symbol, marketName){
    var market = _.find(resp, function(resp){
        return resp && resp.MarketName && resp.MarketName.toLowerCase() === marketName;
    })

    if (market && market.Ask){
        var ask = market.Ask;

        return {
            quantity: btcLimit / ask,
            rate: ask
        }
    }
}

function calculateSell(resp, symbol, marketName, data){
    var balance = data && data.result && data.result.Balance;

    if (balance){
        var market = _.find(resp, function(resp){
            return resp && resp.MarketName && resp.MarketName.toLowerCase() === marketName;
        })
        var bid = market.Bid;

        var sellable = (bid * balance) >= btcLimit;

        console.log("sellable?", bid, balance, btcLimit, btcLimit/bid, bid*balance)

        if (sellable){
            return {
                quantity: btcLimit / bid,
                rate: bid,

            }
        } else {
            return {
                quantity: balance,
                rate: bid
            };
        }
    }
}

function notBuyable(){
    console.log("not buyable")
    roundState.winner = {
        situation: "NOT_ENOUGH"
    }
}

function notSellable(){
    console.log("not sellable")
}

function transactWinner(winner){
    if (winner.action && winner.action === "BUY" && winner.symbol){
        bittrex.getbalance({currency: "BTC"}, function(data, err){
            console.log("GOT BALANCE", data)
            if (data && data.result && data.result.Balance > .01){
                console.log("CAN BUY");

                var marketName = "btc-" + winner.symbol.toLowerCase();
                bittrex.getmarketsummary({market: marketName}, function(marketData,err){
                    if (marketData && marketData.result){
                        var calculatedBuy = calculateBuy(marketData.result, winner.symbol, marketName);

                        if (calculatedBuy && calculatedBuy.quantity && calculatedBuy.rate){
                            console.log("EXECUTING BUY", {market: marketName, quantity: calculatedBuy.quantity, rate: calculatedBuy.rate})
                            bittrex.buylimit({market: marketName, quantity: calculatedBuy.quantity, rate: calculatedBuyrate});
                        }
                    }
                });
            } else {
                notBuyable();
            }
        })
    } else if (winner.action && winner.action === "SELL" && winner.symbol){
        bittrex.getbalance({currency: winner.symbol}, function(data, err){
            console.log("GOT BALANCE", data)

            var marketName = "btc-" + winner.symbol.toLowerCase();
            bittrex.getmarketsummary({market: marketName}, function(marketData,err){
                if (marketData && marketData.result){
                    console.log("md", marketData, marketData.result)
                    var calculatedSell = calculateSell(marketData.result, winner.symbol, marketName, data);

                    if (calculatedSell.quantity && calculatedSell.rate){
                        console.log("EXECUTING SELL", {market: marketName, quantity: calculatedSell.quantity, rate: calculatedSell.rate})
                        bittrex.selllimit({market: marketName, quantity: calculatedSell.quantity, rate: calculatedSell.rate});
                    } 
                }
            });
        })
    }
}

function handleRoundEnd(test) {
    var winner = determineWinner();

    console.log("determined winner", winner);
    resetRoundState(winner);

    if (winner && winner.action && !test){
        transactWinner(winner);
    } else {
        console.log("NO WINNER OR ITS A TEST")
    }
}

//EXPRESS

var index = require('./routes/index');
var api = require('./routes/api');

var app = express();
var router = express.Router();

router.post('/start', function(req, res, next) {
    console.log("round started")
    resetRoundState();
})
router.post('/end', function(req, res, next) {
    console.log("round ended")
    handleRoundEnd();
})

router.post('/start/test', function(req, res, next) {
    console.log("round started TEST")
    resetRoundState(true);
})
router.post('/end/test', function(req, res, next) {
    console.log("round ended TEST")
    handleRoundEnd(true);
})

router.get('/', function(req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.json(roundState);
})
router.get("/testbuy", function(req, res, next){
    // bittrex.sendCustomRequest("https://bittrex.com/api/v1.1/account/getbalance?apikey="+ secrets.bittrex.API_KEY +"&currency=sc", function(data, err) {
    //     res.json(data);
    // });

    bittrex.getbalance({currency: "BTC"}, function(data, err){
        res.json(data);
    })
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