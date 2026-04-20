// question --- question data -- text/image
//          |-- answers (array) -- text/image


function interpretQuestion(question){
    console.log(question);
    addQuestionToholder(question["question"]);
    var checkbtn = document.getElementById("checkButton");
    switch (question["type"]) {
        case "self-assessment":
            checkbtn.onclick = function() { showAnswer(false); };
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
        answers[i]["dismissed"] = false;

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

        let dismissBtn = document.createElement("button");
        dismissBtn.className = "dismiss-btn";
        dismissBtn.title = "Mark as incorrect";
        dismissBtn.innerHTML = "✕";
        (function(idx) {
            dismissBtn.onclick = function(e) {
                e.stopPropagation();
                dismissAnswer(idx);
            };
        })(i);
        wrapper.appendChild(dismissBtn);

        aholder.appendChild(wrapper);
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
    if (examiner && examiner.paused) return;
    if (question["answers"][id]["dismissed"]) return;
    console.log("Selected " + id);
    if (question["answers"][id]["selected"]) {
        question["answers"][id]["selected"] = false;
        document.getElementById("answer-" + id).classList.remove("selected");
        playSound('deselect');
    }
    else {
        question["answers"][id]["selected"] = true;
        document.getElementById("answer-" + id).classList.add("selected");
        playSound('select');
    }
}

function dismissAnswer(id) {
    let ans = question.answers[id];
    let el = document.getElementById("answer-" + id);
    ans.dismissed = !ans.dismissed;
    el.classList.toggle("dismissed");
    if (ans.dismissed && ans.selected) {
        ans.selected = false;
        el.classList.remove("selected");
    }
    playSound('dismiss');
}


/**
 * @brief show answer function for self assessment questions
 * @param {boolean} readOnly  true = display only, no correct/incorrect buttons
 */
 function showAnswer(readOnly) {
    readOnly = readOnly === true;
    if (!readOnly) hideCheckButton();
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

    if (readOnly) {
        let listItem = document.getElementById('question-list-item-' + question.id);
        if (listItem && listItem.classList.contains('correct')) {
            const unmarkRow = document.createElement('div');
            unmarkRow.className = 'self-assessment-btn-row';
            const unmarkBtn = document.createElement('button');
            unmarkBtn.innerHTML = "<span uk-icon='icon: refresh; ratio:1.5'></span> Unmark as correct";
            unmarkBtn.classList.add('uk-button', 'uk-button-default', 'uk-width-1-1', 'unmark-btn');
            unmarkBtn.onclick = function() { unmarkQuestion(); };
            unmarkRow.appendChild(unmarkBtn);
            answersHolder.appendChild(unmarkRow);
        }
        return;
    }

    const btnRow = document.createElement('div');
    btnRow.className = 'self-assessment-btn-row';

    const correctButtonFn = function () {
        let questionTime = examiner.totalElapsed - questionStartElapsed;
        stats.correctAttempts++;
        stats.answerTimes.push(questionTime);
        if ((stats.questionWrongCounts[question.id] || 0) > 0) stats.correctedCount++;
        examiner.RemoveCurrentQuestion();
        let listItem = document.getElementById('question-list-item-' + question.id);
        listItem.classList.remove("skipped");
        listItem.classList.add("correct");
        console.log("Removed Question ID: " + question["id"]);
        saveSession();
        if (examiner.IsEnd) {
            playSound('finish');
            clearSavedSession();
            showEndscreen("Congratulations!", "You have answered all questions correctly!");
            showStats(stats, examiner.questions);
            return;
        }
        playSound('correct');
        console.log("Correct");
        nextQuestion();
    };
    btnRow.appendChild(createCorrectBtn(correctButtonFn));

    const incorrectButtonFn = function () {
        stats.wrongAttempts++;
        stats.questionWrongCounts[question.id] = (stats.questionWrongCounts[question.id] || 0) + 1;
        let listItem = document.getElementById('question-list-item-' + question.id);
        listItem.classList.remove("skipped");
        listItem.classList.add("wrong");
        saveSession();
        playSound('wrong');
        console.log("incorrect");
        nextQuestion();
    };

    btnRow.appendChild(createIncorrectBtn(incorrectButtonFn));
    answersHolder.appendChild(btnRow);
}
