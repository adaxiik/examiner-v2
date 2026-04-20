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
        loadQuestions(contents, file.name);
    };
    reader.readAsText(file);
}




/**
 * @brief Loads the questions from the DLC file and starts the exam
 * @param {*} contents  .dlc file contents
 * @returns
 */
function loadQuestions(contents, fileName, skipSessionCheck) {
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

    saveToRecent(fileName || questions["name"], contents);

    currentDlcName = fileName || questions["name"];
    currentDlcData = questions;

    console.log("Loaded " + questions["name"] + " dlc");

    if (!skipSessionCheck) {
        let saved = getSavedSession();
        if (saved && saved.dlcName === currentDlcName) {
            showConfirmscreen("title",
                "Continue previous attempt?<br><em>" + currentDlcName + "</em>",
                function () { playGame(questions, saved); }
            );
            document.getElementById("cancelButton").onclick = function () {
                document.getElementById("confirmScreen").hidden = true;
                document.getElementById("title").hidden = false;
                clearSavedSession();
                loadQuestions(contents, fileName, true);
            };
            return;
        }
    }

    var uploadButton = document.getElementById("uploadButton");
    if (uploadButton) uploadButton.parentNode.removeChild(uploadButton);

    playGame(questions);
}

let examiner;
let question;
let reviewMode = false;
let questionStartElapsed = 0;
let questionHistory = [];
let currentDlcName = '';
let currentDlcData = null;
let stats = {
    correctAttempts: 0,
    wrongAttempts: 0,
    correctedCount: 0,
    skippedCount: 0,
    answerTimes: [],
    questionWrongCounts: {},
};

// ── Session persistence ──────────────────────────────────────────────────────

const SESSION_KEY = 'examiner_session';

function getSavedSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch { return null; }
}

function clearSavedSession() {
    localStorage.removeItem(SESSION_KEY);
}

function saveSession() {
    if (!examiner) return;
    try {
        let state = {
            dlcName: currentDlcName,
            statsData: JSON.parse(JSON.stringify(stats)),
            elapsedTime: examiner.totalElapsed,
            questionsOrder: examiner.questions.map(q => q.id),
            questionIndex: examiner.questionIndex,
            end: examiner.end,
            poolQuestionIds: examiner.questionPool.questions.map(q => q.id),
            skippedIds: examiner.skippedQueue.map(q => q.id),
            questionListClasses: getQuestionListClasses(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save session:', e);
    }
}

function getQuestionListClasses() {
    let classes = {};
    let items = document.getElementById('questionList').children;
    for (let item of items) {
        let id = item.id.replace('question-list-item-', '');
        classes[id] = Array.from(item.classList);
    }
    return classes;
}

function restoreSession(savedState, allQuestions) {
    let idToQ = {};
    allQuestions.forEach(q => { idToQ[q.id] = q; });

    examiner.questions = savedState.questionsOrder.map(id => idToQ[id]).filter(Boolean);
    examiner.questionIndex = savedState.questionIndex;
    examiner.end = savedState.end;

    examiner.questionPool.questions = (savedState.poolQuestionIds || []).map(id => idToQ[id]).filter(Boolean);
    examiner.questionPool.currentQuestion = 0;
    examiner.questionPool.previousQuestion = 0;

    examiner.skippedQueue = (savedState.skippedIds || []).map(id => idToQ[id]).filter(Boolean);

    examiner.elapsedTime = savedState.elapsedTime || 0;
    examiner.lastResumeTime = Date.now();
    examiner.paused = false;

    stats = savedState.statsData || stats;

    if (savedState.questionListClasses) {
        for (let [id, classes] of Object.entries(savedState.questionListClasses)) {
            let item = document.getElementById('question-list-item-' + id);
            if (item) {
                item.className = '';
                classes.forEach(c => { if (c) item.classList.add(c); });
            }
        }
    }
}

// ── Game flow ────────────────────────────────────────────────────────────────

/**
 * @brief creates the examiner and starts the exam
 * @param {*} dlc dlc object
 * @param {*} savedState optional saved session state
 */
function playGame(dlc, savedState) {
    var uploadButton = document.getElementById("uploadButton");
    if (uploadButton) uploadButton.parentNode.removeChild(uploadButton);

    showExaminer(dlc.name);

    poolsize = 5;
    if (dlc.hasOwnProperty("poolsize") && dlc.poolsize > 0)
        poolsize = dlc.poolsize;

    console.log("DLC version: " + dlc.version);
    console.log("Poolsize: " + poolsize);

    examiner = new Examiner(dlc.data, poolsize);
    console.log("Loaded " + examiner.GetQuestionCount + " questions");

    if (savedState) {
        restoreSession(savedState, dlc.data);
    }

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
    playSound('pause');
}

function confirmFinish() {
    showConfirmscreen("examiner", "Are you sure you want to finish?<br>Remaining questions will be skipped.", function () {
        playSound('end');
        clearSavedSession();
        showEndscreen("Finished", "The exam was terminated early.");
        showStats(stats, examiner.questions);
    });
}

function updatePrevButton() {
    let btn = document.getElementById('prevButton');
    if (btn) btn.disabled = questionHistory.length === 0;
}

function nextQuestion() {
    if (question) questionHistory.push(question.id);
    updatePrevButton();

    showCheckButton();
    syncPauseState();

    question = examiner.GetQuestion();
    questionStartElapsed = examiner.totalElapsed;

    console.log(question);
    console.log("Loaded Question ID: " + question["id"]);

    Array.from(document.getElementById('questionList').getElementsByClassName('active')).forEach(x => x.classList.remove('active'));
    document.getElementById("question-list-item-" + question["id"]).classList.add("active");

    cleanUpHolders();
    interpretQuestion(question);
}

function prevQuestion() {
    if (questionHistory.length === 0) return;
    let prevId = questionHistory.pop();
    updatePrevButton();
    playSound('prev');
    goToQuestion(prevId);
}


/**
 * @brief Skips the current question and marks it with a purple flag
 */
function skipQuestion() {
    if (question) questionHistory.push(question.id);
    updatePrevButton();

    document.getElementById('question-list-item-' + question.id).classList.add("skipped");
    stats.skippedCount++;
    examiner.SkipCurrentQuestion();
    saveSession();
    playSound('skip');
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

        if (question.type === 'self-assessment') {
            showAnswer(true);
        }

        let checkBtn = document.getElementById("checkButton");
        checkBtn.innerHTML = "Continue";
        checkBtn.onclick = exitReviewMode;

        let listItem = document.getElementById('question-list-item-' + question.id);
        if (question.type === 'self-assessment' && listItem && listItem.classList.contains('correct')) {
            showUnmarkButton();
        }
    } else {
        questionStartElapsed = examiner.totalElapsed;
    }
}

function exitReviewMode() {
    reviewMode = false;
    nextQuestion();
}

function unmarkQuestion() {
    if (!question) return;
    let listItem = document.getElementById('question-list-item-' + question.id);

    let wasCorrected = listItem.classList.contains('correct') && listItem.classList.contains('wrong');
    listItem.classList.remove('correct', 'wrong', 'skipped', 'active');

    stats.correctAttempts = Math.max(0, stats.correctAttempts - 1);
    if (wasCorrected) stats.correctedCount = Math.max(0, stats.correctedCount - 1);

    // Put the question back into the pool
    examiner.questionPool.AddQuestion(question);

    saveSession();
    goToQuestion(question.id);
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

    // Hide dismiss buttons after check is revealed
    document.querySelectorAll('.dismiss-btn').forEach(btn => btn.style.display = 'none');

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
        saveSession();
        if (examiner.IsEnd) {
            playSound('finish');
            document.getElementById("checkButton").innerHTML = "LET'S GOO";
            document.getElementById("checkButton").onclick = function () {
                clearSavedSession();
                showEndscreen("Congratulations!", "You have answered all questions correctly!");
                showStats(stats, examiner.questions);
            };
            return;
        }
        playSound('correct');
        console.log("All correct");
    }
    else {
        stats.wrongAttempts++;
        stats.questionWrongCounts[question.id] = (stats.questionWrongCounts[question.id] || 0) + 1;
        listItem.classList.add("wrong");
        saveSession();
        playSound('wrong');
        console.log("Not all correct");
    }

    document.getElementById("checkButton").onclick = function() { playSound('next'); nextQuestion(); };
    document.getElementById("checkButton").innerHTML = "Next - " + (examiner.GetQuestionCount) + " to go";
}







document.getElementById('file-input')
    .addEventListener('change', readSingleFile, false);

document.getElementById('reload-file-input').addEventListener('change', function(e) {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(ev) {
        reloadQuestionsFromContent(ev.target.result);
    };
    reader.readAsText(file);
    // Reset so the same file can be reloaded again
    e.target.value = '';
}, false);

function reloadQuestionsFromContent(contents) {
    if (!examiner) return;
    let newDlc;
    try { newDlc = JSON.parse(contents); } catch (e) { alert('Could not parse file.'); return; }
    if (!VerifyDlc(newDlc)) return;

    let newById = {};
    newDlc.data.forEach(q => { newById[q.id] = q; });

    let existingIds = new Set(examiner.questions.map(q => q.id));

    // Update content of matching questions in-place
    examiner.questions.forEach(q => {
        if (newById[q.id]) {
            Object.assign(q, newById[q.id]);
        }
    });

    // Add brand-new questions (not in current session)
    let added = 0;
    newDlc.data.forEach(q => {
        if (!existingIds.has(q.id)) {
            examiner.questions.push(q);
            // Add to question list sidebar
            let qListElement = document.getElementById('questionList');
            let num = qListElement.children.length + 1;
            let qElement = document.createElement('div');
            qElement.innerText = num;
            qElement.id = 'question-list-item-' + q.id;
            if (q.question && q.question.type === 'text') setupTooltip(qElement, q.question.content);
            qElement.onclick = function() { goToQuestion(q.id); };
            qListElement.appendChild(qElement);
            added++;
        }
    });
    // If new questions were added, ensure examiner knows there are more to process
    if (added > 0) {
        examiner.end = false;
    }

    saveToRecent(newDlc.name || currentDlcName, contents);
    saveSession();

    let msg = 'Questions reloaded.';
    if (added > 0) msg += ' ' + added + ' new question(s) added.';
    alert(msg);
}

// Drag and drop area
document.addEventListener('dragenter', () => {
    let btn = document.getElementById('uploadButton');
    if (btn) btn.classList.add('onDrag');
});
let _uploadBtn = document.getElementById('uploadButton');
if (_uploadBtn) _uploadBtn.addEventListener('dragleave', () => {
    _uploadBtn.classList.remove('onDrag');
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
})();

// Recent files
const RECENT_FILES_KEY = 'examiner_recent_files';
const RECENT_FILES_MAX = 8;

function getRecentFiles() {
    try {
        return JSON.parse(localStorage.getItem(RECENT_FILES_KEY)) || [];
    } catch {
        return [];
    }
}

function saveToRecent(name, content) {
    try {
        let recent = getRecentFiles();
        recent = recent.filter(f => f.name !== name);
        recent.unshift({ name, content, timestamp: Date.now() });
        recent = recent.slice(0, RECENT_FILES_MAX);
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recent));
    } catch (e) {
        console.warn('Could not save to recent files:', e);
    }
}

function deleteFromRecent(index) {
    let recent = getRecentFiles();
    recent.splice(index, 1);
    try {
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recent));
    } catch (e) {}
    renderRecentFiles();
}

function loadFromRecent(index) {
    let recent = getRecentFiles();
    if (!recent[index]) return;
    loadQuestions(recent[index].content, recent[index].name);
}

function renderRecentFiles() {
    let panel = document.getElementById('recentFilesPanel');
    if (!panel) return;
    let recent = getRecentFiles();
    if (recent.length === 0) {
        panel.hidden = true;
        return;
    }
    panel.hidden = false;
    let list = document.getElementById('recentFilesList');
    list.innerHTML = '';
    let savedSession = getSavedSession();
    recent.forEach(function (file, index) {
        let date = new Date(file.timestamp).toLocaleString('cs-CZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        let item = document.createElement('div');
        item.className = 'recent-file-item';
        item.onclick = function () { loadFromRecent(index); };

        let nameSpan = document.createElement('span');
        nameSpan.className = 'recent-file-name';
        nameSpan.textContent = file.name;

        let dateSpan = document.createElement('span');
        dateSpan.className = 'recent-file-date';
        dateSpan.textContent = date;

        let delBtn = document.createElement('button');
        delBtn.className = 'recent-file-delete';
        delBtn.innerHTML = '&times;';
        delBtn.title = 'Remove from list';
        delBtn.onclick = function (e) {
            e.stopPropagation();
            deleteFromRecent(index);
        };

        item.appendChild(nameSpan);

        if (savedSession && savedSession.dlcName === file.name) {
            let tag = document.createElement('span');
            tag.className = 'recent-file-tag';
            tag.textContent = 'In Progress';
            item.appendChild(tag);
        }

        item.appendChild(dateSpan);
        item.appendChild(delBtn);
        list.appendChild(item);
    });
}

renderRecentFiles();

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
