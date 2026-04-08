import { allAlgorithms as localAlgs } from './algs.js';
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_DBD5S1sv7FGv_K6F7tUWxYs-JG3Jw-8",
  authDomain: "algdrill.firebaseapp.com",
  projectId: "algdrill",
  storageBucket: "algdrill.firebasestorage.app",
  messagingSenderId: "612013160",
  appId: "1:612013160:web:d664a05d36f71cf2c0d7dd"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const urlParams = new URLSearchParams(window.location.search);
const event = urlParams.get('event') || '3x3';
const type = urlParams.get('type') || 'PLL';

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
let spaceHeld = false;
let algsForScramble = [];

async function initTimer() {
  try {
    const docRef = doc(db, "global_algs", `${event}_${type}`);
    const docSnap = await getDoc(docRef);
    algsForScramble = docSnap.exists() ? docSnap.data().algs : (localAlgs[event]?.[type] || []);
  } catch (e) {
    algsForScramble = localAlgs[event]?.[type] || [];
  }
  setScramble();
  renderHistory();
}

function saveTimesLocallyAndToCloud() {
  const storageKey = `${event}_${type}_times`;
  localStorage.setItem(storageKey, JSON.stringify(solves));
  if (window.syncSolvesToFirebase) window.syncSolvesToFirebase(storageKey, solves);
}

window.reloadSolvesFromStorage = function() {
  solves = JSON.parse(localStorage.getItem(`${event}_${type}_times`) || '[]');
  renderHistory();
};

function generateScramble() {
  const moves = ["R", "L", "U", "D", "F", "B"];
  const modifiers = ["", "'", "2"];
  let scramble = [];
  let lastMove = "";
  while (scramble.length < 20) {
    let move = moves[Math.floor(Math.random() * moves.length)];
    if (move === lastMove) continue;
    lastMove = move;
    scramble.push(move + modifiers[Math.floor(Math.random() * modifiers.length)]);
  }
  return scramble.join(" ");
}

function reverseAlg(alg) {
  return alg.split(' ').reverse().map(move => {
    if (move.endsWith("'")) return move.slice(0, -1);
    else if (move.endsWith("2")) return move;
    else return move + "'";
  }).join(' ');
}

function setScramble() {
  const FILTER_STORAGE_KEY = `${event}_${type}_filters`;
  const filterStatuses = new Set(JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '["not learnt", "learning", "complete"]'));
  const savedStatuses = JSON.parse(localStorage.getItem('savedStatuses') || '{}');

  const filteredAlgs = algsForScramble.filter(alg => {
    const statusKey = `${event}_${type}_${alg.name}`;
    const status = savedStatuses[statusKey] || 'not learnt';
    return filterStatuses.has(status);
  });

  if (filteredAlgs.length === 0) {
    currentScramble = generateScramble();
  } else {
    const randomAlg = filteredAlgs[Math.floor(Math.random() * filteredAlgs.length)];
    currentScramble = randomAlg.scramble || reverseAlg(randomAlg.alg);
  }
  scrambleDiv.textContent = currentScramble;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  }
  return `${seconds}.${String(centiseconds).padStart(2, '0')}`;
}

function startTimer() {
  startTime = Date.now();
  isRunning = true;
  if (startStopBtn) startStopBtn.textContent = 'Stop';
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    if (timerDisplay) timerDisplay.textContent = formatTime(elapsed);
  }, 10);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  const elapsed = Date.now() - startTime;
  if (timerDisplay) timerDisplay.textContent = formatTime(elapsed);
  if (startStopBtn) startStopBtn.textContent = 'Start';

  solves.unshift({ time: elapsed, scramble: currentScramble, date: new Date().toISOString() });
  saveTimesLocallyAndToCloud();
  renderHistory();
  setScramble();
}

function renderHistory() {
  if (!historyList) return;
  historyList.innerHTML = '';

  if (solves.length === 0) {
    historyList.innerHTML = '<li style="opacity:0.5;">No solves yet.</li>';
    if (averageTimeDiv) averageTimeDiv.textContent = '';
    return;
  }

  solves.forEach((solve, index) => {
    const li = document.createElement('li');
    const timeStr = formatTime(solve.time);
    const dateStr = solve.date ? new Date(solve.date).toLocaleString() : '';
    li.innerHTML = `
      <span class="solve-number">${solves.length - index}.</span>
      <span class="solve-time">${timeStr}</span>
      <span class="solve-date">${dateStr}</span>
      <button class="delete-solve" data-index="${index}">✕</button>
    `;
    historyList.appendChild(li);
  });

  historyList.querySelectorAll('.delete-solve').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = parseInt(e.target.dataset.index);
      solves.splice(i, 1);
      saveTimesLocallyAndToCloud();
      renderHistory();
    });
  });

  if (averageTimeDiv) {
    const avg = solves.reduce((sum, s) => sum + s.time, 0) / solves.length;
    averageTimeDiv.textContent = `Avg: ${formatTime(Math.round(avg))}`;
  }
}

if (startStopBtn) {
  startStopBtn.addEventListener('click', () => {
    if (isRunning) stopTimer(); else startTimer();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !spaceHeld) {
    e.preventDefault();
    spaceHeld = true;
    if (isRunning) stopTimer(); else startTimer();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    spaceHeld = false;
  }
});

if (deleteAllBtn) {
  deleteAllBtn.addEventListener('click', () => {
    if (confirm('Delete all solves?')) {
      solves = [];
      saveTimesLocallyAndToCloud();
      renderHistory();
    }
  });
}

if (toAlgsBtn) {
  toAlgsBtn.addEventListener('click', () => {
    window.location.href = `algs.html?event=${event}&type=${type}`;
  });
}

if (homeBtn) {
  homeBtn.addEventListener('click', () => {
    window.location.href = 'home.html';
  });
}

if (filtersDiv) {
  const FILTER_STORAGE_KEY = `${event}_${type}_filters`;
  const allStatuses = ['not learnt', 'learning', 'complete'];
  let activeFilters = new Set(JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || JSON.stringify(allStatuses)));

  allStatuses.forEach(status => {
    const btn = document.createElement('button');
    btn.textContent = status;
    btn.classList.add('filter-btn');
    if (activeFilters.has(status)) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (activeFilters.has(status)) {
        activeFilters.delete(status);
        btn.classList.remove('active');
      } else {
        activeFilters.add(status);
        btn.classList.add('active');
      }
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify([...activeFilters]));
      setScramble();
    });
    filtersDiv.appendChild(btn);
  });
}

initTimer();
