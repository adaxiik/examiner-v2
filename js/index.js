const supportedVersions =  ["1.0", "1.2"];

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

/**
 * @brief creates the examiner and starts the exam
 * @param {*} dlc dlc object 
 */
function playGame(dlc) {
    showExaminer(dlc.name);

    examiner = new Examiner(dlc.data);
    console.log("Loaded " + examiner.GetQuestionCount + " questions");
    nextQuestion();
}


/**
 * @brief Shows the next question
 * 
 */
function nextQuestion() {
    showCheckButton();

    question = examiner.GetQuestion();

    shuffle(question.answers);

    console.log(question);
    console.log("Loaded Question ID: " + question["id"]);


    Array.from(document.getElementById('questionList').getElementsByClassName('active')).forEach(x => x.classList.remove('active'));
    document.getElementById("question-list-item-" + question["id"]).classList.add("active");

    cleanUpHolders();

    interpretData(question["question"], "questionHolder", -1);

    // for self assessment questions
    if (question.hasOwnProperty("type") && question["type"] == "self-assessment") {
        interpretSelfAssessment(showAnswer);
        return;
    }

    for (let i = 0; i < question["answers"].length; i++) {
        question["answers"][i]["selected"] = false;
        interpretData(question["answers"][i], "answersHolder", i);
    }

    document.getElementById("checkButton").onclick = checkAnswers;
    document.getElementById("checkButton").innerHTML = "Check";
}

/**
 * @brief show answer function for self assessment questions
 */
function showAnswer() {
    hideCheckButton();

    for (let i = 0; i < question["answers"].length; i++) {
        interpretData(question["answers"][i], "answersHolder", i);
    }

    const answersHolder = document.getElementById("answersHolder");

    const correctButtonFn = function () {
        examiner.RemoveCurrentQuestion();
        document.getElementById('question-list-item-' + question.id).classList.add("correct");
        console.log("Removed Question ID: " + question["id"]);
        if (examiner.IsEnd) {
            showEndscreen("Congratulations!", "You have answered all questions correctly!");
            return;
        }
        console.log("Correct");
        nextQuestion();
    };
    answersHolder.appendChild(createCorrectBtn(correctButtonFn));

    const incorrectButtonFn = function () {
        document.getElementById('question-list-item-' + question.id).classList.add("wrong");
        console.log("incorrect");
        nextQuestion();
    };

    answersHolder.appendChild(createIncorrectBtn(incorrectButtonFn));
}

/**
 * @brief Checks the answers and shows the correct answer
 * 
 */
function checkAnswers() {
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

    if (allcorrect) {
        examiner.RemoveCurrentQuestion();
        document.getElementById('question-list-item-' + question.id).classList.add("correct");
        console.log("Removed Question ID: " + question["id"]);
        if (examiner.IsEnd) {
            //alert("Congratulations! You have answered all questions correctly!");
            document.getElementById("checkButton").innerHTML = "LET'S GOO";
            document.getElementById("checkButton").onclick = function () {
                showEndscreen("Congratulations!", "You have answered all questions correctly!");
            }
            return;
        }
        console.log("All correct");
    }
    else {
        document.getElementById('question-list-item-' + question.id).classList.add("wrong");
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

    loadFromURL(fileUrl);
})();

// Timer
setInterval(() => {
    if (examiner != null && examiner.startTime != undefined) {
        let seconds = Math.ceil((Date.now() - examiner.startTime) / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        document.getElementById('timer').innerText = (hours > 0 ? String(hours).padStart(2, '0') + ' : ' : '') + String(minutes % 60).padStart(2, '0') + " : " + String(seconds % 60).padStart(2, '0');
    }
}, 500);