// script-type.js
const urlParams = new URLSearchParams(window.location.search);
const eventSelected = urlParams.get("event");

const typeButtonsDiv = document.getElementById("buttons");
const backBtn = document.getElementById("backBtn");

// Define types for each event here:
const typesByEvent = {
  "3x3": ["OLL", "PLL", "Other"],
  "2x2": ["Algorithms", "Other"],
  "megaminx": ["Algorithms", "Other"],
  // Add more events and their types as needed
};

function createTypeButtons() {
  const types = typesByEvent[eventSelected] || [];
  types.forEach(type => {
    const btn = document.createElement("button");
    btn.textContent = type;
    btn.addEventListener("click", () => {
      // Go to algs.html with event and type params
      window.location.href = `algs.html?event=${encodeURIComponent(eventSelected)}&type=${encodeURIComponent(type)}`;
    });
    typeButtonsDiv.appendChild(btn);
  });
}

backBtn.addEventListener("click", () => {
  window.location.href = "category.html";
});

createTypeButtons();