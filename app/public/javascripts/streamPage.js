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

var testMode = true;


function startApp() {
    console.log("starting app")
    updateCryptoState();
    refreshUIState();
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
            var normalizedBalance = currencyData.Balance.toString();

            if (normalizedBalance.length > 7){
                normalizedBalance = normalizedBalance.slice(0, 7);
            }

            $(".balances").append("<div>" + currencyData.Currency + " : " + normalizedBalance + "</div>")            
        }
    });
}

function updateTotalsContainer(){
    if (cryptoState && cryptoState.totals && cryptoState.totals.BTC && cryptoState.totals.USD){
        var normalizedUSD = cryptoState.totals.USD.toString();
        var normalizedBTC = cryptoState.totals.BTC.toString();

        if (normalizedUSD.length > 7){
            normalizedUSD = normalizedUSD.slice(0, 7);
        }
        if (normalizedBTC.length > 7){
            normalizedBTC = normalizedBTC.slice(0, 7);
        }

        var profit = cryptoState.totals.USD > startingUSD;
        var difference = Math.abs(startingUSD - cryptoState.totals.USD);

        var differenceCharacter = "- ";
        if (profit){
            differenceCharacter = "+ ";
        }

        var normalizedDifference = difference.toString();

        if (normalizedDifference.length > 6){
            normalizedDifference = normalizedDifference.slice(0, 6);
        }

        var totalString = "\$" + normalizedUSD + " (" + normalizedBTC + " BTC) (" + differenceCharacter + "$" + normalizedDifference + ") lifetime";

        $(".totals-info").html(totalString);

        if (profit){
            $(".totals").addClass("profit");
            $(".totals").removeClass("loss");
        } else {
            $(".totals").addClass("loss");
            $(".totals").removeClass("profit");
        }
    }
}

function updateFeatureContainer(){

}

function updateMetaContainer(){
    if (testMode){
        $(".test-mode").show();
    }
}

function updateVoteTotalsContainer(){

}

function updateVoteHistoryContainer(){

}