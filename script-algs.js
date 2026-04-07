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

const algs = allAlgorithms[event]?.[type] || [];
const savedStatuses = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');

algs.forEach(alg => {
  const statusKey = `${event}_${type}_${alg.name}`;
  if (savedStatuses[statusKey]) {
    alg.status = savedStatuses[statusKey];
  }
});

const FILTER_STORAGE_KEY = `${event}_${type}_filters`;
let filterStatuses = new Set(JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '["not learnt", "learning", "complete"]'));

let userCustomAlts = JSON.parse(localStorage.getItem(STORAGE_KEY) || {});

function saveUserCustomAlts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userCustomAlts));
}

function saveAlgStatus(algName, status) {
  const savedStatuses = JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY) || '{}');
  const statusKey = `${event}_${type}_${algName}`;
  savedStatuses[statusKey] = status;
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(savedStatuses));
}

function renderAlgs() {
  algListDiv.innerHTML = '';

  algs.forEach(alg => {
    if (!filterStatuses.has(alg.status)) return;

    const card = document.createElement('div');
    card.className = 'alg-card';

    // --- Name and status ---
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
      saveAlgStatus(alg.name, alg.status);
      renderAlgs();
    });

    nameDiv.textContent = alg.name;
    nameDiv.prepend(statusCircle);
    card.appendChild(nameDiv);

    // --- Main algorithm display ---
    const mainAlg = document.createElement('div');
    mainAlg.textContent = alg.alg;
    mainAlg.style.marginTop = '8px';
    card.appendChild(mainAlg);

    // --- Image ---
    if (alg.image && type !== 'OLL') {
      const img = document.createElement('img');
      img.src = alg.image;
      img.alt = alg.name;
      img.className = 'alg-preview';
      card.appendChild(img);
    }

    // --- Collapsible dropdown for custom alternates only ---
    const customAlts = userCustomAlts[alg.name] ? [...userCustomAlts[alg.name]] : [];

    if (customAlts.length > 0) {
      const dropdownToggle = document.createElement('button');
      dropdownToggle.textContent = '▶ Show alternates';
      dropdownToggle.style.marginTop = '8px';
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

      function renderAltList() {
        altList.innerHTML = '';
        customAlts.forEach((alt, index) => {
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
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            customAlts.splice(index, 1);
            userCustomAlts[alg.name] = customAlts.length > 0 ? customAlts : undefined;
            saveUserCustomAlts();
            renderAltList();
          });
          altRow.appendChild(deleteBtn);

          altRow.addEventListener('click', () => {
            // Swap clicked alternate with default
            const oldDefault = mainAlg.textContent;
            mainAlg.textContent = alt;
            customAlts[index] = oldDefault;
            userCustomAlts[alg.name] = customAlts;
            saveUserCustomAlts();
            renderAltList();
          });

          altList.appendChild(altRow);
        });
      }

      renderAltList();
      card.appendChild(altList);

      dropdownToggle.addEventListener('click', () => {
        if (altList.style.display === 'none') {
          altList.style.display = 'flex';
          dropdownToggle.textContent = '▼ Hide alternates';
        } else {
          altList.style.display = 'none';
          dropdownToggle.textContent = '▶ Show alternates';
        }
      });
    }

    // --- Add new custom alternate ---
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
  checkboxes.forEach(cb => {
    cb.checked = filterStatuses.has(cb.value);
    cb.addEventListener('change', () => {
      filterStatuses = new Set(
        Array.from(filtersDiv.querySelectorAll('input[type=checkbox]:checked')).map(el => el.value)
      );
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(Array.from(filterStatuses)));
      renderAlgs();
    });
  });
}

function initializeApp() {
  setupFilters();
  renderAlgs();
}

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
