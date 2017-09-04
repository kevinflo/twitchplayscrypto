var bittrex = require('node.bittrex.api');

module.exports = {
    '!balance' : function(){           
        bittrex.getbalances( function( data, err ) {
          console.log( data );
        });
    }
}