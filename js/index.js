const supportedVersions =  ["1.3"];
const supportedQuestionTypes = ["self-assessment", "question-with-answers"];

console.log("Currently supported DLC versions: " + supportedVersions);
console.log("Currently supported question types: " + supportedQuestionTypes);


/**
 * @brief Entry point 
 * @param {*} e event
 * 
 */
function readSingleFile(e) {
    var file = e.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var contents = e.target.result;
        console.log("Loading file " + file.name);
        loadQuestions(contents);
    };
    reader.readAsText(file);
}




/**
 * @brief Loads the questions from the DLC file and starts the exam
 * @param {*} contents  .dlc file contents
 * @returns 
 */
function loadQuestions(contents) {
    var questions;
    try {
        questions = JSON.parse(contents);
    }
    catch (e) {
        showEndscreen("Error", "Could not parse DLC file :(");
        return;
    }

    if (!VerifyDlc(questions))
        return;

    console.log("Loaded " + questions["name"] + " dlc");

    var uploadButton = document.getElementById("uploadButton");
    uploadButton.parentNode.removeChild(uploadButton);

    playGame(questions);
}

let examiner;
let question;
let reviewMode = false;
let questionStartElapsed = 0;
let stats = {
    correctAttempts: 0,
    wrongAttempts: 0,
    correctedCount: 0,
    skippedCount: 0,
    answerTimes: [],
    questionWrongCounts: {},
};

/**
 * @brief creates the examiner and starts the exam
 * @param {*} dlc dlc object 
 */
function playGame(dlc) {
    showExaminer(dlc.name);

    poolsize = 5
    if(dlc.hasOwnProperty("poolsize") && dlc.poolsize > 0)
        poolsize = dlc.poolsize;

    console.log("DLC version: " + dlc.version);
    console.log("Poolsize: " + poolsize);

    examiner = new Examiner(dlc.data, poolsize);
    console.log("Loaded " + examiner.GetQuestionCount + " questions");
    nextQuestion();
}


/**
 * @brief Shows the next question
 * 
 */
function syncPauseState() {
    if (!examiner) return;
    let paused = examiner.paused;
    document.getElementById('checkButton').disabled = paused;
    document.getElementById('skipButton').disabled = paused;
}

function togglePause() {
    if (!examiner) return;
    if (examiner.paused) {
        examiner.resume();
        document.getElementById('pauseButton').innerText = '⏸';
        document.getElementById('timer').classList.remove('paused');
    } else {
        examiner.pause();
        document.getElementById('pauseButton').innerText = '▶';
        document.getElementById('timer').classList.add('paused');
    }
    syncPauseState();
}

function confirmFinish() {
    showConfirmscreen("examiner", "Opravdu chcete ukončit zkoušení?<br>Zbývající otázky budou vynechány.", function () {
        showEndscreen("Ukončeno", "Zkoušení bylo předčasně ukončeno.");
        showStats(stats, examiner.questions);
    });
}

function nextQuestion() {
    showCheckButton();
    syncPauseState();

    question = examiner.GetQuestion();
    questionStartElapsed = examiner.totalElapsed;

    console.log(question);
    console.log("Loaded Question ID: " + question["id"]);

    Array.from(document.getElementById('questionList').getElementsByClassName('active')).forEach(x => x.classList.remove('active'));
    document.getElementById("question-list-item-" + question["id"]).classList.add("active");

    cleanUpHolders();

    // interpretData(question["question"], "questionHolder", -1);

    // // for self assessment questions
    // if (question.hasOwnProperty("type") && question["type"] == "self-assessment") {
    //     interpretSelfAssessment(showAnswer);
    //     return;
    // }
    interpretQuestion(question);

    // dont shuffle answers for self assessment questions
    // 
    
    // for (let i = 0; i < question["answers"].length; i++) {
    //     question["answers"][i]["selected"] = false;
    //     interpretData(question["answers"][i], "answersHolder", i);
    // }

    
}



/**
 * @brief Skips the current question and marks it with a purple flag
 */
function skipQuestion() {
    document.getElementById('question-list-item-' + question.id).classList.add("skipped");
    stats.skippedCount++;
    examiner.SkipCurrentQuestion();
    nextQuestion();
}

/**
 * @brief Navigates to a specific question by ID (pool or already answered)
 */
function goToQuestion(questionId) {
    let q = examiner.GoToQuestion(questionId);
    reviewMode = !q;

    if (reviewMode) {
        q = examiner.GetQuestionDataById(questionId);
        if (!q) return;
    }

    question = q;

    showCheckButton();
    syncPauseState();

    Array.from(document.getElementById('questionList').getElementsByClassName('active')).forEach(x => x.classList.remove('active'));
    document.getElementById("question-list-item-" + question["id"]).classList.add("active");

    cleanUpHolders();
    interpretQuestion(question);

    if (reviewMode) {
        hideSkipButton();
        let checkBtn = document.getElementById("checkButton");
        checkBtn.innerHTML = "Continue";
        checkBtn.onclick = exitReviewMode;
    } else {
        questionStartElapsed = examiner.totalElapsed;
    }
}

function exitReviewMode() {
    reviewMode = false;
    nextQuestion();
}

/**
 * @brief Checks the answers and shows the correct answer
 *
 */
function checkAnswers() {
    hideSkipButton();
    let allcorrect = true;
    for (let i = 0; i < question.answers.length; i++) {
        let answer = question.answers[i];
        let input = document.getElementById("answer-" + i);

        if (answer.selected) {
            if (answer.correct) {
                input.classList.add("correct");
            }
            else {
                input.classList.add("wrong");
                input.classList.add("uk-animation-shake");
                allcorrect = false;
            }
        }
        else {
            if (answer["correct"]) {
                input.classList.add("notselected");
                allcorrect = false;
            }
        }
        if (input.classList.contains("selected")) {
            input.classList.remove("selected");
        }
    }

    let listItem = document.getElementById('question-list-item-' + question.id);
    listItem.classList.remove("skipped");

    let questionTime = examiner.totalElapsed - questionStartElapsed;

    if (allcorrect) {
        stats.correctAttempts++;
        stats.answerTimes.push(questionTime);
        if ((stats.questionWrongCounts[question.id] || 0) > 0) stats.correctedCount++;
        examiner.RemoveCurrentQuestion();
        listItem.classList.add("correct");
        console.log("Removed Question ID: " + question["id"]);
        if (examiner.IsEnd) {
            document.getElementById("checkButton").innerHTML = "LET'S GOO";
            document.getElementById("checkButton").onclick = function () {
                showEndscreen("Congratulations!", "You have answered all questions correctly!");
                showStats(stats, examiner.questions);
            };
            return;
        }
        console.log("All correct");
    }
    else {
        stats.wrongAttempts++;
        stats.questionWrongCounts[question.id] = (stats.questionWrongCounts[question.id] || 0) + 1;
        listItem.classList.add("wrong");
        console.log("Not all correct");
    }

    document.getElementById("checkButton").onclick = nextQuestion;
    document.getElementById("checkButton").innerHTML = "Next - " + (examiner.GetQuestionCount) + " to go";
}







document.getElementById('file-input')
    .addEventListener('change', readSingleFile, false);

// Drag and drop area
document.addEventListener('dragenter', () => {
    document.getElementById('uploadButton').classList.add('onDrag');
})
document.getElementById('uploadButton').addEventListener('dragleave', () => {
    document.getElementById('uploadButton').classList.remove('onDrag');
});

// Load file from url
(function () {
    const urlParams = new URLSearchParams(window.location.search);
    let fileUrl = urlParams.get('file');

    if (fileUrl === null)
        return;

    showConfirmscreen("title","You are about to load a DLC file from a url.<br>Are you sure you trust the source?",() => {
        loadFromURL(fileUrl);
    });
    // if (confirm("You are about to load a DLC file from a url.\nAre you sure you trust the source?"))
    //     loadFromURL(fileUrl);
})();

// Timer
setInterval(() => {
    if (examiner != null) {
        let ms = examiner.totalElapsed;
        let seconds = Math.ceil(ms / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        document.getElementById('timer').innerText = (hours > 0 ? String(hours).padStart(2, '0') + ' : ' : '') + String(minutes % 60).padStart(2, '0') + " : " + String(seconds % 60).padStart(2, '0');
    }
}, 500);