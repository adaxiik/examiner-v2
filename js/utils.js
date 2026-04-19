//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
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

/**
 * @brief shows end/error message
 * @param {*} title
 * @param {*} subtitle
 */
function showEndscreen(title, subtitle) {
    document.getElementById("examiner").hidden = true;
    document.getElementById("title").hidden = true;
    endScreen = document.getElementById("endScreen");
    endScreen.hidden = false;
    document.getElementById("titleText").innerHTML = title;
    document.getElementById("subtitleText").innerHTML = subtitle;
}

function showConfirmscreen(origin,text,confirmFn) {
    document.getElementById("confirmScreen").hidden = false;
    document.getElementById(origin).hidden = true;
    document.getElementById("confirmTitle").innerHTML = text;
    document.getElementById("confirmButton").onclick = function() {
        document.getElementById("confirmScreen").hidden = true;
        confirmFn();
    }
    document.getElementById("cancelButton").onclick = function () {
        document.getElementById("confirmScreen").hidden = true;
        document.getElementById(origin).hidden = false;
    }

}

/**
 * @brief Set title of the page and setup screen
 * @param {*} dlcname
 */
function showExaminer(dlcname) {
    document.getElementById("title").hidden = true;
    document.getElementById("examiner").hidden = false;
    document.getElementById('dlc-name').innerText = dlcname ?? "Examiner v2";
    document.title = (dlcname ?? "Unknown DLC") + " - Examiner v2";
}

function hideCheckButton() {
    document.getElementById("checkButton").hidden = true;
    document.getElementById("skipButton").hidden = true;
}

function showCheckButton() {
    document.getElementById("checkButton").hidden = false;
    document.getElementById("skipButton").hidden = false;
}

function hideSkipButton() {
    document.getElementById("skipButton").hidden = true;
}

/**
 * @brief Clean up question and answers holders
 */
function cleanUpHolders() {
    document.getElementById("questionHolder").innerHTML = "";
    document.getElementById("answersHolder").innerHTML = "";
    document.getElementById("md-holder").src = "";
    document.getElementById("md-holder").hidden = true;
}

/**
 * @brief loads dlc from url
 * @param {*} url url of dlc file
 */
function loadFromURL(url) {
    console.log("Loading from URL: ", url);

    fetch(url)
        .then(data => {
            data.json()
                .then(dlc => {
                    if (VerifyDlc(dlc)) {
                        playGame(dlc);
                    }
                })
                .catch((err) => {
                    showEndscreen("Error", "Could not parse DLC file :(<br>" + err);
                });
        })
        .catch((err) => {
            showEndscreen("Error", "Could not load DLC from URL");
        });
}


let _tooltip = null;
function _getTooltip() {
    if (!_tooltip) {
        _tooltip = document.createElement('div');
        _tooltip.style.cssText = 'position:fixed;background:#1a1a1a;color:white;padding:5px 10px;border-radius:4px;font-size:0.85rem;max-width:300px;z-index:9999;pointer-events:none;display:none;word-wrap:break-word;border:1px solid #444;line-height:1.4;';
        document.body.appendChild(_tooltip);
    }
    return _tooltip;
}

function setupTooltip(element, text) {
    element.addEventListener('mouseenter', function () {
        let t = _getTooltip();
        t.innerText = text;
        t.style.display = 'block';
    });
    element.addEventListener('mousemove', function (e) {
        let t = _getTooltip();
        let tw = t.offsetWidth || 300;
        let th = t.offsetHeight || 40;
        let x = e.clientX + 14;
        let y = e.clientY + 12;
        if (x + tw > window.innerWidth) x = e.clientX - tw - 10;
        if (y + th > window.innerHeight) y = e.clientY - th - 8;
        t.style.left = x + 'px';
        t.style.top = y + 'px';
    });
    element.addEventListener('mouseleave', function () {
        _getTooltip().style.display = 'none';
    });
    element.dataset.tooltipText = text;
}

function toggleSearch() {
    let bar = document.getElementById('questionSearchBar');
    bar.hidden = !bar.hidden;
    if (!bar.hidden) {
        document.getElementById('questionSearch').focus();
    } else {
        document.getElementById('questionSearch').value = '';
        searchQuestions('');
    }
}

function searchQuestions(value) {
    let items = document.getElementById('questionList').children;
    let query = value.trim().toLowerCase();
    for (let item of items) {
        if (!query) {
            item.style.display = '';
        } else {
            let title = (item.dataset.tooltipText || '').toLowerCase();
            let number = item.innerText.trim();
            item.style.display = (title.includes(query) || number === query) ? '' : 'none';
        }
    }
}

function showStats(statsData, questions) {
    let holder = document.getElementById('statsHolder');
    if (!holder || !statsData) return;

    function fmtTime(ms) {
        if (!ms || ms < 0) return '0:00';
        let s = Math.floor(ms / 1000);
        let m = Math.floor(s / 60);
        return m + ':' + String(s % 60).padStart(2, '0');
    }

    let times = statsData.answerTimes;
    let avgMs = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    let maxMs = times.length ? Math.max(...times) : 0;

    let html = `<div class="stats-grid">
        <div class="stats-card correct">
            <span class="stats-card-value">${statsData.correctAttempts}</span>
            <span class="stats-card-label">Správně zodpovězeno</span>
        </div>
        <div class="stats-card wrong">
            <span class="stats-card-value">${statsData.wrongAttempts}</span>
            <span class="stats-card-label">Špatných pokusů</span>
        </div>
        <div class="stats-card corrected">
            <span class="stats-card-value">${statsData.correctedCount}</span>
            <span class="stats-card-label">Opraveno</span>
        </div>
        <div class="stats-card skipped">
            <span class="stats-card-value">${statsData.skippedCount}</span>
            <span class="stats-card-label">Přeskočeno</span>
        </div>
        <div class="stats-card">
            <span class="stats-card-value">${fmtTime(avgMs)}</span>
            <span class="stats-card-label">Průměrný čas odpovědi</span>
        </div>
        <div class="stats-card">
            <span class="stats-card-value">${fmtTime(maxMs)}</span>
            <span class="stats-card-label">Nejdelší čas odpovědi</span>
        </div>
    </div>`;

    let wrongEntries = Object.entries(statsData.questionWrongCounts)
        .filter(([, c]) => c > 0)
        .sort((a, b) => b[1] - a[1]);

    if (wrongEntries.length > 0) {
        html += `<p class="stats-section-title">Chybně zodpovězené otázky</p>
        <div class="stats-table-wrapper">
        <table class="stats-table">
            <thead><tr><th>Otázka</th><th style="text-align:center;">Špatných pokusů</th></tr></thead>
            <tbody>`;
        for (let [id, count] of wrongEntries) {
            let q = questions.find(q => String(q.id) === String(id));
            let text = (q && q.question && q.question.type === 'text')
                ? (q.question.content.length > 90 ? q.question.content.substring(0, 90) + '…' : q.question.content)
                : 'Otázka ID ' + id;
            let safeText = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            html += `<tr class="stats-table-row" data-qid="${id}" onclick="showQuestionModal('${id}')">` +
                `<td>${safeText}</td><td>${count}</td></tr>`;
        }
        html += `</tbody></table></div>`;
    }

    holder.innerHTML = html;
}

function showQuestionModal(qid) {
    let allQuestions = (examiner && examiner.questions) ? examiner.questions : (currentDlcData ? currentDlcData.data : []);
    let q = allQuestions.find(q => String(q.id) === String(qid));
    if (!q) return;

    let modal = document.getElementById('questionModal');
    let body = document.getElementById('questionModalBody');
    body.innerHTML = '';

    // Question
    let qDiv = document.createElement('div');
    qDiv.className = 'modal-question';
    if (q.question.type === 'text') {
        qDiv.textContent = q.question.content;
    } else if (q.question.type === 'image') {
        let img = document.createElement('img');
        img.src = q.question.src;
        img.style.maxWidth = '100%';
        qDiv.appendChild(img);
    }
    body.appendChild(qDiv);

    // Answers
    if (q.answers && q.answers.length > 0) {
        let aDiv = document.createElement('div');
        aDiv.className = 'modal-answers';

        q.answers.forEach(function(a) {
            let el = document.createElement('div');
            el.className = 'modal-answer' + (a.correct ? ' correct' : '');
            if (a.type === 'text') {
                el.textContent = a.content;
            } else if (a.type === 'image') {
                let img = document.createElement('img');
                img.src = a.src;
                img.style.maxWidth = '100%';
                el.appendChild(img);
            } else if (a.type === 'text-md') {
                let mdEl = document.createElement('zero-md');
                mdEl.setAttribute('src', 'data:text/plain;charset=utf-8,' + encodeURIComponent(a.content));
                let tpl = document.createElement('template');
                tpl.innerHTML = '<link rel="stylesheet" href="css/md.css?v=6">'
                    + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/PrismJS/prism@1/themes/prism.min.css"/>';
                mdEl.appendChild(tpl);
                el.appendChild(mdEl);
            }
            aDiv.appendChild(el);
        });

        body.appendChild(aDiv);
    }

    modal.hidden = false;
}

document.addEventListener('DOMContentLoaded', function() {
    let closeBtn = document.getElementById('questionModalClose');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById('questionModal').hidden = true;
        };
    }
    document.getElementById('questionModal').addEventListener('click', function(e) {
        if (e.target === this) this.hidden = true;
    });
});

function createCorrectBtn(fn) {
    let correctButton = document.createElement("button");
    correctButton.innerHTML = "<span uk-icon='icon: check; ratio: 5.5'></span>";
    correctButton.classList.add("uk-button");
    correctButton.classList.add("uk-button-primary");
    correctButton.classList.add("uk-width-1-2");
    correctButton.classList.add("self-assessment-button-correct");
    correctButton.onclick = fn;
    return correctButton;
}

function createIncorrectBtn(fn) {
    let incorrectButton = document.createElement("button");
    incorrectButton.innerHTML = "<span uk-icon='icon: close; ratio: 5.5'></span>";
    incorrectButton.classList.add("uk-button");
    incorrectButton.classList.add("uk-button-danger");
    incorrectButton.classList.add("uk-width-1-2");
    incorrectButton.classList.add("self-assessment-button-wrong");
    incorrectButton.onclick = fn;
    return incorrectButton;
}
