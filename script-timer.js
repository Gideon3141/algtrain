import { allAlgorithms as localAlgs } from './algs.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_DBD5S1sv7FGv_K6F7tUWxYs-JG3Jw-8",
  authDomain: "algdrill.firebaseapp.com",
  projectId: "algdrill",
  storageBucket: "algdrill.firebasestorage.app",
  messagingSenderId: "612013160",
  appId: "1:612013160:web:d664a05d36f71cf2c0d7dd"
};

const app = initializeApp(firebaseConfig);
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

// ... Rest of your existing Start/Stop/Render functions here ...
// Just make sure you call initTimer() at the very bottom instead of just setScramble()
initTimer();
renderHistory();