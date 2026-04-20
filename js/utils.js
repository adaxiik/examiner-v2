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
    document.getElementById("unmarkButton").hidden = true;
}

function showCheckButton() {
    document.getElementById("checkButton").hidden = false;
    document.getElementById("skipButton").hidden = false;
    document.getElementById("unmarkButton").hidden = true;
}

function hideSkipButton() {
    document.getElementById("skipButton").hidden = true;
}

function showUnmarkButton() {
    document.getElementById("unmarkButton").hidden = false;
}

function hideUnmarkButton() {
    document.getElementById("unmarkButton").hidden = true;
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
            <span class="stats-card-label">Answered Correctly</span>
        </div>
        <div class="stats-card wrong">
            <span class="stats-card-value">${statsData.wrongAttempts}</span>
            <span class="stats-card-label">Wrong Attempts</span>
        </div>
        <div class="stats-card corrected">
            <span class="stats-card-value">${statsData.correctedCount}</span>
            <span class="stats-card-label">Corrected</span>
        </div>
        <div class="stats-card skipped">
            <span class="stats-card-value">${statsData.skippedCount}</span>
            <span class="stats-card-label">Skipped</span>
        </div>
        <div class="stats-card">
            <span class="stats-card-value">${fmtTime(avgMs)}</span>
            <span class="stats-card-label">Average Answer Time</span>
        </div>
        <div class="stats-card">
            <span class="stats-card-value">${fmtTime(maxMs)}</span>
            <span class="stats-card-label">Longest Answer Time</span>
        </div>
    </div>`;

    let wrongEntries = Object.entries(statsData.questionWrongCounts)
        .filter(([, c]) => c > 0)
        .sort((a, b) => b[1] - a[1]);

    if (wrongEntries.length > 0) {
        html += `<p class="stats-section-title">Incorrectly Answered Questions</p>
        <div class="stats-table-wrapper">
        <table class="stats-table">
            <thead><tr><th>Question</th><th style="text-align:center;">Wrong Attempts</th></tr></thead>
            <tbody>`;
        for (let [id, count] of wrongEntries) {
            let q = questions.find(q => String(q.id) === String(id));
            let text = (q && q.question && q.question.type === 'text')
                ? (q.question.content.length > 90 ? q.question.content.substring(0, 90) + '…' : q.question.content)
                : 'Question ID ' + id;
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

// ── Sound system ──────────────────────────────────────────────────────────────

const UI_SOUNDS   = ['select', 'deselect', 'dismiss', 'pause', 'show', 'skip', 'prev', 'next'];
const EXAM_SOUNDS = ['correct', 'wrong', 'celebration'];
const SOUND_NAMES = [...UI_SOUNDS, ...EXAM_SOUNDS];

const SOUND_LABELS = {
    select:      'Select answer',
    deselect:    'Deselect answer',
    dismiss:     'Dismiss answer',
    pause:       'Pause / resume',
    show:        'Show answer',
    skip:        'Skip question',
    prev:        'Previous question',
    next:        'Next question',
    correct:     'Correct answer',
    wrong:       'Wrong answer',
    celebration: 'Celebration music',
};
const SOUND_STORAGE_KEY = 'examiner_sounds';

let _soundSettings = (function() {
    try {
        let s = JSON.parse(localStorage.getItem(SOUND_STORAGE_KEY));
        if (s && typeof s.muted === 'boolean' && s.sounds) {
            SOUND_NAMES.forEach(n => { if (!(n in s.sounds)) s.sounds[n] = true; });
            if (!s.groups)            s.groups = { ui: true };
            if (s.volume === undefined) s.volume = 1.0;
            return s;
        }
    } catch {}
    let sounds = {};
    SOUND_NAMES.forEach(n => { sounds[n] = true; });
    return { muted: false, volume: 1.0, groups: { ui: true }, sounds };
})();

function _saveSoundSettings() {
    try { localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(_soundSettings)); } catch {}
}

let _audioCtx = null;
function _getAudioCtx() {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return _audioCtx;
}

function _playTone(frequency, type, startTime, duration, gainValue, ctx) {
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(gainValue, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
}

function playSound(name) {
    if (_soundSettings.muted) return;
    if (UI_SOUNDS.includes(name) && !_soundSettings.groups.ui) return;
    let settingsKey = (name === 'end' || name === 'finish') ? 'celebration' : name;
    if (!_soundSettings.sounds[settingsKey]) return;
    try {
        let ctx = _getAudioCtx();
        let now = ctx.currentTime;
        let v = _soundSettings.volume;
        switch (name) {
            case 'select':
                _playTone(600, 'sine', now, 0.05, 0.10 * v, ctx);
                break;
            case 'deselect':
                _playTone(400, 'sine', now, 0.04, 0.04 * v, ctx);
                break;
            case 'dismiss':
                _playTone(320, 'sine', now, 0.06, 0.04 * v, ctx);
                break;
            case 'pause':
                _playTone(380, 'sine', now, 0.05, 0.04 * v, ctx);
                break;
            case 'show':
                _playTone(440, 'sine', now,        0.08, 0.12 * v, ctx);
                _playTone(554, 'sine', now + 0.07, 0.10, 0.12 * v, ctx);
                break;
            case 'skip':
                _playTone(500, 'sine', now,        0.07, 0.07 * v, ctx);
                _playTone(380, 'sine', now + 0.06, 0.07, 0.07 * v, ctx);
                break;
            case 'prev':
                _playTone(380, 'sine', now,        0.07, 0.07 * v, ctx);
                _playTone(500, 'sine', now + 0.06, 0.07, 0.07 * v, ctx);
                break;
            case 'next':
                _playTone(440, 'sine', now, 0.07, 0.12 * v, ctx);
                break;
            case 'correct':
                _playTone(523.25, 'sine', now,        0.15, 0.25 * v, ctx);
                _playTone(659.25, 'sine', now + 0.12, 0.15, 0.25 * v, ctx);
                _playTone(783.99, 'sine', now + 0.24, 0.25, 0.30 * v, ctx);
                break;
            case 'wrong':
                _playTone(220, 'sawtooth', now,       0.12, 0.20 * v, ctx);
                _playTone(180, 'sawtooth', now + 0.1, 0.18, 0.20 * v, ctx);
                break;
            case 'end':
            case 'finish':
                // Ascending arpeggio intro
                _playTone(523.25, 'triangle', now + 0.00, 0.12, 0.28 * v, ctx); // C5
                _playTone(659.25, 'triangle', now + 0.11, 0.12, 0.28 * v, ctx); // E5
                _playTone(783.99, 'triangle', now + 0.22, 0.12, 0.28 * v, ctx); // G5
                _playTone(1046.5, 'sine',     now + 0.33, 0.28, 0.32 * v, ctx); // C6 peak
                // Bridge
                _playTone(783.99, 'triangle', now + 0.65, 0.10, 0.22 * v, ctx); // G5
                _playTone(880.00, 'triangle', now + 0.75, 0.10, 0.22 * v, ctx); // A5
                _playTone(987.77, 'triangle', now + 0.85, 0.10, 0.22 * v, ctx); // B5
                _playTone(1046.5, 'sine',     now + 0.95, 0.10, 0.25 * v, ctx); // C6
                _playTone(1174.7, 'sine',     now + 1.05, 0.10, 0.25 * v, ctx); // D6
                // Final triumphant note
                _playTone(1318.5, 'sine',     now + 1.15, 0.65, 0.32 * v, ctx); // E6
                // Bass support on peak
                _playTone(261.63, 'sine',     now + 0.33, 0.28, 0.08 * v, ctx); // C4
                _playTone(392.00, 'sine',     now + 0.33, 0.28, 0.06 * v, ctx); // G4
                // Final chord
                _playTone(261.63, 'sine',     now + 1.15, 0.75, 0.10 * v, ctx); // C4
                _playTone(329.63, 'sine',     now + 1.15, 0.75, 0.08 * v, ctx); // E4
                _playTone(392.00, 'sine',     now + 1.15, 0.75, 0.08 * v, ctx); // G4
                _playTone(523.25, 'sine',     now + 1.15, 0.75, 0.10 * v, ctx); // C5
                break;
        }
    } catch (e) {}
}

const _SVG_SOUND_ON  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
const _SVG_SOUND_OFF = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

function _updateSoundBtn() {
    let btn = document.getElementById('soundButton');
    if (!btn) return;
    let allOff = _soundSettings.muted || SOUND_NAMES.every(n => !_soundSettings.sounds[n]);
    btn.innerHTML = allOff ? _SVG_SOUND_OFF : _SVG_SOUND_ON;
    btn.classList.toggle('muted', allOff);
}

let _soundPanelOpen = false;

function toggleSound(event) {
    if (event) event.stopPropagation();
    _soundPanelOpen = !_soundPanelOpen;
    let panel = document.getElementById('soundPanel');
    if (panel) {
        panel.hidden = !_soundPanelOpen;
        if (_soundPanelOpen) _buildSoundPanel();
    }
}

function _makeDivider() {
    let d = document.createElement('div');
    d.className = 'sound-panel-divider';
    return d;
}

function _makeVolumeRow(disabled) {
    let row = document.createElement('div');
    row.className = 'sound-panel-row sound-panel-volume' + (disabled ? ' disabled' : '');

    let label = document.createElement('span');
    label.className = 'sound-panel-label';
    label.textContent = 'Volume';

    let slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = Math.round(_soundSettings.volume * 100);
    slider.className = 'sound-volume-slider';
    slider.disabled = disabled;
    slider.oninput = function() {
        _soundSettings.volume = parseInt(this.value) / 100;
        _saveSoundSettings();
    };

    row.appendChild(label);
    row.appendChild(slider);
    return row;
}

function _buildSoundPanel() {
    let panel = document.getElementById('soundPanel');
    if (!panel) return;
    panel.innerHTML = '';
    let masterOff = _soundSettings.muted;

    // Master toggle
    let allRow = _makeSoundRow('All sounds', !masterOff, true, function(checked) {
        _soundSettings.muted = !checked;
        _saveSoundSettings();
        _updateSoundBtn();
        _buildSoundPanel();
    });
    allRow.classList.add('sound-panel-all');
    panel.appendChild(allRow);

    // Volume slider
    panel.appendChild(_makeDivider());
    panel.appendChild(_makeVolumeRow(masterOff));

    // UI / Click sounds group
    panel.appendChild(_makeDivider());
    let uiOn = _soundSettings.groups.ui;
    let uiEnabled = !masterOff;
    let uiGroupRow = _makeSoundRow('UI / Click sounds', uiOn, uiEnabled, function(checked) {
        _soundSettings.groups.ui = checked;
        _saveSoundSettings();
        _buildSoundPanel();
    });
    uiGroupRow.classList.add('sound-panel-group');
    panel.appendChild(uiGroupRow);

    UI_SOUNDS.forEach(function(name) {
        let subEnabled = uiEnabled && uiOn;
        let row = _makeSoundRow(SOUND_LABELS[name], _soundSettings.sounds[name], subEnabled, function(checked) {
            _soundSettings.sounds[name] = checked;
            _saveSoundSettings();
            _updateSoundBtn();
        });
        row.classList.add('sound-panel-sub');
        panel.appendChild(row);
    });

    // Exam sounds (individual)
    panel.appendChild(_makeDivider());
    EXAM_SOUNDS.forEach(function(name) {
        let row = _makeSoundRow(SOUND_LABELS[name], _soundSettings.sounds[name], !masterOff, function(checked) {
            _soundSettings.sounds[name] = checked;
            _saveSoundSettings();
            _updateSoundBtn();
        });
        panel.appendChild(row);
    });
}

function _makeSoundRow(label, checked, enabled, onChange) {
    let row = document.createElement('label');
    row.className = 'sound-panel-row';
    if (!enabled) row.classList.add('disabled');

    let sw = document.createElement('span');
    sw.className = 'sound-switch' + (checked ? ' on' : '');

    let input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.disabled = !enabled;
    input.style.display = 'none';
    input.onchange = function() { onChange(this.checked); };

    sw.onclick = function(e) {
        e.preventDefault();
        if (!enabled) return;
        input.checked = !input.checked;
        sw.classList.toggle('on', input.checked);
        input.dispatchEvent(new Event('change'));
    };

    let span = document.createElement('span');
    span.className = 'sound-panel-label';
    span.textContent = label;

    row.appendChild(sw);
    row.appendChild(input);
    row.appendChild(span);
    return row;
}

(function() {
    _updateSoundBtn();
    document.addEventListener('click', function(e) {
        if (!_soundPanelOpen) return;
        let btn = document.getElementById('soundButton');
        let panel = document.getElementById('soundPanel');
        if (!btn || !panel) return;
        if (!btn.contains(e.target) && !panel.contains(e.target)) {
            _soundPanelOpen = false;
            panel.hidden = true;
        }
    });
})();

// ─────────────────────────────────────────────────────────────────────────────

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
