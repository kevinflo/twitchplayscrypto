$(function(){
    console.log("js loaded")

    var cryptoState = {};
    var roundState = {
        votes: {
            buy: {

            },
            sell: {

            },
            history: [],
            users: {

            }
        }
    };
    window.cryptoState = cryptoState;
    window.roundState = roundState;
    var voteRoundTime = 480;
    var pauseRoundTime = 60;

    var testMode = true;

    if (testMode){
        voteRoundTime = 20;
        pauseRoundTime = 5;
    }


    var startingUSD = 3721 + 890;


    var timeState = {
        pause: true,
        seconds: pauseRoundTime
    };

    console.log("starting app")
    updateCryptoState();
    refreshUIState();
    setInterval(updateCryptoState, 20000);
    setInterval(refreshUIState, 3000);
    setInterval(function(){
        timeState = updateTimeState(timeState)
    }, 1000);
    setInterval(updateRoundState, 2000);


    function updateTimeState(internalTimeState) {
        internalTimeState.seconds = internalTimeState.seconds - 1;
        if (internalTimeState.seconds === 0) {
            if (internalTimeState.pause) {
                console.log("start round", internalTimeState)
                internalTimeState = handleRoundStart();
            } else {
                internalTimeState = handlePauseStart();
            }
        }
        renderUpdatedTimeState(internalTimeState);

        return internalTimeState;
    }

    function renderUpdatedTimeState(internalTimeState) {
        var $timer = $(".round-time");
        var seconds = internalTimeState.seconds;

        if (internalTimeState.pause){
            $(".vote-totals-list").html("");
            $(".vote-history-list").html("");
        }
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
        console.log("handle round start")
        var internalTimeState = {
            pause: false,
            seconds: voteRoundTime
        };

        $(".time-title").html("Round ends in:");

        var route = "http://localhost:3000/round/start";

        if (testMode){
            route = "http://localhost:3000/round/start/test";
        }

        $.post(route).done(function(data){
            console.log("client started round")
        })

        // fetch(route, {
        //     method: "POST"
        // }).then(function(resp){
        //     console.log("round started");

        // });

        return internalTimeState;
    }

    function handlePauseStart(internalTimeState) {
        var internalTimeState = {
            pause: true,
            seconds: pauseRoundTime
        };

        $(".time-title").html("Round starts in:");

        var route = "http://localhost:3000/round/end";

        if (testMode){
            route = "http://localhost:3000/round/end/test";
        }

        $.post(route).done(function(data){
            console.log("client ended round")
        })

        // fetch(route, {
        //     method: "POST"
        // }).then(function(resp){
        //     console.log("round ended");
        // });

        return internalTimeState;
    }

    function updateCryptoState() {
        fetch('http://localhost:3000/api/balances').then(function(resp) {
            return resp.json().then(function(resp2) {
                cryptoState = resp2
            });
        });
    }

    function updateRoundState(){
        fetch('http://localhost:3000/round').then(function(resp) {
            return resp.json().then(function(resp2) {
                roundState = resp2
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
        var normalizedBalances = [];

        Object.keys(cryptoState).forEach(function(b, i) {
            var currencyData = cryptoState[b];

            if (currencyData && currencyData.Balance){
                var normalizedBalance = currencyData.Balance.toFixed(3).toString();

                if (normalizedBalance.length > 7){
                    normalizedBalance = normalizedBalance.slice(0, 7);
                }

                var prevDay = currencyData.PrevDay * cryptoState.btcMarket.PrevDay;
                var price = currencyData.Last * cryptoState.btcMarket.Last;

                var up = false;

                if (prevDay < price){
                    up = true;
                }

                var normalizedDifference = percentChange(prevDay, price);

                if (normalizedDifference.length > 3){
                    normalizedDifference = normalizedDifference.slice(0, 3);
                }

                var differenceCharacter = "-";

                if (up){
                    differenceCharacter = "+";
                }
                var priceString = "(" +differenceCharacter + " " + normalizedDifference + "%)" ;

                var upClass = "down";

                if (up){
                    upClass = "up";
                }
                var ourBalance = currencyData.Balance * currencyData.Last;
                var ourBalanceString = "(" + (currencyData.Balance * currencyData.Last).toString().slice(0, 5) + " BTC) ";

                if (currencyData.Currency === "BTC"){
                    var price = cryptoState.btcMarket.Last;

                    var prevDay = cryptoState.btcMarket.PrevDay;

                    var up = false;

                    if (prevDay < price){
                        up = true;
                    }

                    var normalizedPrice = price.toString();
                    if (normalizedPrice.length > 6){
                        normalizedPrice = normalizedPrice.slice(0, 6);
                    }

                    var difference = Math.abs(100 - (price / prevDay) * 100);

                    var normalizedDifference = difference.toString();

                    if (normalizedDifference.length > 3){
                        normalizedDifference = normalizedDifference.slice(0, 3);
                    }

                    var differenceCharacter = "-";

                    if (up){
                        differenceCharacter = "+";
                        upClass = "up";
                    }

                    var priceString = "(" + differenceCharacter + " " + normalizedDifference + "%)" ;
                }
                normalizedBalances.push({
                    upClass: upClass,
                    currency: currencyData.Currency,
                    ourBalance: ourBalance,
                    normalizedBalance: normalizedBalance,
                    ourBalanceString: ourBalanceString,
                    priceString: priceString
                });


                // $(".balances").append("<div class=" + upClass + ">" + currencyData.Currency + " : " + normalizedBalance + " " + ourBalanceString + priceString + "</div>")            
            }
        });

        normalizedBalances = normalizedBalances.filter(function(b){
            return b.ourBalance > .002;
        });

        var sortedBalances = normalizedBalances.sort(function(a,b){
            return -(a.ourBalance - b.ourBalance);
        });

        window.nb = sortedBalances

        sortedBalances.forEach(function(b){
            $(".balances").append("<div class=" + b.upClass + ">" + b.currency + " : " + b.normalizedBalance + "    " + b.ourBalanceString + "    " + b.priceString + "</div>")
        });
    }

    function updateTotalsContainer(){
        if (cryptoState && cryptoState.totals && cryptoState.totals.BTC && cryptoState.totals.USD){
            var normalizedUSD = cryptoState.totals.USD.toFixed(2).toString();
            var normalizedBTC = cryptoState.totals.BTC.toFixed(3).toString();

            // if (normalizedUSD.length > 7){
            //     normalizedUSD = normalizedUSD.slice(0, 7);
            // }
            // if (normalizedBTC.length > 7){
            //     normalizedBTC = normalizedBTC.slice(0, 4);
            // }

            var profit = cryptoState.totals.USD > startingUSD;
            var difference = Math.abs(startingUSD - cryptoState.totals.USD);

            var differenceCharacter = "-";
            if (profit){
                differenceCharacter = "+";
            }

            var normalizedDifference = difference.toFixed(2).toString();

            // if (normalizedDifference.length > 6){
            //     normalizedDifference = normalizedDifference.slice(0, 6);
            // }

            var totalString = "\$" + normalizedUSD + " (" + normalizedBTC + " BTC)<br /> <span class='total-change'>(" + differenceCharacter + "$" + normalizedDifference + " total since 9/4)</span>";

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
        renderBTCPrice();
        renderLastWinner();
    }

    function renderLastWinner(){
        if (roundState && roundState.winner && roundState.winner.situation !== "NO_WINNER"){
            $(".last-winner-label").show();
            $(".last-winner-info").show();
            if (roundState.winner.situation === "TIE"){
                $(".last-winner-info").html("Last round was a tie. Waiting for a real winner!");
            } else if (roundState.winner.situation === "NOT_ENOUGH"){
                 $(".last-winner-info").html("Insufficient BTC to place buy :(");
            } else if (roundState.winner.action && roundState.winner.symbol && roundState.winner.symbol.toUpperCase) {
                $(".last-winner-info").html("!" + roundState.winner.action + " " + roundState.winner.symbol.toUpperCase());                
            }
        } else {
            $(".last-winner-label").hide();
            $(".last-winner-info").hide();
        }
    }

    function percentChange (prev, today){
        var diff = Math.abs(100 - (today / prev) * 100);
        return diff && diff.toString && diff.toString();
    }

    function renderBTCPrice(){
        if (cryptoState && cryptoState.btcMarket && cryptoState.btcMarket.Last){
            var price = cryptoState.btcMarket.Last;

            var prevDay = cryptoState.btcMarket.PrevDay;

            var up = false;

            if (prevDay < price){
                up = true;
            }

            var normalizedPrice = price.toString();
            if (normalizedPrice.length > 6){
                normalizedPrice = normalizedPrice.slice(0, 6);
            }

            var difference = Math.abs(100 - (price / prevDay) * 100);

            var normalizedDifference = difference.toString();

            if (normalizedDifference.length > 5){
                normalizedDifference = normalizedDifference.slice(0, 5);
            }

            var differenceCharacter = "-";

            if (up){
                differenceCharacter = "+";
            }

            var priceString = "$ " + normalizedPrice;

            priceString += " (" + differenceCharacter + " " + normalizedDifference + " %)" ;

            $(".btc-price-now").html(priceString);

            if (up){
                $(".btc-price-now").addClass("up");
                $(".btc-price-now").removeClass("down");
            } else {
                $(".btc-price-now").addClass("down");
                $(".btc-price-now").removeClass("up");
            }
        }
    }

    function updateMetaContainer(){
        if (testMode){
            $(".test-mode").show()
        }
    }

    function normalizeUsername(name){
        var normalized = name;
        if (name && name.length && name){
            if (name.length > 12){
                normalized = name.slice(0, 11);
            }
        }

        return normalized;
    }

    function updateVoteTotalsContainer(){
        $(".vote-totals-list").html("");

        Object.keys(roundState.votes.buy).forEach(function(k){
            $(".vote-totals-list").append("<li>!buy " + k + " : " +  roundState.votes.buy[k] + "</li>")
        });
        Object.keys(roundState.votes.sell).forEach(function(k){
            $(".vote-totals-list").append("<li>!sell " + k + " : " +  roundState.votes.sell[k] + "</li>")
        });
    }

    function updateVoteHistoryContainer(){
        $(".vote-history-list").html("");

        roundState.votes.history.forEach(function(vote){
            $(".vote-history-list").append("<li>" + normalizeUsername(vote.user) + " : " +  vote.action + " " + vote.symbol + "</li>")
        });
    }

});

