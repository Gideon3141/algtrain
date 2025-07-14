import { allAlgorithms } from './algs.js';

const STORAGE_KEY = 'userCustomAlts';
const STATUS_STORAGE_KEY = 'algStatuses';
const urlParams = new URLSearchParams(window.location.search);
const event = urlParams.get('event') || '3x3';
const type = urlParams.get('type') || 'PLL';

const algListDiv = document.getElementById('alg-list');
const filtersDiv = document.querySelector('.filters');
const toTimerBtn = document.getElementById('to-timer');
const toAlgsBtn = document.getElementById('to-algs');
const homeBtn = document.getElementById('home-button');

// Load algorithms and apply saved statuses
const algs = allAlgorithms[event]?.[type] || [];
const savedStatuses = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');

// Apply saved statuses to algorithms
algs.forEach(alg => {
  const statusKey = `${event}_${type}_${alg.name}`;
  if (savedStatuses[statusKey]) {
    alg.status = savedStatuses[statusKey];
  }
});

const FILTER_STORAGE_KEY = `${event}_${type}_filters`;
let filterStatuses = new Set(JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '["not learnt", "learning", "complete"]'));

let userCustomAlts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

function saveUserCustomAlts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userCustomAlts));
}

function saveAlgStatus(algName, status) {
  const savedStatuses = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');
  const statusKey = `${event}_${type}_${algName}`;
  savedStatuses[statusKey] = status;
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(savedStatuses));
  console.log(`Saved status for ${algName}:`, status);
}

function renderAlgs() {
  algListDiv.innerHTML = '';
  
  // Show all algorithms regardless of filter settings
  algs.forEach(alg => {
    const card = document.createElement('div');
    card.className = 'alg-card';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'alg-name';

    const statusCircle = document.createElement('span');
    statusCircle.className = 'status-indicator';

    if (alg.status === 'not learnt') statusCircle.classList.add('status-blank');
    else if (alg.status === 'learning') statusCircle.classList.add('status-learning');
    else if (alg.status === 'complete') statusCircle.classList.add('status-learned');
    statusCircle.style.cursor = 'pointer';
    statusCircle.title = 'Click to change status';
    statusCircle.addEventListener('click', () => {
      if (alg.status === 'not learnt') alg.status = 'learning';
      else if (alg.status === 'learning') alg.status = 'complete';
      else alg.status = 'not learnt';
      
      // Save the status change to localStorage
      saveAlgStatus(alg.name, alg.status);
      renderAlgs();
    });

    nameDiv.textContent = alg.name;
    nameDiv.prepend(statusCircle);
    card.appendChild(nameDiv);

    const mainAlg = document.createElement('div');
    mainAlg.textContent = alg.alg;
    card.appendChild(mainAlg);

    if (alg.image) {
      const img = document.createElement('img');
      img.src = alg.image;
      img.alt = alg.name;
      img.className = 'alg-preview';
      card.appendChild(img);
    }

    const hasDefaultAlts = alg.alternates && alg.alternates.length > 0;
    const hasUserAlts = userCustomAlts[alg.name] && userCustomAlts[alg.name].length > 0;

    if (hasDefaultAlts || hasUserAlts) {
      const toggle = document.createElement('div');
      toggle.className = 'toggle-arrow';
      toggle.textContent = '▶ Show alternates';
      toggle.style.userSelect = 'none';

      const altList = document.createElement('div');
      altList.style.display = 'none';
      altList.style.marginTop = '8px';

      if (hasDefaultAlts) {
        alg.alternates.forEach(alt => {
          const altDiv = document.createElement('div');
          altDiv.textContent = alt;
          altDiv.style.border = '1px solid #555';
          altDiv.style.borderRadius = '10px';
          altDiv.style.padding = '5px 8px';
          altDiv.style.marginBottom = '5px';
          altDiv.style.backgroundColor = '#2a2a2a';
          altDiv.style.color = '#fff';
          altList.appendChild(altDiv);
        });
      }

      if (hasUserAlts) {
        userCustomAlts[alg.name].forEach((alt, index) => {
          const userAltDiv = document.createElement('div');
          userAltDiv.style.border = '1px solid #555';
          userAltDiv.style.borderRadius = '10px';
          userAltDiv.style.padding = '5px 8px';
          userAltDiv.style.marginBottom = '5px';
          userAltDiv.style.backgroundColor = '#2a2a2a';
          userAltDiv.style.color = '#fff';
          userAltDiv.style.display = 'flex';
          userAltDiv.style.justifyContent = 'space-between';
          userAltDiv.style.alignItems = 'center';

          const altText = document.createElement('span');
          altText.textContent = alt;
          userAltDiv.appendChild(altText);

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

          deleteBtn.addEventListener('click', () => {
            userCustomAlts[alg.name].splice(index, 1);
            if (userCustomAlts[alg.name].length === 0) {
              delete userCustomAlts[alg.name];
            }
            saveUserCustomAlts();
            renderAlgs();
          });

          userAltDiv.appendChild(deleteBtn);
          altList.appendChild(userAltDiv);
        });
      }

      toggle.addEventListener('click', () => {
        if (altList.style.display === 'none') {
          altList.style.display = 'block';
          toggle.textContent = '▼ Hide alternates';
        } else {
          altList.style.display = 'none';
          toggle.textContent = '▶ Show alternates';
        }
      });

      card.appendChild(toggle);
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
    addAltBtn.title = 'Add custom alternate';
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
      newAltInput.value = '';
      renderAlgs();
    });

    addAltDiv.appendChild(newAltInput);
    addAltDiv.appendChild(addAltBtn);
    card.appendChild(addAltDiv);

    algListDiv.appendChild(card);
  });
}

function setupFilters() {
  const checkboxes = filtersDiv.querySelectorAll('input[type=checkbox]');
  console.log('Setting up filters, found checkboxes:', checkboxes.length);
  console.log('Current filterStatuses:', Array.from(filterStatuses));
  
  checkboxes.forEach(cb => {
    // Restore checkbox state from localStorage
    cb.checked = filterStatuses.has(cb.value);
    console.log(`Checkbox ${cb.value} set to:`, cb.checked);
    
    cb.addEventListener('change', () => {
      // Update filterStatuses
      filterStatuses = new Set(
        Array.from(filtersDiv.querySelectorAll('input[type=checkbox]:checked')).map(
          el => el.value
        )
      );
      
      // Save to localStorage
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(Array.from(filterStatuses)));
      console.log('Saved filters to localStorage:', Array.from(filterStatuses));
      
      renderAlgs();
    });
  });
}

// Initialize everything when DOM is ready
function initializeApp() {
  console.log('Initializing app...');
  setupFilters();
  renderAlgs();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

toTimerBtn.addEventListener('click', () => {
  window.location.href = `timer.html?event=${event}&type=${type}`;
});

toAlgsBtn.disabled = true;

if (homeBtn) {
  homeBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}