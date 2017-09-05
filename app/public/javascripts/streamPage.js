console.log("js loaded")

var cryptoState = {};
window.cryptoState = cryptoState;
var voteRoundTime = 600;
var pauseRoundTime = 60;
var startingUSD = 3721;

var timeState = {
    pause: true,
    seconds: pauseRoundTime
};


function startApp() {
    console.log("starting app")
    updateCryptoState()
    setInterval(updateCryptoState, 60000);
    setInterval(refreshUIState, 10000);
    setInterval(updateTimeState, 1000);
}


$(startApp.bind(this));

function updateTimeState() {
    if (!--timeState.seconds) {
        if (timeState.pause) {
            handleRoundStart();
        } else {
            handlePauseStart();
        }
    }
    renderUpdatedTimeState();
}

function renderUpdatedTimeState() {
    var $timer = $(".round-time");
    var seconds = timeState.seconds;

    var displaySeconds = seconds % 60;
    var displayMinutes = (seconds - displaySeconds) / 60;

    displaySeconds = displaySeconds.toString();
    displayMinutes = displayMinutes.toString();

    if (displaySeconds.length === 1) {
        displaySeconds = "0" + displaySeconds;
    }

    $timer.html(displayMinutes + ":" + displaySeconds);
}

function handleRoundStart() {
    timeState.seconds = voteRoundTime;
    timeState.pause = false;

    // todo: add calls
}

function handlePauseStart() {
    timeState.seconds = pauseRoundTime;
    timeState.pause = true;

    // todo: add calls
}

function updateCryptoState() {
    fetch('http://localhost:3000/api/balances').then(function(resp) {
        return resp.json().then(function(resp2) {
            cryptoState = resp2
        });
    });
}

function updateCryptoStateOld() {
    fetch('http://localhost:3000/api/balance').then(function(resp) {
        return resp.json().then(function(resp2) {
            balances = resp2.result.filter(function(b) {
                return b.Balance;
            });
        });
    });
}


////////////////////////// UI STUFF //////////////////////////

function refreshUIState() {
    updateBalancesContainer();
    updateTotalsContainer();
    updateFeatureContainer();
    updateMetaContainer();
    updateVoteTotalsContainer();
    updateVoteHistoryContainer();
}

function updateBalancesContainer() {
    $(".balances").html("<h1>Balances</h1>");

    Object.keys(cryptoState).forEach(function(b, i) {
        var currencyData = cryptoState[b];

        if (currencyData && currencyData.Balance){
            $(".balances").append("<div>" + currencyData.Currency + " : " + currencyData.Balance + "</div>")            
        }
    });
}

function updateTotalsContainer(){

}

function updateFeatureContainer(){

}

function updateMetaContainer(){

}

function updateVoteTotalsContainer(){

}

function updateVoteHistoryContainer(){

}