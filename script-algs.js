import { allAlgorithms as localAlgs } from './algs.js';
import { initializeApp as initFirebase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// NEW: Import Google Analytics
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyA_DBD5S1sv7FGv_K6F7tUWxYs-JG3Jw-8",
  authDomain: "algdrill.firebaseapp.com",
  projectId: "algdrill",
  storageBucket: "algdrill.firebasestorage.app",
  messagingSenderId: "612013160",
  appId: "1:612013160:web:d664a05d36f71cf2c0d7dd"
};

const app = initFirebase(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// NEW: Turn on Google Analytics
const analytics = getAnalytics(app);

const STORAGE_KEY = 'userCustomAlts';
const STATUS_STORAGE_KEY = 'algStatuses';
const urlParams = new URLSearchParams(window.location.search);
const event = urlParams.get('event') || '3x3';
const type = urlParams.get('type') || 'PLL';
const FILTER_STORAGE_KEY = `${event}_${type}_filters`;

(function clearCorruptedStorage() {
  const keys = [FILTER_STORAGE_KEY, STORAGE_KEY, STATUS_STORAGE_KEY];
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data === "[object Object]" || data === "undefined") {
      localStorage.removeItem(key);
    }
  });
})();

const algListDiv = document.getElementById('alg-list');
const filtersDiv = document.querySelector('.filters');
const toTimerBtn = document.getElementById('to-timer');
const homeBtn = document.getElementById('home-button');

// Modal and Auth Elements
const openAuthModalBtn = document.getElementById('openAuthModalBtn');
const accountBtn = document.getElementById('accountBtn');

const authModal = document.getElementById('authModal');
const accountModal = document.getElementById('accountModal');
const modalOverlay = document.getElementById('modalOverlay');

const closeModalBtn = document.getElementById('closeModalBtn');
const closeAccountModalBtn = document.getElementById('closeAccountModalBtn');
const modalSignOutBtn = document.getElementById('modalSignOutBtn');
const accNameDisplay = document.getElementById('accNameDisplay');
const accEmailDisplay = document.getElementById('accEmailDisplay');
const authErrorMsg = document.getElementById('authErrorMsg');

let algs = []; 
let currentUser = null;

function getInitialFilters() {
  const raw = localStorage.getItem(FILTER_STORAGE_KEY);
  try {
    if (!raw) return new Set(["not learnt", "learning", "complete"]);
    const parsed = JSON.parse(raw);
    if (parsed.length === 0) return new Set(["not learnt", "learning", "complete"]);
    return new Set(parsed);
  } catch (e) {
    return new Set(["not learnt", "learning", "complete"]);
  }
}

let filterStatuses = getInitialFilters();
let userCustomAlts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

async function startApp() {
  try {
    const docRef = doc(db, "global_algs", `${event}_${type}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) algs = docSnap.data().algs;
    else algs = localAlgs[event]?.[type] || [];
  } catch (e) { algs = localAlgs[event]?.[type] || []; }

  algs.forEach(alg => {
    alg.headerAlg = localStorage.getItem(`pref_${event}_${type}_${alg.name}`) || alg.alg; 
  });

  const savedStatuses = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');
  algs.forEach(alg => {
    alg.status = savedStatuses[`${event}_${type}_${alg.name}`] || 'not learnt';
  });

  setupFilters(); 
  renderAlgs(); 
}

function saveUserCustomAlts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userCustomAlts));
}

async function saveAlgStatus(algName, status) {
  const statusKey = `${event}_${type}_${algName}`;
  const savedStatuses = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');
  savedStatuses[statusKey] = status;
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(savedStatuses));

  if (currentUser) {
    const userRef = doc(db, "users", currentUser.uid);
    try { await updateDoc(userRef, { statuses: savedStatuses }); }
    catch (e) { await setDoc(userRef, { statuses: savedStatuses }, { merge: true }); }
  }
}

function renderAlgs() {
  if (!algListDiv) return;
  algListDiv.innerHTML = '';

  // Grab all solves for this event so we can calculate stats
  const allSolves = JSON.parse(localStorage.getItem(`${event}_${type}_times`) || '[]');

  algs.forEach(alg => {
    if (!filterStatuses.has(alg.status)) return;

    const card = document.createElement('div');
    card.className = 'alg-card';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'alg-name';
    const statusCircle = document.createElement('span');
    statusCircle.className = `status-indicator ${alg.status === 'not learnt' ? 'status-blank' : alg.status === 'learning' ? 'status-learning' : 'status-learned'}`;
    statusCircle.style.cursor = 'pointer';
    statusCircle.addEventListener('click', async () => {
      alg.status = alg.status === 'not learnt' ? 'learning' : alg.status === 'learning' ? 'complete' : 'not learnt';
      await saveAlgStatus(alg.name, alg.status);
      renderAlgs();
    });
    nameDiv.textContent = alg.name;
    nameDiv.prepend(statusCircle);
    card.appendChild(nameDiv);

    const mainAlg = document.createElement('div');
    mainAlg.textContent = alg.headerAlg; 
    mainAlg.style.marginTop = '8px';
    mainAlg.style.fontWeight = 'bold';
    card.appendChild(mainAlg);

    // --- NEW: THE IMAGE & STATS CONTAINER ---
    const imgAndStatsDiv = document.createElement('div');
    imgAndStatsDiv.style.display = 'flex';
    imgAndStatsDiv.style.justifyContent = 'space-between';
    imgAndStatsDiv.style.alignItems = 'flex-start';
    imgAndStatsDiv.style.marginTop = '15px';

    // 1. The Image "Blob"
    if (alg.image) {
      const img = document.createElement('img');
      img.src = alg.image;
      img.className = 'alg-preview';
      img.style.maxWidth = '100px';
      imgAndStatsDiv.appendChild(img);
    } else {
      // Empty div so the stats still get pushed to the right
      imgAndStatsDiv.appendChild(document.createElement('div'));
    }

    // 2. Calculate Math for the Stats
    const algSolves = allSolves.filter(s => s.algName === alg.name);
    let bestTime = "--";
    let avgTime = "--";

    if (algSolves.length > 0) {
      const timesArray = algSolves.map(s => parseFloat(s.time));
      bestTime = Math.min(...timesArray).toFixed(2);
      avgTime = (timesArray.reduce((sum, t) => sum + t, 0) / timesArray.length).toFixed(2);
    }

    // 3. The Stats UI Box
    const statsBox = document.createElement('div');
    statsBox.style.textAlign = 'right';
    statsBox.style.backgroundColor = '#1e1e1e';
    statsBox.style.padding = '8px 12px';
    statsBox.style.borderRadius = '8px';
    statsBox.style.border = '1px solid #333';
    statsBox.innerHTML = `
      <div style="font-size: 0.75rem; color: #888; text-transform: uppercase; margin-bottom: 6px; font-weight: bold; letter-spacing: 1px;">Records</div>
      <div style="font-size: 1.1rem; margin-bottom: 4px;">
        <span style="color: #aaa; font-size: 0.9rem; margin-right: 5px;">Best:</span> 
        <span style="color: #4CAF50; font-weight: bold; font-family: monospace; font-size: 1.15rem;">${bestTime !== '--' ? bestTime + 's' : '--'}</span>
      </div>
      <div style="font-size: 1.1rem;">
        <span style="color: #aaa; font-size: 0.9rem; margin-right: 5px;">Avg:</span> 
        <span style="color: #2196F3; font-weight: bold; font-family: monospace; font-size: 1.15rem;">${avgTime !== '--' ? avgTime + 's' : '--'}</span>
      </div>
    `;
    imgAndStatsDiv.appendChild(statsBox);

    // Add the combined row to the card
    card.appendChild(imgAndStatsDiv);
    // --- END NEW STATS CONTAINER ---


    const globalAlts = alg.alternates || [];
    const personalAlts = userCustomAlts[alg.name] || [];
    const potentialAlts = [...new Set([alg.alg, ...globalAlts, ...personalAlts])];
    let currentAlts = potentialAlts.filter(a => a !== alg.headerAlg);

    if (currentAlts.length > 0) {
      const dropdownToggle = document.createElement('button');
      dropdownToggle.textContent = '▶ Show alternates';
      dropdownToggle.style.marginTop = '15px';
      dropdownToggle.style.padding = '4px 8px';
      dropdownToggle.style.border = 'none';
      dropdownToggle.style.borderRadius = '6px';
      dropdownToggle.style.backgroundColor = '#444';
      dropdownToggle.style.color = '#fff';
      dropdownToggle.style.cursor = 'pointer';
      card.appendChild(dropdownToggle);

      const altList = document.createElement('div');
      altList.style.display = 'none';
      altList.style.flexDirection = 'column';
      altList.style.marginTop = '5px';
      altList.style.gap = '5px';

      currentAlts.forEach((alt) => {
        const altRow = document.createElement('div');
        altRow.style.display = 'flex';
        altRow.style.justifyContent = 'space-between';
        altRow.style.alignItems = 'center';
        altRow.style.backgroundColor = '#2a2a2a';
        altRow.style.color = '#fff';
        altRow.style.border = '1px solid #555';
        altRow.style.borderRadius = '10px';
        altRow.style.padding = '5px 8px';
        altRow.style.cursor = 'pointer';

        const altText = document.createElement('span');
        altText.textContent = alt;
        altRow.appendChild(altText);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style.background = 'transparent';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = '#f55';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '1.2rem';
        deleteBtn.style.lineHeight = '1';
        deleteBtn.style.padding = '0 6px';

        if (personalAlts.includes(alt)) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userCustomAlts[alg.name] = personalAlts.filter(a => a !== alt);
            saveUserCustomAlts();
            renderAlgs();
          });
          altRow.appendChild(deleteBtn);
        }

        altRow.addEventListener('click', () => {
          localStorage.setItem(`pref_${event}_${type}_${alg.name}`, alt);
          alg.headerAlg = alt; 
          renderAlgs(); 
        });
        altList.appendChild(altRow);
      });

      dropdownToggle.addEventListener('click', () => {
        const isHidden = altList.style.display === 'none';
        altList.style.display = isHidden ? 'flex' : 'none';
        dropdownToggle.textContent = isHidden ? '▼ Hide alternates' : '▶ Show alternates';
      });
      card.appendChild(altList);
    }

    const addAltDiv = document.createElement('div');
    addAltDiv.style.marginTop = '10px';
    addAltDiv.style.display = 'flex';
    addAltDiv.style.gap = '10px';
    addAltDiv.style.alignItems = 'center';

    const newAltInput = document.createElement('input');
    newAltInput.type = 'text';
    newAltInput.placeholder = 'Add custom alternate algorithm';
    newAltInput.style.flexGrow = '1';
    newAltInput.style.padding = '6px 8px';
    newAltInput.style.borderRadius = '8px';
    newAltInput.style.border = '1px solid #555';
    newAltInput.style.backgroundColor = '#1e1e1e';
    newAltInput.style.color = '#fff';

    const addAltBtn = document.createElement('button');
    addAltBtn.textContent = '+';
    addAltBtn.style.padding = '6px 12px';
    addAltBtn.style.borderRadius = '8px';
    addAltBtn.style.border = 'none';
    addAltBtn.style.cursor = 'pointer';
    addAltBtn.style.backgroundColor = '#4caf50';
    addAltBtn.style.color = 'white';
    addAltBtn.style.fontWeight = 'bold';

    addAltBtn.addEventListener('click', () => {
      const val = newAltInput.value.trim();
      if (!val) return alert('Please enter an algorithm.');
      if (!userCustomAlts[alg.name]) userCustomAlts[alg.name] = [];
      userCustomAlts[alg.name].push(val);
      saveUserCustomAlts();
      localStorage.setItem(`pref_${event}_${type}_${alg.name}`, val);
      alg.headerAlg = val; 
      renderAlgs();
    });

    addAltDiv.appendChild(newAltInput);
    addAltDiv.appendChild(addAltBtn);
    card.appendChild(addAltDiv);

    algListDiv.appendChild(card);
  });
}

function setupFilters() {
  if (!filtersDiv) return;
  const checkboxes = filtersDiv.querySelectorAll('input[type=checkbox]');
  checkboxes.forEach(cb => {
    cb.checked = filterStatuses.has(cb.value);
    cb.addEventListener('change', () => {
      filterStatuses = new Set(Array.from(filtersDiv.querySelectorAll('input[type=checkbox]:checked')).map(el => el.value));
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(Array.from(filterStatuses)));
      renderAlgs();
    });
  });
}

function closeModal() { authModal.style.display = 'none'; modalOverlay.style.display = 'none'; }
function closeAccountModal() { accountModal.style.display = 'none'; modalOverlay.style.display = 'none'; }

if (openAuthModalBtn) {
  openAuthModalBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
    modalOverlay.style.display = 'block';
    authErrorMsg.textContent = '';
  });
}

if (accountBtn) {
  accountBtn.addEventListener('click', () => {
    accountModal.style.display = 'flex';
    modalOverlay.style.display = 'block';
    if (auth.currentUser) {
      accNameDisplay.textContent = auth.currentUser.displayName || "Not set";
      accEmailDisplay.textContent = auth.currentUser.email || "N/A";
    }
  });
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (closeAccountModalBtn) closeAccountModalBtn.addEventListener('click', closeAccountModal);

if (modalOverlay) {
  modalOverlay.addEventListener('click', () => {
    closeModal();
    closeAccountModal();
  });
}

if (modalSignOutBtn) {
  modalSignOutBtn.addEventListener('click', () => {
    signOut(auth);
    closeAccountModal();
  });
}

document.getElementById('googleSignIn').addEventListener('click', async () => { try { await signInWithPopup(auth, provider); closeModal(); } catch (e) { authErrorMsg.textContent = e.message; } });
document.getElementById('emailSignInBtn').addEventListener('click', async () => { try { await signInWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passwordInput').value); closeModal(); } catch (e) { authErrorMsg.textContent = e.message.replace('Firebase: ', ''); } });
document.getElementById('emailSignUpBtn').addEventListener('click', async () => { try { await createUserWithEmailAndPassword(auth, document.getElementById('emailInput').value, document.getElementById('passwordInput').value); closeModal(); } catch (e) { authErrorMsg.textContent = e.message.replace('Firebase: ', ''); } });

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    if (openAuthModalBtn) openAuthModalBtn.style.display = 'none';
    if (accountBtn) accountBtn.style.display = 'inline-block';

    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists() && docSnap.data().statuses) {
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(docSnap.data().statuses));
      const saved = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY));
      algs.forEach(a => a.status = saved[`${event}_${type}_${a.name}`] || 'not learnt');
      renderAlgs(); 
    }
  } else {
    if (openAuthModalBtn) openAuthModalBtn.style.display = 'inline-block';
    if (accountBtn) accountBtn.style.display = 'none';
  }
});

if (toTimerBtn) toTimerBtn.addEventListener('click', () => { window.location.href = `timer.html?event=${event}&type=${type}`; });
if (homeBtn) homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });

startApp();