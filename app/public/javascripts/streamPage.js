console.log("wut")

var balances = [];

$(function(){
    console.log("yay")
    fetchCryptoState()
    setInterval(fetchCryptoState, 60000);
    setInterval(refreshUIState, 10000);
}.bind(this));

function buildBalanceEls(){
    $(".balances").html("");

    balances.forEach(function(b, i){
        $(".balances").append("<div>" + b.Currency + " : " + b.Balance + "</div>")
    });
}

function updateBalances(){
    fetch('http://localhost:3000/api/balance').then(function(resp){
        return resp.json().then(function(resp2){
            balances = resp2.result.filter(function(b){
                return b.Balance;
            });
        });
    });
}

function fetchCryptoState(){
    updateBalances();
}

function refreshUIState(){
    buildBalanceEls();
}