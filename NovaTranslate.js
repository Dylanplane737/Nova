// Create and inject styles
const style = document.createElement("style");
style.textContent = `
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0b0f14;
  color: #e6e6e6;
  height: 100vh;
}
.window {
  position: fixed;
  bottom: 72px;
  left: 20px;
  width: 92%;
  max-width: 520px;
  background: #121822;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,.6);
  transition: transform 0.25s ease, opacity 0.25s ease;
  transform: translateY(100%);
  opacity: 0;
  display: flex;
  flex-direction: column;
}
.window.minimized { transform: translateY(100%); opacity:0; }
.window.open { transform: translateY(0); opacity:1; }
.titlebar {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 10px;
}
select, textarea, button {
  width: 100%;
  background: #0f141d;
  color: #fff;
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
  margin-top: 8px;
  border: none;
}
textarea { height: 90px; resize:none; }
button {
  background: #1f6fff;
  cursor: pointer;
  font-weight: bold;
}
button:active { transform: scale(0.98); }
.status { margin-top: 8px; font-size:12px; opacity:0.7; text-align:center; }
#translatorIcon {
  position: fixed;
  bottom: 20px;
  left: 20px;
  cursor: pointer;
  color: #1f6fff;
  font-size: 24px;
}
`;
document.head.appendChild(style);

// Create translator panel
const panel = document.createElement("div");
panel.id = "translatorPanel";
panel.className = "window minimized";
panel.innerHTML = `
  <div class="titlebar">
    🌐 Nova Translate (Beta)
    <div style="display:inline-flex; gap:8px">
      <span style="cursor:pointer;opacity:.7" id="minimizeBtn">—</span>
      <span style="cursor:pointer;opacity:.7" id="closeBtn">✕</span>
    </div>
  </div>

  <select id="fromLang">
    <option value="en">English</option>
    <option value="es">Spanish</option>
    <option value="fr">French</option>
    <option value="de">German</option>
    <option value="pt">Portuguese</option>
  </select>

  <select id="toLang">
    <option value="es">Spanish</option>
    <option value="en">English</option>
    <option value="fr">French</option>
    <option value="de">German</option>
    <option value="pt">Portuguese</option>
  </select>

  <textarea id="inputText" placeholder="Type text…"></textarea>
  <button id="translateBtn">Translate</button>

  <textarea id="outputText" placeholder="Translation…" readonly></textarea>
  <div class="status" id="status">Ready</div>
`;
document.body.appendChild(panel);

// Create translator icon
const icon = document.createElement("div");
icon.id = "translatorIcon";
icon.textContent = "🌐";
document.body.appendChild(icon);

// Elements references
const minimizeBtn = document.getElementById("minimizeBtn");
const closeBtn = document.getElementById("closeBtn");
const translateBtn = document.getElementById("translateBtn");
const status = document.getElementById("status");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const fromLang = document.getElementById("fromLang");
const toLang = document.getElementById("toLang");

// Panel controls
icon.addEventListener("click", () => {
  panel.classList.remove("minimized");
  panel.classList.add("open");
});
minimizeBtn.addEventListener("click", () => {
  panel.classList.remove("open");
  panel.classList.add("minimized");
});
closeBtn.addEventListener("click", () => {
  panel.classList.remove("open");
  panel.classList.add("minimized");
});

// Translation function
async function translateNova() {
  const input = inputText.value.trim();
  if (!input) return;

  const from = fromLang.value;
  const to = toLang.value;

  status.textContent = "Translating…";
  outputText.value = "";

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      status.textContent = "Network error (" + res.status + ")";
      return;
    }

    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      outputText.value = data.responseData.translatedText;
      status.textContent = "Translated";
    } else {
      status.textContent = "Translation error";
    }
  } catch (err) {
    console.error(err);
    status.textContent = "Network or API error";
  }
}

translateBtn.addEventListener("click", translateNova);
