import { StackmatDecoder } from './stackmat-decoder.js';
import { allAlgorithms } from './algs.js';
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const decoder = new StackmatDecoder();

const firebaseConfig = {
    apiKey: "AIzaSyA_DBD5S1sv7FGv_K6F7tUWxYs-JG3Jw-8",
    authDomain: "algdrill.firebaseapp.com",
    projectId: "algdrill",
    storageBucket: "algdrill.firebasestorage.app",
    messagingSenderId: "612013160",
    appId: "1:612013160:web:d664a05d36f71cf2c0d7dd"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const analytics = getAnalytics(app);

const urlParams = new URLSearchParams(window.location.search);
const event = urlParams.get('event') || '3x3';
const type = urlParams.get('type') || 'PLL';

const TIMER_FILTER_KEY = `timer_${event}_${type}_filters`;

const timerDisplay = document.getElementById('timer-display');
const startStopBtn = document.getElementById('start-stop-button');
const scrambleDiv = document.getElementById('scramble');
const historyList = document.getElementById('history-list');
const deleteAllBtn = document.getElementById('delete-all');
const averageTimeDiv = document.getElementById('average-time');
const toAlgsBtn = document.getElementById('to-algs');
const homeBtn = document.getElementById('home-button');
const filtersDiv = document.querySelector('.filters');

let isRunning = false;
let startTime = null;
let timerInterval;
let solves = JSON.parse(localStorage.getItem(`${event}_${type}_times`) || '[]');
let currentScramble = '';
let currentAlgData = null; 
let spaceHeld = false;
let currentEventAlgs = []; 

// SCRAMBLE HISTORY VARIABLES
let previousScrambleStr = null;
let previousAlgDataObj = null;
let isViewingPrevious = false;

// TYPING MODE INPUT SETUP
const typingInput = document.createElement('input');
typingInput.type = 'number';
typingInput.step = '0.01';
typingInput.placeholder = '0.00';
typingInput.style.cssText = 'display: none; font-size: 4rem; width: 100%; text-align: center; background: transparent; border: none; border-bottom: 2px solid var(--accent-color); color: var(--text-primary); outline: none; font-variant-numeric: tabular-nums; margin-bottom: 1rem;';

if (timerDisplay && timerDisplay.parentNode) {
    timerDisplay.parentNode.insertBefore(typingInput, timerDisplay.nextSibling);
}

function saveTimesLocallyAndToCloud() {
    const storageKey = `${event}_${type}_times`;
    localStorage.setItem(storageKey, JSON.stringify(solves));
    if (window.syncSolvesToFirebase) {
        window.syncSolvesToFirebase(storageKey, solves);
    }
}

window.reloadSolvesFromStorage = function() {
    solves = JSON.parse(localStorage.getItem(`${event}_${type}_times`) || '[]');
    renderHistory();
};

async function loadAlgs() {
    scrambleDiv.textContent = "Loading scrambles...";
    try {
        const docRef = doc(db, "global_algs", `${event}_${type}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().algs) {
            currentEventAlgs = docSnap.data().algs;
        } else {
            currentEventAlgs = allAlgorithms[event]?.[type] || [];
        }
    } catch (e) {
        currentEventAlgs = allAlgorithms[event]?.[type] || [];
    }
    setScramble();
}

function generateScramble() {
    const moves = ["R", "L", "U", "D", "F", "B"];
    const modifiers = ["", "'", "2"];
    let scramble = [];
    let lastMove = "";
    while (scramble.length < 20) {
        let move = moves[Math.floor(Math.random() * moves.length)];
        if (move === lastMove) continue;
        lastMove = move;
        let modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        scramble.push(move + modifier);
    }
    return scramble.join(" ");
}

function reverseAlg(alg) {
    if (!alg) return "";
    return alg.split(' ').reverse().map(move => {
        if (move.endsWith("'")) return move.slice(0, -1);
        else if (move.endsWith("2")) return move;
        else return move + "'";
    }).join(' ');
}

function applyRandomAUF(baseScramble) {
    if (!baseScramble) return "";
    const aufs = ["", "U", "U'", "U2"];
    const preAUF = aufs[Math.floor(Math.random() * aufs.length)];
    const postAUF = aufs[Math.floor(Math.random() * aufs.length)];

    let finalScramble = baseScramble.trim();

    if (preAUF) finalScramble = preAUF + " " + finalScramble;
    if (postAUF) finalScramble = finalScramble + " " + postAUF;

    return finalScramble.replace(/\s+/g, ' ').trim();
}

function setScramble() {
    if (!isViewingPrevious && currentScramble && currentScramble !== "Loading scrambles...") {
        previousScrambleStr = currentScramble;
        previousAlgDataObj = currentAlgData;
    }
    isViewingPrevious = false;

    const allAlgs = currentEventAlgs;
    const filterStatuses = new Set(
        JSON.parse(localStorage.getItem(TIMER_FILTER_KEY) || '["not learnt", "learning", "complete"]')
    );

    const STATUS_STORAGE_KEY = 'algStatuses';
    const savedStatuses = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');

    allAlgs.forEach(alg => {
        const statusKey = `${event}_${type}_${alg.name}`;
        if (savedStatuses[statusKey]) alg.status = savedStatuses[statusKey];
        else if (!alg.status) alg.status = 'not learnt';
    });

    const filteredAlgs = allAlgs.filter(alg => filterStatuses.has(alg.status));

    if (filteredAlgs.length === 0) {
        currentScramble = generateScramble();
        currentAlgData = null; 
    } else {
        const randomAlg = filteredAlgs[Math.floor(Math.random() * filteredAlgs.length)];
        const preferredAlg = localStorage.getItem(`pref_${event}_${type}_${randomAlg.name}`) || randomAlg.alg;

        currentAlgData = {
            name: randomAlg.name,
            image: randomAlg.image || "",
            headerAlg: preferredAlg
        };

        let baseScramble = "";
        if (randomAlg.scrambles && randomAlg.scrambles.length > 0) {
            baseScramble = randomAlg.scrambles[Math.floor(Math.random() * randomAlg.scrambles.length)];
        } else {
            baseScramble = randomAlg.scramble || reverseAlg(randomAlg.alg);
        }

        currentScramble = applyRandomAUF(baseScramble);
    }
    scrambleDiv.textContent = currentScramble;
}

function setupFilters() {
    if (!filtersDiv) return;
    const checkboxes = filtersDiv.querySelectorAll('input[type=checkbox]');
    checkboxes.forEach(cb => {
        const filterStatuses = new Set(
            JSON.parse(localStorage.getItem(TIMER_FILTER_KEY) || '["not learnt", "learning", "complete"]')
        );
        cb.checked = filterStatuses.has(cb.value);
        cb.addEventListener('change', () => {
            const newFilterStatuses = new Set(
                Array.from(filtersDiv.querySelectorAll('input[type=checkbox]:checked')).map(el => el.value)
            );
            localStorage.setItem(TIMER_FILTER_KEY, JSON.stringify(Array.from(newFilterStatuses)));
            setScramble();
        });
    });
}

function startTimer() {
    isRunning = true;
    startTime = performance.now();
    timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        timerDisplay.textContent = elapsed.toFixed(2);
    }, 10);
    startStopBtn.textContent = "Stop";
    timerDisplay.style.color = '';
}

function stopTimer(forcedTime = null) {
    isRunning = false;
    clearInterval(timerInterval);
    const finalTimeText = forcedTime !== null ? forcedTime : timerDisplay.textContent;

    solves.unshift({ 
        time: finalTimeText, 
        scramble: currentScramble,
        algName: currentAlgData ? currentAlgData.name : "Random Scramble",
        algImage: currentAlgData ? currentAlgData.image : "",
        algText: currentAlgData ? currentAlgData.headerAlg : ""
    });

    saveTimesLocallyAndToCloud(); 
    renderHistory();
    setScramble();
    startStopBtn.textContent = "Start";
}

startStopBtn.addEventListener('mousedown', () => { startStopBtn.style.backgroundColor = '#2f4'; });
startStopBtn.addEventListener('mouseup', () => {
    startStopBtn.style.backgroundColor = '';
    if (isRunning) stopTimer();
    else startTimer();
});

document.addEventListener('keydown', (e) => {
    if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        if (solves.length > 0) {
            deleteSolve(0);
        }
        return;
    }

    if (e.altKey && e.code === 'ArrowRight') {
        e.preventDefault();
        setScramble();
        return;
    }

    if (e.altKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        if (previousScrambleStr && !isViewingPrevious) {
            currentScramble = previousScrambleStr;
            currentAlgData = previousAlgDataObj;
            scrambleDiv.textContent = currentScramble;
            isViewingPrevious = true; 
        }
        return;
    }

    if (inputMode === 'timer' && document.activeElement !== typingInput) {
        if (isRunning) {
            e.preventDefault();
            stopTimer();
            spaceHeld = false;
            timerDisplay.style.color = '';
            return;
        }

        if (e.code === 'Space') {
            if (!spaceHeld) { 
                spaceHeld = true; 
                timerDisplay.style.color = 'limegreen'; 
            }
            e.preventDefault();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (inputMode === 'timer' && document.activeElement !== typingInput) {
        if (e.code === 'Space') {
            if (spaceHeld && !isRunning) {
                startTimer();
            }
            spaceHeld = false;
            timerDisplay.style.color = '';
        }
    }
});

typingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const rawText = typingInput.value.trim();
        if (!rawText) return;

        let finalVal = 0;

        if (rawText.includes('.')) {
            finalVal = parseFloat(rawText);
        } else {
            finalVal = parseInt(rawText, 10) / 100;
        }

        if (!isNaN(finalVal) && finalVal > 0) {
            stopTimer(finalVal.toFixed(2));
            typingInput.value = ''; 
        }
    }
});

deleteAllBtn.addEventListener('click', () => {
    if (confirm("Delete all recorded times?")) {
        solves = [];
        saveTimesLocallyAndToCloud(); 
        renderHistory();
    }
});

function deleteSolve(index) {
    solves.splice(index, 1);
    saveTimesLocallyAndToCloud(); 
    renderHistory();
}

function renderHistory() {
    if (!historyList) return;

    // FIX: Restore the grid layout when rendering the main history list
    historyList.style.display = ''; 
    historyList.innerHTML = '';

    solves.forEach((solve, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const solveNumber = solves.length - index;

        item.innerHTML = `
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 2px;">${solveNumber}</div>
            <div style="font-weight: bold; font-size: 1.15rem; color: var(--text-primary); font-family: monospace;">${parseFloat(solve.time).toFixed(2)}</div>
        `;

        item.addEventListener('click', () => { showDetail(index); });
        historyList.appendChild(item);
    });
    if (solves.length > 0) {
        const avg = solves.reduce((sum, s) => sum + parseFloat(s.time), 0) / solves.length;
        averageTimeDiv.textContent = `Average: ${avg.toFixed(2)}s`;
    } else { averageTimeDiv.textContent = 'Average: N/A'; }
}

function showDetail(index) {
    const solve = solves[index];

    // FIX: Temporarily kill the grid layout so this view can take 100% of the width
    historyList.style.display = 'block'; 
    historyList.innerHTML = '';

    const detail = document.createElement('div');
    detail.style.display = 'flex';
    detail.style.flexDirection = 'column';
    detail.style.alignItems = 'center';
    detail.style.textAlign = 'center';
    detail.style.padding = '10px';
    detail.style.width = '100%';
    detail.style.color = 'white';

    const imageSrc = solve.algImage || "images/placeholder.png";
    // Slightly bigger image for the full-width layout
    const imageHtml = `<img src="${imageSrc}" style="max-width: 100px; height: 100px; object-fit: contain; margin-bottom: 15px; border-radius: 8px; border: 1px solid #444; background: #222;" onerror="this.src='https://via.placeholder.com/100?text=No+Img'">`;

    const content = document.createElement('div');
    content.style.width = '100%';

    // Completely rebuilt HTML to stretch to 100% width and utilize Word Wrap properly
    content.innerHTML = `
    <div style="font-size: 1.4rem; font-weight: bold; margin-bottom: 8px;">${solve.algName || "Random Scramble"}</div>
    ${imageHtml}
    <div style="font-size: 2rem; color: #4CAF50; font-weight: bold; margin-bottom: 20px;">${parseFloat(solve.time).toFixed(2)}s</div>

    <div style="width: 100%; text-align: left; margin: 0 auto 15px auto;">
        <small style="color: #888; font-weight: bold; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px;">Algorithm</small>
        <div style="background: #111; padding: 12px; border-radius: 8px; border: 1px solid #333; color: #fff; font-family: monospace; font-size: 1rem; word-wrap: break-word; margin-top: 4px;">
            ${solve.algText || "N/A"}
        </div>
    </div>

    <div style="width: 100%; text-align: left; margin: 0 auto 20px auto;">
        <small style="color: #888; font-weight: bold; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px;">Scramble</small>
        <div style="background: #111; padding: 12px; border-radius: 8px; border: 1px solid #333; color: #aaa; font-family: monospace; font-size: 0.9rem; word-wrap: break-word; margin-top: 4px;">
            ${solve.scramble}
        </div>
    </div>
    `;
    detail.appendChild(content);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️ Delete Solve';
    deleteBtn.style.padding = "10px 16px";
    deleteBtn.style.borderRadius = "8px";
    deleteBtn.style.border = "none";
    deleteBtn.style.width = '100%';
    deleteBtn.style.backgroundColor = "#f44336";
    deleteBtn.style.color = "white";
    deleteBtn.style.fontWeight = "bold";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.fontSize = "1rem";
    deleteBtn.style.marginBottom = "10px";
    deleteBtn.onclick = () => { if(confirm("Delete this solve?")) deleteSolve(index); };
    detail.appendChild(deleteBtn);

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back to History'; 
    backBtn.style.padding = '10px 16px'; 
    backBtn.style.borderRadius = '8px'; 
    backBtn.style.border = '1px solid #555'; 
    backBtn.style.cursor = 'pointer'; 
    backBtn.style.background = '#333'; 
    backBtn.style.color = 'white';
    backBtn.style.width = '100%';
    backBtn.style.fontSize = "1rem";
    backBtn.onclick = renderHistory;
    detail.appendChild(backBtn);

    historyList.appendChild(detail);
    historyList.scrollTop = 0;
}

if (toAlgsBtn) toAlgsBtn.addEventListener('click', () => { window.location.href = `algs.html?event=${event}&type=${type}`; });
if (homeBtn) homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });

// --- MENU POP-UP INPUT LOGIC ---
let inputMode = localStorage.getItem('algdrill_input_mode') || 'timer';
let stackmatEnabled = false;

const oldBtn = document.getElementById('input-mode-btn');
let triggerBtn;
let menuContainer;

if (oldBtn) {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.bottom = '20px';
    wrapper.style.left = '20px';
    wrapper.style.zIndex = '1000';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'flex-start';
    wrapper.style.gap = '10px';

    menuContainer = document.createElement('div');
    menuContainer.style.display = 'none';
    menuContainer.style.flexDirection = 'column';
    menuContainer.style.background = 'var(--bg-secondary)';
    menuContainer.style.border = '1px solid var(--border-color)';
    menuContainer.style.borderRadius = '12px';
    menuContainer.style.overflow = 'hidden';
    menuContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

    const modes = [
        { id: 'timer', text: 'Timer' },
        { id: 'stackmat', text: 'Stackmat' },
        { id: 'typing', text: 'Typing' }
    ];

    modes.forEach(m => {
        const opt = document.createElement('div');
        opt.innerHTML = `<span>${m.text}</span>`;
        opt.style.padding = '12px 20px';
        opt.style.cursor = 'pointer';
        opt.style.color = 'var(--text-primary)';
        opt.style.transition = 'background 0.2s';
        opt.style.fontWeight = 'bold';

        opt.onmouseenter = () => opt.style.background = 'var(--bg-tertiary)';
        opt.onmouseleave = () => opt.style.background = 'transparent';

        opt.addEventListener('click', () => {
            setMode(m.id);
            menuContainer.style.display = 'none';
        });
        menuContainer.appendChild(opt);
    });

    triggerBtn = document.createElement('button');
    triggerBtn.style.padding = '12px 24px';
    triggerBtn.style.borderRadius = '25px';
    triggerBtn.style.border = '1px solid var(--border-color)';
    triggerBtn.style.cursor = 'pointer';
    triggerBtn.style.color = '#fff';
    triggerBtn.style.fontWeight = 'bold';
    triggerBtn.style.fontSize = '1rem';
    triggerBtn.style.display = 'flex';
    triggerBtn.style.alignItems = 'center';
    triggerBtn.style.gap = '8px';
    triggerBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';

    triggerBtn.addEventListener('click', () => {
        menuContainer.style.display = menuContainer.style.display === 'none' ? 'flex' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            menuContainer.style.display = 'none';
        }
    });

    oldBtn.parentNode.replaceChild(wrapper, oldBtn);
    wrapper.appendChild(menuContainer);
    wrapper.appendChild(triggerBtn);

    setMode(inputMode, true);
}

async function setMode(newMode, isInitialLoad = false) {
    if (stackmatEnabled) {
        decoder.stop();
        stackmatEnabled = false;
    }

    inputMode = newMode;
    localStorage.setItem('algdrill_input_mode', inputMode);

    if (inputMode === 'timer') {
        triggerBtn.innerHTML = 'Timer';
        triggerBtn.style.background = '#444';
        timerDisplay.style.display = 'block';
        typingInput.style.display = 'none';
        startStopBtn.style.display = 'inline-block';
    } 
    else if (inputMode === 'typing') {
        triggerBtn.innerHTML = 'Typing';
        triggerBtn.style.background = '#2196F3';
        timerDisplay.style.display = 'none';
        typingInput.style.display = 'block';
        startStopBtn.style.display = 'none';
        if (!isInitialLoad) typingInput.focus();
    } 
    else if (inputMode === 'stackmat') {
        triggerBtn.innerHTML = 'Stackmat';
        triggerBtn.style.background = '#4CAF50';
        timerDisplay.style.display = 'block';
        typingInput.style.display = 'none';
        startStopBtn.style.display = 'inline-block';

        try {
            await decoder.start((data) => {
                if (data.state === 'running' && !isRunning) {
                    startTimer();
                } else if (data.state === 'stopped' && isRunning) {
                    clearInterval(timerInterval);
                    const hardwareSeconds = (data.timeMs / 1000).toFixed(2);
                    timerDisplay.textContent = hardwareSeconds;
                    stopTimer();
                } else if (data.state === 'stopped' && data.timeMs === 0 && !isRunning) {
                    timerDisplay.textContent = "0.00";
                }
            });
            stackmatEnabled = true;
        } catch (err) {
            if (!isInitialLoad) {
                alert("Microphone access denied or not found.");
            }
            setMode('timer'); 
        }
    }
}

setupFilters();
renderHistory();
loadAlgs();