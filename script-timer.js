import { StackmatDecoder } from './stackmat-decoder.js';
import { allAlgorithms } from './algs.js';
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    const finalTimeText = timerDisplay.textContent;

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
    if (e.code === 'Space' && !stackmatEnabled) {
        if (!spaceHeld) { spaceHeld = true; timerDisplay.style.color = 'limegreen'; }
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && !stackmatEnabled) {
        if (!isRunning) startTimer();
        else stopTimer();
        spaceHeld = false;
        timerDisplay.style.color = '';
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
    historyList.innerHTML = '';
    solves.forEach((solve, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        const solveNumber = solves.length - index;
        const circle = document.createElement('span');
        circle.textContent = solveNumber;
        circle.style.display = 'inline-block';
        circle.style.width = '24px'; circle.style.height = '24px'; circle.style.borderRadius = '50%'; circle.style.border = '2px solid white'; circle.style.textAlign = 'center'; circle.style.marginRight = '10px'; circle.style.fontSize = '0.9rem'; circle.style.lineHeight = '22px';
        item.appendChild(circle);
        item.append(` ${parseFloat(solve.time).toFixed(2)}s - ${solve.algName || ""}`);
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
    const imageHtml = `<img src="${imageSrc}" style="max-width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px; border-radius: 8px; border: 1px solid #444; background: #222;" onerror="this.src='https://via.placeholder.com/80?text=No+Img'">`;

    const content = document.createElement('div');
    content.style.width = '100%';
    content.innerHTML = `
    <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">${solve.algName || "Random"}</div>
    ${imageHtml}
    <div style="font-size: 1.5rem; color: #4CAF50; font-weight: bold; margin-bottom: 10px;">${parseFloat(solve.time).toFixed(2)}s</div>

    <div style="width: 100%; max-width: 280px; text-align: left; margin: 0 auto 10px auto;">
    <small style="color: #888; font-weight: bold; text-transform: uppercase; font-size: 0.6rem;">Algorithm</small>
    <div style="background: #111; padding: 8px; border-radius: 6px; border: 1px solid #333; color: #fff; font-family: monospace; font-size: 0.85rem; word-break: break-all;">
    ${solve.algText || "N/A"}
    </div>
    </div>

    <div style="width: 100%; max-width: 280px; text-align: left; margin: 0 auto 10px auto;">
    <small style="color: #888; font-weight: bold; text-transform: uppercase; font-size: 0.6rem;">Scramble</small>
    <div style="background: #111; padding: 8px; border-radius: 6px; border: 1px solid #333; color: #aaa; font-family: monospace; font-size: 0.75rem; word-break: break-all;">
    ${solve.scramble}
    </div>
    </div>
    `;
    detail.appendChild(content);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '🗑️ Delete Solve';
    deleteBtn.style.marginTop = "10px";
    deleteBtn.style.padding = "8px 16px";
    deleteBtn.style.borderRadius = "8px";
    deleteBtn.style.border = "none";
    deleteBtn.style.width = '100%';
    deleteBtn.style.maxWidth = '250px';
    deleteBtn.style.backgroundColor = "#f44336";
    deleteBtn.style.color = "white";
    deleteBtn.style.fontWeight = "bold";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.onclick = () => { if(confirm("Delete this solve?")) deleteSolve(index); };
    detail.appendChild(deleteBtn);

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back'; 
    backBtn.style.marginTop = '8px'; 
    backBtn.style.padding = '8px 16px'; 
    backBtn.style.borderRadius = '8px'; 
    backBtn.style.border = 'none'; 
    backBtn.style.cursor = 'pointer'; 
    backBtn.style.background = '#333'; 
    backBtn.style.color = 'white';
    backBtn.style.width = '100%';
    backBtn.style.maxWidth = '250px';
    backBtn.onclick = renderHistory;
    detail.appendChild(backBtn);

    historyList.appendChild(detail);
    historyList.scrollTop = 0;
}

if (toAlgsBtn) toAlgsBtn.addEventListener('click', () => { window.location.href = `algs.html?event=${event}&type=${type}`; });
if (homeBtn) homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });

// --- HYBRID STACKMAT INTEGRATION ---
let stackmatEnabled = false;
const inputBtn = document.getElementById('input-mode-btn');

if (inputBtn) {
    inputBtn.addEventListener('click', async () => {
        if (!stackmatEnabled) {
            try {
                await decoder.start((data) => {

                    if (data.state === 'running' && !isRunning) {
                        startTimer();

                    } else if (data.state === 'stopped' && isRunning) {
                        clearInterval(timerInterval);

                        // FIX: Convert exact hardware milliseconds to pure seconds (e.g., 12340 -> "12.34").
                        // This removes the "0:" format entirely and feeds a clean decimal to your history so parseFloat doesn't break!
                        const hardwareSeconds = (data.timeMs / 1000).toFixed(2);
                        timerDisplay.textContent = hardwareSeconds;

                        stopTimer();

                    } else if (data.state === 'stopped' && data.timeMs === 0 && !isRunning) {
                        timerDisplay.textContent = "0.00";
                    }
                });

                stackmatEnabled = true;
                inputBtn.textContent = '⏱️';
                inputBtn.style.background = '#4CAF50';

            } catch (err) {
                alert("Microphone access denied or not found.");
            }
        } else {
            decoder.stop();
            stackmatEnabled = false;
            inputBtn.textContent = '⌨️';
            inputBtn.style.background = '#444';
        }
    });
}

setupFilters();
renderHistory();
loadAlgs();