import { allAlgorithms } from './algs.js';

const STORAGE_KEY = 'userCustomAlts';
const urlParams = new URLSearchParams(window.location.search);
const event = urlParams.get('event') || '3x3';
const type = urlParams.get('type') || 'PLL';

const algListDiv = document.getElementById('alg-list');
const filtersDiv = document.querySelector('.filters');
const toTimerBtn = document.getElementById('to-timer');
const toAlgsBtn = document.getElementById('to-algs');
const homeBtn = document.getElementById('home-button');

const algs = allAlgorithms[event]?.[type] || [];
let filterStatuses = new Set(['not learnt', 'learning', 'complete']);
let userCustomAlts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

function saveUserCustomAlts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userCustomAlts));
}

function renderAlgs() {
  algListDiv.innerHTML = '';
  const filteredAlgs = algs.filter(alg => filterStatuses.has(alg.status));

  filteredAlgs.forEach(alg => {
    const card = document.createElement('div');
    card.className = 'alg-card';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'alg-name';
    const statusCircle = document.createElement('span');
    statusCircle.className = 'status-indicator';

    if (alg.status === 'not learnt') statusCircle.classList.add('status-blank');
    if (alg.status === 'learning') statusCircle.classList.add('status-learning');
    if (alg.status === 'complete') statusCircle.classList.add('status-learned');

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
    const hasUserAlts = userCustomAlts[alg.name]?.length > 0;

    if (hasDefaultAlts || hasUserAlts) {
      const toggle = document.createElement('div');
      toggle.className = 'toggle-arrow';
      toggle.textContent = '▶ Show alternates';

      const altList = document.createElement('div');
      altList.style.display = 'none';
      altList.style.marginTop = '8px';

      if (hasDefaultAlts) {
        alg.alternates.forEach(alt => {
          const altDiv = document.createElement('div');
          altDiv.textContent = alt;
          altDiv.className = 'alt-alg';
          altList.appendChild(altDiv);
        });
      }

      if (hasUserAlts) {
        userCustomAlts[alg.name].forEach((alt, index) => {
          const userAltDiv = document.createElement('div');
          userAltDiv.className = 'alt-alg user';

          const altText = document.createElement('span');
          altText.textContent = alt;
          userAltDiv.appendChild(altText);

          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = '×';
          deleteBtn.className = 'delete-alt-btn';
          deleteBtn.addEventListener('click', () => {
            userCustomAlts[alg.name].splice(index, 1);
            if (userCustomAlts[alg.name].length === 0) delete userCustomAlts[alg.name];
            saveUserCustomAlts();
            renderAlgs();
          });

          userAltDiv.appendChild(deleteBtn);
          altList.appendChild(userAltDiv);
        });
      }

      toggle.addEventListener('click', () => {
        altList.style.display = altList.style.display === 'none' ? 'block' : 'none';
        toggle.textContent = altList.style.display === 'none' ? '▶ Show alternates' : '▼ Hide alternates';
      });

      card.appendChild(toggle);
      card.appendChild(altList);
    }

    const addAltDiv = document.createElement('div');
    addAltDiv.className = 'add-alt-container';

    const newAltInput = document.createElement('input');
    newAltInput.type = 'text';
    newAltInput.placeholder = 'Add custom alternate algorithm';

    const addAltBtn = document.createElement('button');
    addAltBtn.textContent = '+';
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

filtersDiv.querySelectorAll('input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', () => {
    filterStatuses = new Set(
      Array.from(filtersDiv.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value)
    );
    renderAlgs();
  });
});

toTimerBtn.addEventListener('click', () => {
  window.location.href = `timer.html?event=${event}&type=${type}`;
});
toAlgsBtn.disabled = true;
homeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

renderAlgs();