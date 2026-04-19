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
            shuffle(question.answers);
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

        let wrapper = document.createElement("div");
        wrapper.className = "answer-wrapper";

        switch (answers[i]["type"]) {
            case "text":
                addTextToHolder(wrapper, answers[i]["content"], true, i);
                break;
            case "image":
                addImageToHolder(wrapper, answers[i]["src"], true, i);
                break;
            default:
                alert("Error: unknown answer type - addAnswersToHolder");
                break;
        }

        let badBtn = document.createElement("button");
        badBtn.id = "bad-answer-btn-" + i;
        badBtn.className = "bad-answer-btn" + (answers[i].bad ? " bad-active" : "");
        badBtn.title = "Označit odpověď jako špatnou";
        badBtn.innerHTML = "<span uk-icon='icon: ban; ratio: 0.8'></span>";
        badBtn.onclick = (function(idx) {
            return function(e) { e.stopPropagation(); toggleBadAnswer(idx); };
        })(i);
        wrapper.appendChild(badBtn);

        if (answers[i].bad) {
            let answerEl = document.getElementById("answer-" + i);
            if (answerEl) answerEl.classList.add("bad");
        }

        aholder.appendChild(wrapper);
    }
}

function toggleBadAnswer(id) {
    let answer = question.answers[id];
    let answerEl = document.getElementById("answer-" + id);
    let badBtn = document.getElementById("bad-answer-btn-" + id);

    if (answer.bad) {
        answer.bad = false;
        answerEl.classList.remove("bad");
        badBtn.classList.remove("bad-active");
    } else {
        answer.bad = true;
        answerEl.classList.add("bad");
        badBtn.classList.add("bad-active");
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

        container.classList.add("uk-button-default");
    }
    holder.appendChild(container);
}

function addTextAnswerToHolderMd(holder, text, id = -1){
    let src = "data:text/plain;charset=utf-8," + encodeURIComponent(text);
    holder.setAttribute("src", src);

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
            case "text-md":
                const mdHolder = document.getElementById("md-holder");
                mdHolder.hidden = false;
                addTextAnswerToHolderMd(mdHolder, question["answers"][i]["content"], i);
                break;
            default:
                alert("Error: unknown answer type - " + question["answers"][i]["type"]);

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
