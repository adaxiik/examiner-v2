https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
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

function VerifyDlc(questions)
{
    if (questions["data"] == undefined) {
        showEndscreen("Error","Could not find data in DLC file :(");
        return false;
    }
    if (questions["data"].length == 0) {
        showEndscreen("Error","No questions found in DLC file :(");
        return false;
    }
    if (questions["version"] != "1.0") {
        showEndscreen("Error","Unsupported DLC version :(");
        return false;
    }

    return true;
}

function loadQuestions(contents) {
    var questions;
    try {
        questions = JSON.parse(contents);
    }
    catch (e) {
        showEndscreen("Error","Could not parse DLC file :(");
        return;
    }

    if (!VerifyDlc(questions))
        return;

    console.log("Loaded " + questions["name"] + " dlc");

    var uploadButton = document.getElementById("uploadButton");
    uploadButton.parentNode.removeChild(uploadButton);

    playGame(questions);
}

class QuestionPool {
    constructor(size) {
        this.questions = [];
        this.size = size;
        this.currentQuestion = 0;
        this.previousQuestion = 0;
    }

    AddQuestion(question) {
        this.questions.push(question);
    }

    get IsFull() {
        return this.questions.length >= this.size;
    }
    get IsEmpty() {
        return this.questions.length == 0;
    }

    GetRandomQuestion() {
        this.currentQuestion;
        do {
            this.currentQuestion = Math.floor(Math.random() * this.questions.length);
        } while (this.currentQuestion == this.previousQuestion && this.questions.length > 1);

        this.previousQuestion = this.currentQuestion;
        return this.questions[this.currentQuestion];
    }

    RemoveCurrentQuestion() {
        this.questions.splice(this.currentQuestion, 1);
    }
}

class Examiner {
    constructor(questions) {
        this.questions = shuffle(questions);
        this.questionIndex = 0;
        this.end = false;
        this.questionPool = new QuestionPool(5);

        this.FillQuestionPool();

    }
    GetQuestion() {
        if (!this.questionPool.IsFull) {
            this.FillQuestionPool();
        }
        return this.questionPool.GetRandomQuestion();
    }
    RemoveCurrentQuestion() {
        this.questionPool.RemoveCurrentQuestion();
    }


    get IsEnd() {
        return this.questionPool.IsEmpty;
    }
    get GetQuestionCount() {
        return this.questions.length - this.questionIndex + this.questionPool.questions.length;
    }
    FillQuestionPool() {
        while (!this.questionPool.IsFull && this.questionIndex < this.questions.length) {
            var question = this.questions[this.questionIndex];
            this.questionIndex++;
            this.questionPool.AddQuestion(question);
        }
        if (this.questionIndex >= this.questions.length) {
            this.end = true;
        }
    }
}

let examiner;
let question;

function checkAnswers() {
    let allcorrect = true;
    for (let i = 0; i < question["answers"].length; i++) {
        let answer = question["answers"][i];
        let input = document.getElementById("answer-" + i);

        if (answer["selected"]) {
            if (answer["correct"]) {
                input.classList.add("correct");
            }
            else {
                input.classList.add("wrong");
                allcorrect = false;
            }
        }
        else {
            if (answer["correct"]) {
                input.classList.add("notselected");
                allcorrect = false;
            }

        }
        if(input.classList.contains("selected")){
            input.classList.remove("selected");
        }

    }

    if (allcorrect) {
        examiner.RemoveCurrentQuestion();
        console.log("Removed Question ID: " + question["id"]);
        if (examiner.IsEnd) {
            //alert("Congratulations! You have answered all questions correctly!");
            document.getElementById("checkButton").innerHTML="LET'S GOO";
            document.getElementById("checkButton").onclick=function(){
                showEndscreen("Congratulations!","You have answered all questions correctly!");
            }

            return;
        }
        console.log("All correct");
    }
    else {
        console.log("Not all correct");
    }

    document.getElementById("checkButton").onclick=nextQuestion;
    document.getElementById("checkButton").innerHTML="Next - " + (examiner.GetQuestionCount) + " to go";
}

function showEndscreen(title, subtitle){
    document.getElementById("examiner").hidden = true;
    document.getElementById("title").hidden = true;
    endScreen = document.getElementById("endScreen");
    endScreen.hidden = false;
    document.getElementById("titleText").innerHTML = title;
    document.getElementById("subtitleText").innerHTML = subtitle;
    
}

function nextQuestion(){

    question = examiner.GetQuestion();
    shuffle(question["answers"]);
    console.log(question);
    console.log("Loaded Question ID: " + question["id"]);

    document.getElementById("questionHolder").innerHTML = "";
    document.getElementById("answersHolder").innerHTML = "";

    interpretData(question["question"], "questionHolder", -1);

    for (let i = 0; i < question["answers"].length; i++) {
        question["answers"][i]["selected"] = false;
        interpretData(question["answers"][i], "answersHolder", i);
    }

    document.getElementById("checkButton").onclick=checkAnswers;
    document.getElementById("checkButton").innerHTML="Check";
}

function playGame(dlc) {
    document.getElementById("title").hidden = true;
    document.getElementById("examiner").hidden = false;
    examiner = new Examiner(dlc["data"]);
    console.log("Loaded " + examiner.GetQuestionCount + " questions");
    nextQuestion();

}

function interpretData(data, holder, id) {

    switch (data["type"]) {
        case "text":
            interpretTextData(data, holder, id);
            break;
        case "image":
            interpretImageData(data, holder, id);
            break;
        default:
            alert("Error: unknown question type");
            break;
    }
}
function addImage(holder, src, id) {
    let holderElement = document.getElementById(holder);

    let type = holder == "questionHolder" ? "question" : "answer";

    let container = document.createElement("div");
    container.id = "uk-img-container";
    container.className = "uk-img-container uk-background-secondary ";
    holderElement.appendChild(container);

    let img = document.createElement("img");
    img.id = "answer-" + id;
    img.className = "uk-img " + type;
    img.src = src;
    if (type == "answer") {
        img.onclick = function () {
            select(id);
        }
    }
    container.appendChild(img);

}

function interpretTextData(data, holder, id) {

}

function interpretImageData(data, holder, id) {
    addImage(holder, data["src"], id);
}

function select(id) {
    console.log("Selected " + id);
    if (question["answers"][id]["selected"]) {
        question["answers"][id]["selected"] = false;
        document.getElementById("answer-" + id).classList.remove("selected");
    }
    else {
        question["answers"][id]["selected"] = true;
        document.getElementById("answer-" + id).classList.add("selected");
    }
}



document.getElementById('file-input')
    .addEventListener('change', readSingleFile, false);

// Drag and drop area

document.addEventListener('dragenter',()=>{
    document.getElementById('uploadButton').classList.add('onDrag');
})
document.getElementById('uploadButton').addEventListener('dragleave',()=>{
    document.getElementById('uploadButton').classList.remove('onDrag');
});

function loadFromURL(url){

    console.log("Loading from URL: ", url);

    fetch(url)
    .then(data=>{
        data.json()
        .then(dlc=>{
            if (VerifyDlc(dlc)) {
                playGame(dlc);
            }
        })
        .catch((err)=>{
            showEndscreen("Error","Could not parse DLC file :(");
        });
    })
    .catch((err)=>{
        showEndscreen("Error","Could not load DLC from URL");
    });
}
// Load file from url
(function(){
    const urlParams = new URLSearchParams(window.location.search);
    let fileUrl = urlParams.get('file');

    if (fileUrl === null)
        return;

    loadFromURL(fileUrl);
})();