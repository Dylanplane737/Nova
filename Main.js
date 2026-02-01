// --- Settings state ---
const settings = {
  darkMode: JSON.parse(localStorage.getItem("novaDarkMode")) || false,
  backgroundImage: localStorage.getItem("novaBackground") || null,
  fontSize: parseInt(localStorage.getItem("novaFontSize")) || 16,
  audioPreview: JSON.parse(localStorage.getItem("novaAudioPreview")) || false
};

// --- Settings menu ---
const settingsMenu = document.createElement("div");
settingsMenu.id = "settingsMenu";
settingsMenu.style.cssText = `
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 260px;
  background: rgba(0,0,0,0.85);
  color: white;
  padding: 14px;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  display: none;
  z-index: 1500;
  font-family: sans-serif;
  cursor: move;
`;

settingsMenu.innerHTML = `
<h3 style="margin-top:0">Settings!</h3>
<button id="collapseBtn" style="position:absolute;top:6px;right:6px;padding:2px 6px;font-size:12px;cursor:pointer;">▼</button>

<label><input type="checkbox" id="darkModeToggle"> Dark Mode</label><br>
<label>Font Size: <input type="number" id="fontSizeInput" min="10" max="48" value="16" style="width:50px"></label><br>
<label><input type="checkbox" id="audioPreviewToggle"> Audio Previews</label><br><br>

<hr style="border-color: rgba(255,255,255,0.3);">

<label>Background Image: <input type="file" id="bgUpload" accept="image/*"></label><br>
<button id="classicBlueBtn" style="margin-top:6px;padding:6px 10px;border:none;border-radius:6px;background:#0f75a8;color:white;cursor:pointer;">Classic Blue</button><br>

<div id="nova-translate-btn" style="display:block;cursor:pointer;margin-top:6px;padding:6px 8px;background:#4f7cff;color:white;border-radius:6px;text-align:center;">
  🌐 Nova Translate
</div>
`;

document.body.appendChild(settingsMenu);

// --- Required element refs ---
const collapseBtn = document.getElementById("collapseBtn");


document.getElementById("nova-translate-btn").addEventListener("click", () => {
  window.location.href = "NovaTranslate.html";
});

// --- Settings toggle button ---
const settingsBtn = document.createElement("button");
settingsBtn.id = "settingsBtn";
settingsBtn.textContent = "⚙️";
settingsBtn.style.cssText = `
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1500;
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  background: #0f75a8;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  transition: left 0.3s ease;
`;

document.body.appendChild(settingsBtn);

settingsBtn.addEventListener("click", () => {
  const isOpen = settingsMenu.style.display === "block";
  settingsMenu.style.display = isOpen ? "none" : "block";
  settingsBtn.style.left = isOpen ? "20px" : "300px";
});

// --- Draggable functionality ---
let isDragging = false, offsetX = 0, offsetY = 0;
settingsMenu.addEventListener("mousedown", (e) => {
  if (e.target === collapseBtn) return;
  isDragging = true;
  offsetX = e.clientX - settingsMenu.getBoundingClientRect().left;
  offsetY = e.clientY - settingsMenu.getBoundingClientRect().top;
  settingsMenu.style.transition = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  let x = e.clientX - offsetX;
  let y = e.clientY - offsetY;
  x = Math.max(0, Math.min(window.innerWidth - settingsMenu.offsetWidth, x));
  y = Math.max(0, Math.min(window.innerHeight - settingsMenu.offsetHeight, y));
  settingsMenu.style.left = x + "px";
  settingsMenu.style.top = y + "px";
  settingsMenu.style.bottom = "auto";
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    settingsMenu.style.transition = "transform 0.10s ease";
  }
});

// --- Get elements ---
const darkModeToggle = document.getElementById("darkModeToggle");
const bgUpload = document.getElementById("bgUpload");
const classicBlueBtn = document.getElementById("classicBlueBtn");
const fontSizeInput = document.getElementById("fontSizeInput");
const audioPreviewToggle = document.getElementById("audioPreviewToggle");

// --- Event listeners ---
darkModeToggle.addEventListener("change", (e) => {
  settings.darkMode = e.target.checked;
  localStorage.setItem("novaDarkMode", settings.darkMode);
  applySettings();
});

bgUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    settings.backgroundImage = event.target.result;
    localStorage.setItem("novaBackground", settings.backgroundImage);
    applySettings();
  };
  reader.readAsDataURL(file);
});

classicBlueBtn.addEventListener("click", () => {
  settings.backgroundImage = null;
  localStorage.removeItem("novaBackground");
  applySettings();
});

fontSizeInput.addEventListener("change", (e) => {
  settings.fontSize = e.target.value;
  localStorage.setItem("novaFontSize", settings.fontSize);
  applySettings();
});

audioPreviewToggle.addEventListener("change", (e) => {
  settings.audioPreview = e.target.checked;
  localStorage.setItem("novaAudioPreview", settings.audioPreview);
  console.log("Audio previews:", settings.audioPreview);
});

// --- Apply settings ---
function applySettings() {
  if (settings.darkMode) {
    document.body.style.backgroundColor = "#111";
    document.body.style.color = "#eee";
  } else {
    document.body.style.color = "white";
    if (!settings.backgroundImage) document.body.style.backgroundColor = "#2596be";
  }

  if (settings.backgroundImage) {
    document.body.style.backgroundImage = `url('${settings.backgroundImage}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
  } else {
    document.body.style.backgroundImage = "";
  }

  document.body.style.fontSize = settings.fontSize + "px";
  darkModeToggle.checked = settings.darkMode;
  fontSizeInput.value = settings.fontSize;
  audioPreviewToggle.checked = settings.audioPreview;
}

applySettings();

// --- Footer ---
const footerCredit = document.createElement("div");
footerCredit.textContent = "Made by Dylan.H";
footerCredit.style.cssText = `
  position: fixed;
  bottom: 10px;
  right: 20px;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  z-index: 1600;
  pointer-events: none;
`;

document.body.appendChild(footerCredit);
