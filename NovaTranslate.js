// NovaTranslate.js — registerable version for Appsbar.js
(function () {
  // Small helper to create elements
  const create = (tag, attrs = {}, html = '') => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else el.setAttribute(k, v);
    });
    el.innerHTML = html;
    return el;
  };

  // Render function that Appsbar will call with a container element
  function renderTranslate(container) {
    container.innerHTML = `
      <div class="titlebar">🌐 Nova Translate (Beta)</div>
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

    // wire up controls inside the provided container
    const translateBtn = container.querySelector('#translateBtn');
    const status = container.querySelector('#status');
    const inputText = container.querySelector('#inputText');
    const outputText = container.querySelector('#outputText');
    const fromLang = container.querySelector('#fromLang');
    const toLang = container.querySelector('#toLang');

    async function translateNova() {
      const input = inputText.value.trim();
      if (!input) return;
      const from = fromLang.value;
      const to = toLang.value;
      status.textContent = 'Translating…';
      outputText.value = '';
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) { status.textContent = 'Network error (' + res.status + ')'; return; }
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          outputText.value = data.responseData.translatedText;
          status.textContent = 'Translated';
        } else {
          status.textContent = 'Translation error';
        }
      } catch (err) {
        console.error(err);
        status.textContent = 'Network or API error';
      }
    }

    translateBtn.addEventListener('click', translateNova);
  }

  // Icon HTML you want to show in the dock
  const iconHTML = `<span style="font-size:16px;line-height:1">🌐</span>`;

  // Register with the Appsbar runtime
  // Ensure Appsbar.js is loaded first. If NovaApps is not ready yet, wait briefly.
  function registerWhenReady() {
    if (window.NovaApps && typeof window.NovaApps.registerApp === 'function') {
      window.NovaApps.registerApp({
        id: 'nova-translate',          // unique id used by the dock
        title: 'Nova Translate',
        iconHTML: iconHTML,
        render: renderTranslate
      });
    } else {
      // try again shortly if Appsbar hasn't loaded yet
      setTimeout(registerWhenReady, 120);
    }
  }
  registerWhenReady();
})();
