import { allAlgorithms } from './algs.js';

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

let isRunning = false;
let startTime = null;
let timerInterval;
let solves = JSON.parse(localStorage.getItem(`${event}_${type}_times`) || '[]');
let currentScramble = '';
let spaceHeld = false;

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

function setScramble() {
  currentScramble = generateScramble();
  scrambleDiv.textContent = currentScramble;
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
  const finalTime = ((performance.now() - startTime) / 1000).toFixed(2);

  const scramble = currentScramble;
  const alg = allAlgorithms[event]?.[type]?.find(a => scramble.includes(a.name)) || null;

  solves.unshift({
    time: finalTime,
    scramble,
    alg: alg ? alg.alg : "",
    name: alg ? alg.name : "",
    image: alg ? alg.image : ""
  });

  localStorage.setItem(`${event}_${type}_times`, JSON.stringify(solves));
  renderHistory();
  setScramble();
  startStopBtn.textContent = "Start";
}

startStopBtn.addEventListener('mousedown', () => {
  startStopBtn.style.backgroundColor = '#2f4';
});

startStopBtn.addEventListener('mouseup', () => {
  startStopBtn.style.backgroundColor = '';
  if (isRunning) stopTimer();
  else startTimer();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (!spaceHeld) {
      spaceHeld = true;
      timerDisplay.style.color = 'limegreen';
    }
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    if (!isRunning) {
      startTimer();
    } else {
      stopTimer();
    }
    spaceHeld = false;
    timerDisplay.style.color = '';
  }
});

deleteAllBtn.addEventListener('click', () => {
  if (confirm("Delete all recorded times?")) {
    solves = [];
    localStorage.removeItem(`${event}_${type}_times`);
    renderHistory();
  }
});

function deleteSolve(index) {
  solves.splice(index, 1);
  localStorage.setItem(`${event}_${type}_times`, JSON.stringify(solves));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';
  solves.forEach((solve, index) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const solveNumber = solves.length - index;
    const circle = document.createElement('span');
    circle.textContent = solveNumber;
    circle.style.display = 'inline-block';
    circle.style.width = '24px';
    circle.style.height = '24px';
    circle.style.borderRadius = '50%';
    circle.style.border = '2px solid white';
    circle.style.textAlign = 'center';
    circle.style.marginRight = '10px';
    circle.style.fontSize = '0.9rem';
    circle.style.lineHeight = '22px';

    item.appendChild(circle);
    item.append(` ${solve.time}s`);

    item.addEventListener('click', () => {
      showDetail(index);
    });

    historyList.appendChild(item);
  });

  historyList.scrollTop = 0;

  if (solves.length > 0) {
    const avg =
      solves.reduce((sum, s) => sum + parseFloat(s.time), 0) / solves.length;
    averageTimeDiv.textContent = `Average: ${avg.toFixed(2)}s`;
  } else {
    averageTimeDiv.textContent = 'Average: N/A';
  }
}

function showDetail(index) {
  const solve = solves[index];
  historyList.innerHTML = '';

  const detail = document.createElement('div');
  detail.className = 'history-item selected';

  const content = document.createElement('div');
  content.innerHTML = `
    <strong>${solve.name || 'Custom Solve'}</strong><br>
    <em>${solve.scramble}</em><br>
    ${solve.alg ? `<code>${solve.alg}</code><br>` : ''}
    ${solve.image ? `<img src="${solve.image}" class="alg-preview" />` : ''}
  `;
  detail.appendChild(content);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-time-btn';
  deleteBtn.innerHTML = '🗑️';
  deleteBtn.addEventListener('click', () => deleteSolve(index));
  detail.appendChild(deleteBtn);

  historyList.appendChild(detail);

  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back to History';
  backBtn.style.marginTop = '10px';
  backBtn.style.padding = '8px 12px';
  backBtn.style.borderRadius = '10px';
  backBtn.style.border = 'none';
  backBtn.style.cursor = 'pointer';
  backBtn.style.background = '#333';
  backBtn.style.color = 'white';

  backBtn.addEventListener('click', renderHistory);
  historyList.appendChild(backBtn);
}

toAlgsBtn.addEventListener('click', () => {
  window.location.href = `algs.html?event=${event}&type=${type}`;
});

homeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

setScramble();
renderHistory();