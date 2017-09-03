var bittrex = require('node.bittrex.api');
var secrets = require('./config/secrets.json');

bittrex.options({
  'apikey' : secrets.bittrex.API_KEY,
  'apisecret' : secrets.bittrex.API_SECRET, 
});

// bittrex.getmarketsummaries( function( data, err ) {
//   if (err) {
//     return console.error(err);
//   }
//   for( var i in data.result ) {
//     bittrex.getticker( { market : data.result[i].MarketName }, function( ticker ) {
//       console.log( ticker );
//     });
//   }
// });

bittrex.getbalances( function( data, err ) {
  console.log( data );
});