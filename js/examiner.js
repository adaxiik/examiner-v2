
/**
 * @brief Checks if the DLC is supported
 * 
 * @param {*} questions Loaded .dlc file 
 * @returns false if the file is not supported
 */
function VerifyDlc(questions) {
    if (questions["data"] == undefined) {
        showEndscreen("Error", "Could not find data in DLC file :(");
        return false;
    }

    if (questions["data"].length == 0) {
        showEndscreen("Error", "No questions found in DLC file :(");
        return false;
    }

    if (!supportedVersions.includes(questions["version"])) {
        showEndscreen("Error", "Unsupported DLC version :(");
        return false;
    }

    return true;
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

        this.startTime = new Date();
        let qListElement = document.getElementById('questionList');
        questions.forEach((question, key) => {
            let qElement = document.createElement('div');
            qElement.innerText = key + 1;
            qElement.id = 'question-list-item-' + question.id;
            qListElement.appendChild(qElement);
        });

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