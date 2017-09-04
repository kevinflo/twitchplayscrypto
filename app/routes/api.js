var express = require('express');
var router = express.Router();
var bittrex = require('node.bittrex.api');

/* GET balances */
router.get('/balance', function(req, res, next) {

    bittrex.getbalances( function( data, err ) {
        res.json(data);
    });
});

router.get('/market', function(req, res, next){
    bittrex.getmarketsummaries( function( data, err ) {
      if (err) {
        return console.error(err);
      }
      res.json(data)
    });
});

router.get('/tickers', function(req, res, next){
    bittrex.getmarketsummaries( function( data, err ) {
      if (err) {
        return console.error(err);
      }
      var tickers = []
      for( var i in data.result ) {
        bittrex.getticker( { market : data.result[i].MarketName }, function( ticker ) {
            console.log(ticker)
          tickers.push(ticker)

          if (tickers.length === Object.keys(data.result).length){
            res.json(tickers)
        }
        });
      }
    });
});

router.get('/btc', function(req, res, next){
    bittrex.sendCustomRequest("https://bittrex.com/api/v1.1/public/getmarketsummary?market=usdt-btc", function(data,err){
        res.json(data)
    })
})

module.exports = router;
