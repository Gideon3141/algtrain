import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const eventSelected = urlParams.get("event") || "3x3";

const typeButtonsDiv = document.getElementById("buttons");
const backBtn = document.getElementById("backBtn");

// Try to update a title if one exists on the page
const titleEl = document.querySelector('h1');
if (titleEl) {
    titleEl.textContent = `${eventSelected} Categories`;
}

async function createTypeButtons() {
  typeButtonsDiv.innerHTML = "<p style='color: #888;'>Loading categories...</p>";

  try {
    const querySnapshot = await getDocs(collection(db, "global_algs"));
    const types = new Set();

    // Find all files that start with our selected event (e.g., "4x4_PLL")
    querySnapshot.forEach((doc) => {
      const docId = doc.id; 
      const parts = docId.split('_');

      // If the first part matches "4x4", then the second part is the category ("PLL")
      if (parts.length > 1 && parts[0] === eventSelected) {
         const typeName = parts.slice(1).join('_'); // Handles categories with underscores just in case
         types.add(typeName);
      }
    });

    typeButtonsDiv.innerHTML = ""; // Clear loading text

    if (types.size === 0) {
       typeButtonsDiv.innerHTML = "<p style='color: #ccc;'>No categories found for this puzzle yet.</p>";
    }

    // Build the buttons
    types.forEach(type => {
      const btn = document.createElement("button");
      btn.textContent = type;
      // Typical button styles (you can adjust if you have CSS classes)
      btn.style.padding = "10px 20px";
      btn.style.margin = "5px";
      btn.style.borderRadius = "8px";
      btn.style.cursor = "pointer";
      btn.style.border = "none";
      btn.style.background = "#2196F3";
      btn.style.color = "white";
      btn.style.fontWeight = "bold";

      btn.addEventListener("click", () => {
        // Go to algs.html with the dynamic params!
        window.location.href = `algs.html?event=${encodeURIComponent(eventSelected)}&type=${encodeURIComponent(type)}`;
      });
      typeButtonsDiv.appendChild(btn);
    });

  } catch(e) {
    console.error("Error loading categories:", e);
    typeButtonsDiv.innerHTML = "<p style='color: #ff6b6b;'>Error loading data.</p>";
  }
}

backBtn.addEventListener("click", () => {
  window.location.href = "index.html"; // Send back to the new dynamic homepage
});

createTypeButtons();