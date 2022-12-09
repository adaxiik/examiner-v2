// question --- question data -- text/image
//          |-- answers (array) -- text/image


function interpretQuestion(question){
    console.log(question);
    addQuestionToholder(question["question"]);
    var checkbtn = document.getElementById("checkButton");
    switch (question["type"]) {
        case "self-assessment":
            checkbtn.onclick = showAnswer;
            checkbtn.innerHTML = "Show Answer";
            break;
        case "question-with-answers":
            checkbtn.onclick = checkAnswers;
            checkbtn.innerHTML = "Check";
            addAnswersToHolder(question["answers"]);
            break;
        default:
            alert("Error: unknown question type");
            break;
        }
        
}


function addQuestionToholder(questiondata){
    const qholder = document.getElementById("questionHolder");

    switch (questiondata["type"]) {
        case "text":
            addTextToHolder(qholder, questiondata["content"]);
            break;
        case "image":
            addImageToHolder(qholder, questiondata["src"]);
            break;
        default:
            alert("Error: unknown question data type");
            break;
    }
}

function addAnswersToHolder(answers){
    const aholder = document.getElementById("answersHolder");

    for (let i = 0; i < answers.length; i++) {
        answers[i]["selected"] = false;
        switch (answers[i]["type"]) {
            case "text":
                addTextToHolder(aholder, answers[i]["content"], true, i);
                break;
            case "image":
                addImageToHolder(aholder, answers[i]["src"], true, i);
                break;
            default:
                alert("Error: unknown answer type");
                break;
        }
    }
}

function addTextToHolder(holder, text, isAnswer = false, id = -1){
    let container = document.createElement("p");
    container.id = isAnswer ? "answer-"+id : "question";
    container.className = isAnswer ? "uk-text answer" : "uk-text question";
    container.innerText = text;

    if(isAnswer){
        container.onclick = function(){
            select(id);
        }

        container.classList.add("uk-button");
        container.classList.add("uk-button-default");
    }
    holder.appendChild(container);
}

function addImageToHolder(holder, src, isAnswer = false, id = -1){
    let container = document.createElement("div");
    container.id = "uk-img-container";
    container.className = "uk-img-container uk-background-secondary ";

    let img = document.createElement("img");
    img.id = isAnswer ? "answer-"+id : "question";
    img.className = isAnswer ? "uk-img answer" : "uk-img question";
    img.src = src;
    if(isAnswer){
        img.onclick = function(){
            select(id);
        }
    }
    container.appendChild(img);
    holder.appendChild(container);
}








// function interpretSelfAssessment(showAnswer) {
//     document.getElementById("checkButton").onclick = showAnswer;
//     document.getElementById("checkButton").innerHTML = "Show Answer";
// }

// function interpretData(data, holder, id) {

//     switch (data["type"]) {
//         case "text":
//             interpretTextData(data, holder, id);
//             break;
//         case "image":
//             interpretImageData(data, holder, id);
//             break;
//         default:
//             alert("Error: unknown question type");
//             break;
//     }
// }

// /**
//  * @brief adds an image to the given holder
//  * @param {*} holder 
//  * @param {*} src 
//  * @param {*} id 
//  */
// function addImage(holder, src, id) {
//     let holderElement = document.getElementById(holder);

//     let type = holder == "questionHolder" ? "question" : "answer";

//     let container = document.createElement("div");
//     container.id = "uk-img-container";
//     container.className = "uk-img-container uk-background-secondary ";
//     holderElement.appendChild(container);

//     let img = document.createElement("img");
//     img.id = "answer-" + id;
//     img.className = "uk-img " + type;
//     img.src = src;
//     if (type == "answer") {
//         img.onclick = function () {
//             select(id);
//         }
//     }
//     container.appendChild(img);
// }

// /**
//  * @brief adds a text to the given holder
//  * @param {*} data 
//  * @param {*} holder 
//  * @param {*} id 
//  */
// function interpretTextData(data, holder, id) {
//     let holderElement = document.getElementById(holder);
//     let text = document.createElement("p");
//     text.id = "answer-" + id;
//     text.className = "uk-text " + (holder == "questionHolder" ? "question" : "answer");
//     text.innerText = data["content"];
//     if (holder == "questionHolder") {
//         text.onclick = function () {
//             select(id);
//         }
//     }
//     holderElement.appendChild(text);


// }

// function interpretImageData(data, holder, id) {
//     addImage(holder, data.src, id);
// }

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



/**
 * @brief show answer function for self assessment questions
 */
 function showAnswer() {
    hideCheckButton();
    const answersHolder = document.getElementById("answersHolder");

    for (let i = 0; i < question["answers"].length; i++) {
        switch (question["answers"][i]["type"]) {
            case "text":
                addTextToHolder(answersHolder, question["answers"][i]["content"], false, i);
                break;
            case "image":
                addImageToHolder(answersHolder, question["answers"][i]["src"], false, i);
                break;
            default:
                alert("Error: unknown answer type");
                break;
        }
    }


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

