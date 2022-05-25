
function interpretSelfAssessment(showAnswer) {
    document.getElementById("checkButton").onclick = showAnswer;
    document.getElementById("checkButton").innerHTML = "Show Answer";
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

/**
 * @brief adds an image to the given holder
 * @param {*} holder 
 * @param {*} src 
 * @param {*} id 
 */
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

/**
 * @brief adds a text to the given holder
 * @param {*} data 
 * @param {*} holder 
 * @param {*} id 
 */
function interpretTextData(data, holder, id) {
    let holderElement = document.getElementById(holder);
    let text = document.createElement("p");
    text.id = "answer-" + id;
    text.className = "uk-text " + (holder == "questionHolder" ? "question" : "answer");
    text.innerText = data["content"];
    if (holder == "questionHolder") {
        text.onclick = function () {
            select(id);
        }
    }
    holderElement.appendChild(text);


}

function interpretImageData(data, holder, id) {
    addImage(holder, data.src, id);
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


