import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const auth = getAuth(app);

const ADMIN_UID = "CqkQ8vpZtZXVgxrvRJsuxIwOgkq1"; // my ID yay
const algContainer = document.getElementById('alg-edit-list');
const eventSelect = document.getElementById('event-select');
const typeInput = document.getElementById('type-select'); 
const saveBtn = document.getElementById('save-all');
const addAlgBtn = document.getElementById('add-new-alg');

let currentAlgs = [];

//if ur reading this get off, you shouldn't be here, ur no admin
onAuthStateChanged(auth, (user) => {
    if (!user || user.uid !== ADMIN_UID) {
        alert("Admin access only.");
        window.location.href = "index.html";
    }
});

async function loadAlgs() {
    const event = eventSelect.value;
    const type = typeInput.value.trim();
    if (!type) return;

    const docRef = doc(db, "global_algs", `${event}_${type}`);
    const docSnap = await getDoc(docRef);

    currentAlgs = docSnap.exists() ? (docSnap.data().algs || []) : [];
    renderEditor();
}

function renderEditor() {
    algContainer.innerHTML = '';
    currentAlgs.forEach((alg, index) => {
        const card = document.createElement('div');
        card.style = "background:#222; padding:15px; margin:10px 0; border-radius:10px; border:1px solid #444;";
        card.innerHTML = `
            <h4>Alg #${index + 1}: ${alg.name || 'Unnamed'}</h4>
            Name: <input type="text" value="${alg.name || ''}" oninput="updateData(${index}, 'name', this.value)"><br>
            Alg: <input type="text" value="${alg.alg || ''}" oninput="updateData(${index}, 'alg', this.value)"><br>
            Alts: <input type="text" value="${(alg.alternates || []).join(',')}" oninput="updateData(${index}, 'alternates', this.value)" placeholder="comma separated"><br>
            Scrambles: <input type="text" value="${(alg.scrambles || []).join(',')}" oninput="updateData(${index}, 'scrambles', this.value)" placeholder="comma separated"><br>
            Image: <input type="text" value="${alg.image || ''}" oninput="updateData(${index}, 'image', this.value)"><br>
            <button style="color:red; margin-top:5px;" onclick="removeAlg(${index})">Remove</button>
        `;
        algContainer.appendChild(card);
    });
}

window.updateData = (index, field, value) => {
    if (field === 'alternates' || field === 'scrambles') {
        currentAlgs[index][field] = value.split(',').map(s => s.trim()).filter(s => s !== "");
    } else {
        currentAlgs[index][field] = value;
    }
};

window.removeAlg = (index) => {
    currentAlgs.splice(index, 1);
    renderEditor();
};

addAlgBtn.addEventListener('click', () => {
    currentAlgs.push({ name: "", alg: "", alternates: [], scrambles: [], image: "" });
    renderEditor();
});

saveBtn.addEventListener('click', async () => {
    const event = eventSelect.value;
    const type = typeInput.value.trim();
    if (!type) return alert("Enter a category name first!");

    await setDoc(doc(db, "global_algs", `${event}_${type}`), { algs: currentAlgs });
    alert("Saved successfully!");
});

typeInput.addEventListener('change', loadAlgs);
eventSelect.addEventListener('change', loadAlgs);