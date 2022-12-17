//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

/**
 * @brief shows end/error message
 * @param {*} title 
 * @param {*} subtitle 
 */
function showEndscreen(title, subtitle) {
    document.getElementById("examiner").hidden = true;
    document.getElementById("title").hidden = true;
    endScreen = document.getElementById("endScreen");
    endScreen.hidden = false;
    document.getElementById("titleText").innerHTML = title;
    document.getElementById("subtitleText").innerHTML = subtitle;
}

function showConfirmscreen(origin,text,confirmFn) {
    document.getElementById("confirmScreen").hidden = false;
    document.getElementById(origin).hidden = true;
    document.getElementById("confirmTitle").innerHTML = text;
    document.getElementById("confirmButton").onclick = function() {
        document.getElementById("confirmScreen").hidden = true;
        confirmFn();
    } 
    document.getElementById("cancelButton").onclick = function () {
        document.getElementById("confirmScreen").hidden = true;
        document.getElementById(origin).hidden = false;
    }

}

/**
 * @brief Set title of the page and setup screen
 * @param {*} dlcname 
 */
function showExaminer(dlcname) {
    document.getElementById("title").hidden = true;
    document.getElementById("examiner").hidden = false;
    document.getElementById('dlc-name').innerText = dlcname ?? "Examiner v2";
    document.title = (dlcname ?? "Unknown DLC") + " - Examiner v2";
}

function hideCheckButton() {
    document.getElementById("checkButton").hidden = true;
}

function showCheckButton() {
    document.getElementById("checkButton").hidden = false;
}

/**
 * @brief Clean up question and answers holders
 */
function cleanUpHolders() {
    document.getElementById("questionHolder").innerHTML = "";
    document.getElementById("answersHolder").innerHTML = "";
    document.getElementById("md-holder").src = "";
    document.getElementById("md-holder").hidden = true;
}

/**
 * @brief loads dlc from url
 * @param {*} url url of dlc file
 */
function loadFromURL(url) {
    console.log("Loading from URL: ", url);

    fetch(url)
        .then(data => {
            data.json()
                .then(dlc => {
                    if (VerifyDlc(dlc)) {
                        playGame(dlc);
                    }
                })
                .catch((err) => {
                    showEndscreen("Error", "Could not parse DLC file :(");
                });
        })
        .catch((err) => {
            showEndscreen("Error", "Could not load DLC from URL");
        });
}


function createCorrectBtn(fn) {
    let correctButton = document.createElement("button");
    correctButton.innerHTML = "<span uk-icon='icon: check; ratio: 5.5'></span>";
    correctButton.classList.add("uk-button");
    correctButton.classList.add("uk-button-primary");
    correctButton.classList.add("uk-width-1-2");
    correctButton.classList.add("self-assessment-button-correct");
    correctButton.onclick = fn;
    return correctButton;
}

function createIncorrectBtn(fn) {
    let incorrectButton = document.createElement("button");
    incorrectButton.innerHTML = "<span uk-icon='icon: close; ratio: 5.5'></span>";
    incorrectButton.classList.add("uk-button");
    incorrectButton.classList.add("uk-button-danger");
    incorrectButton.classList.add("uk-width-1-2");
    incorrectButton.classList.add("self-assessment-button-wrong");
    incorrectButton.onclick = fn;
    return incorrectButton;
}
