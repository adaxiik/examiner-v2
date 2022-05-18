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

function loadQuestions(contents) {
    var questions;
    try {
        questions = JSON.parse(contents);
    }
    catch (e) {
        alert("Error loading questions: " + e.message);
        return;
    }
    console.log("Loaded " + questions["name"] + " dlc");

    if (questions["data"] == undefined) {
        alert("Error loading questions: questions not found");
        return;
    }
    if (questions["data"].length == 0) {
        alert("Error loading questions: no questions found");
        return;
    }
    if (questions["version"] != "1.0") {
        alert("Error loading questions: version not supported");
        return;
    }

    var uploadButton = document.getElementById("uploadButton");
    uploadButton.parentNode.removeChild(uploadButton);

    playGame(questions);
}

class QuestionPool {
    constructor(size) {
        this.questions = [];
        this.size = size;
        this.currentQuestion = 0;
    }

    AddQuestion(question) {
        this.questions.push(question);
    }

    get IsFull() {
        return this.questions.length >= this.size;
    }

    GetRandomQuestion() {
        this.currentQuestion = Math.floor(Math.random() * this.questions.length);
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
        return this.end;
    }
    get GetQuestionCount() {
        return this.questions.length;
    }
    FillQuestionPool() {
        while (!this.questionPool.IsFull && this.questionIndex < this.questions.length) {
            var question = this.questions[this.questionIndex];
            this.questionIndex++;
            this.questionPool.AddQuestion(question);
        }
    }


}


function playGame(dlc) {
    document.getElementById("title").hidden = true;
    document.getElementById("examiner").hidden = false;

    let examiner = new Examiner(dlc["data"]);
    console.log("Loaded " + examiner.GetQuestionCount + " questions");
    let question = examiner.GetQuestion();
    console.log(question);


    shuffle(question["answers"]);

    


    interpretData(question["question"], "questionHolder");
    for (let i = 0; i < question["answers"].length; i++) {
        let answer = question["answers"][i];
        interpretData(answer, "answersHolder");
    }


}

function interpretData(data, holder) {

    switch (data["type"]) {
        case "text":
            interpretTextData(data, holder);
            break;
        case "image":
            interpretImageData(data, holder);
            break;
        default:
            alert("Error: unknown question type");
            break;
    }
}
function addImage(holder, src) {
    let holderElement = document.getElementById(holder);
    
    let type = holder=="questionHolder" ? "question" : "answer";

    let container = document.createElement("div");
    container.id = "uk-img-container";
    container.className = "uk-img-container uk-background-secondary ";
    holderElement.appendChild(container);

    let img = document.createElement("img");
    img.id = "uk-img";
    img.className = "uk-img " + type;
    img.src = src;
    container.appendChild(img);

}

function interpretTextData(data, holder) {

}

function interpretImageData(data, holder) {
    addImage(holder, data["src"]);
}


document.getElementById('file-input')
    .addEventListener('change', readSingleFile, false);