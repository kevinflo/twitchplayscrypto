console.log("js loaded")

var balances = [];
var voteRoundTime = 600;
var pauseRoundTime = 60;

var timeState = {
    pause: true,
    seconds: pauseRoundTime
};


function startApp(){
    console.log("starting app")
    fetchCryptoState()
    setInterval(fetchCryptoState, 60000);
    setInterval(refreshUIState, 10000);
    setInterval(updateTimeState, 1000);
}


$(startApp.bind(this));

function updateTimeState(){
    if (!--timeState.seconds){
        if (timeState.pause){
            handleRoundStart();
        } else {
            handlePauseStart();
        }
    }
    renderUpdatedTimeState();
}

function renderUpdatedTimeState(){
    var $timer = $(".timer");
    var seconds = timeState.seconds;

    var displaySeconds = seconds % 60; 
    var displayMinutes = (seconds - displaySeconds) / 60;

    displaySeconds = displaySeconds.toString();
    displayMinutes = displayMinutes.toString();

    if (displaySeconds.length === 1){
        displaySeconds = "0" + displaySeconds;
    }

    $timer.html(displayMinutes + ":" + displaySeconds);
}

function handleRoundStart(){
    timeState.seconds = voteRoundTime;
    timeState.pause = false;

    // todo: add calls
}

function handlePauseStart(){
    timeState.seconds = pauseRoundTime;
    timeState.pause = true;

    // todo: add calls
}


function buildBalanceEls(){
    $(".balances").html("");

    balances.forEach(function(b, i){
        $(".balances").append("<div>" + b.Currency + " : " + b.Balance + "</div>")
    });
}

function updateBalances(){
    fetch('http://localhost:3000/api/balances').then(function(resp){
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