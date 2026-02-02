// /js/apps/settings.js
(function () {
  const STORAGE = {
    darkMode: 'novaDarkMode',
    background: 'novaBackground',
    fontSize: 'novaFontSize',
    audioPreview: 'novaAudioPreview'
  };

  // Read saved settings (with defaults)
  function loadSettings() {
    return {
      darkMode: JSON.parse(localStorage.getItem(STORAGE.darkMode) || 'false'),
      backgroundImage: localStorage.getItem(STORAGE.background) || null,
      fontSize: parseInt(localStorage.getItem(STORAGE.fontSize) || '16', 10),
      audioPreview: JSON.parse(localStorage.getItem(STORAGE.audioPreview) || 'false')
    };
  }

  function saveSettings(s) {
    localStorage.setItem(STORAGE.darkMode, JSON.stringify(!!s.darkMode));
    if (s.backgroundImage) localStorage.setItem(STORAGE.background, s.backgroundImage);
    else localStorage.removeItem(STORAGE.background);
    localStorage.setItem(STORAGE.fontSize, String(s.fontSize));
    localStorage.setItem(STORAGE.audioPreview, JSON.stringify(!!s.audioPreview));
  }

  // Apply settings to the page (uses Nova style choices)
  function applySettingsToPage(s) {
    // Dark / light
    if (s.darkMode) {
      document.documentElement.style.setProperty('background-color', '#071018');
      document.documentElement.style.setProperty('color', '#eaf6ff');
    } else {
      document.documentElement.style.setProperty('background-color', '#2596be');
      document.documentElement.style.setProperty('color', '#ffffff');
    }

    // Background image
    if (s.backgroundImage) {
      document.documentElement.style.setProperty('background-image', `url("${s.backgroundImage}")`);
      document.documentElement.style.setProperty('background-size', 'cover');
      document.documentElement.style.setProperty('background-position', 'center');
    } else {
      document.documentElement.style.removeProperty('background-image');
    }

    // Font size
    document.documentElement.style.setProperty('font-size', `${s.fontSize}px`);
  }

  // Render function called by Appsbar runtime
  function renderSettings(container) {
    const s = loadSettings();

    // Scoped styles for the settings panel (Nova look)
    const scopedStyle = document.createElement('style');
    scopedStyle.textContent = `
      .nova-settings { font-family: var(--nova-font, "Pixelify Sans", system-ui); color: var(--nova-text, #fff); }
      .nova-settings .row { display:flex; gap:10px; align-items:center; margin-bottom:10px; }
      .nova-settings h4 { margin:0 0 8px 0; color: var(--nova-heading, #a8d0e6); font-size:14px; }
      .nova-settings label { font-size:13px; color: #dff6ff; display:flex; gap:8px; align-items:center; }
      .nova-settings input[type="number"] { width:72px; padding:6px 8px; border-radius:10px; background: rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.04); color:var(--nova-text); }
      .nova-settings .pill { background: var(--nova-button, #0f75a8); color: #fff; padding:8px 12px; border-radius:28px; border:none; cursor:pointer; font-weight:700; box-shadow: 0 6px 14px rgba(0,0,0,0.18); }
      .nova-settings .muted { color: rgba(255,255,255,0.7); font-size:12px; }
      .nova-settings .bg-preview { width:100%; height:64px; border-radius:8px; object-fit:cover; display:block; margin-top:8px; box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
      .nova-settings .file { color:var(--nova-text); }
      .nova-settings .section { padding:8px 0; border-top: 1px solid rgba(255,255,255,0.03); margin-top:8px; }
      .nova-settings .link-like { background: linear-gradient(90deg,var(--nova-primary-bg,#2596be), #4f7cff); padding:8px 10px; border-radius:10px; color:#fff; text-align:center; cursor:pointer; font-weight:700; }
    `;
    container.appendChild(scopedStyle);

    // Build markup
    container.innerHTML = `
      <div class="nova-settings">
        <h4>Nova Settings</h4>

        <div class="row">
          <label><input type="checkbox" id="ns-dark"> Dark Mode</label>
          <div class="muted">Theme</div>
        </div>

        <div class="row">
          <label>Font size <input id="ns-font" type="number" min="10" max="48" /></label>
          <div class="muted">UI scale</div>
        </div>

        <div class="row">
          <label><input type="checkbox" id="ns-audio"> Audio previews</label>
          <div class="muted">Sound</div>
        </div>

        <div class="section">
          <div class="muted">Background</div>
          <div style="display:flex;gap:8px;margin-top:8px;align-items:center">
            <input id="ns-bg-file" type="file" accept="image/*" class="file" />
            <button class="pill" id="ns-clear-bg">Classic Blue</button>
          </div>
          <img id="ns-bg-preview" class="bg-preview" alt="preview" style="display:none"/>
        </div>

        <div class="section" style="display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:12px">
          <div class="muted">Quick tools</div>
          <div style="display:flex;gap:8px">
            <button class="pill" id="ns-open-translate">🌐 Translate</button>
            <button class="pill" id="ns-save">Save</button>
          </div>
        </div>

        <div class="muted" style="margin-top:10px;font-size:12px">Settings saved to localStorage · Made by Dylan.H</div>
      </div>
    `;

    // Wire elements
    const darkEl = container.querySelector('#ns-dark');
    const fontEl = container.querySelector('#ns-font');
    const audioEl = container.querySelector('#ns-audio');
    const fileEl = container.querySelector('#ns-bg-file');
    const preview = container.querySelector('#ns-bg-preview');
    const clearBtn = container.querySelector('#ns-clear-bg');
    const saveBtn = container.querySelector('#ns-save');
    const translateBtn = container.querySelector('#ns-open-translate');

    // Initialize UI with current settings
    darkEl.checked = !!s.darkMode;
    fontEl.value = s.fontSize || 16;
    audioEl.checked = !!s.audioPreview;
    if (s.backgroundImage) {
      preview.src = s.backgroundImage;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }

    // Handlers
    darkEl.addEventListener('change', () => {
      s.darkMode = darkEl.checked;
      applySettingsToPage(s);
    });

    fontEl.addEventListener('change', () => {
      s.fontSize = Math.max(10, Math.min(48, parseInt(fontEl.value || '16', 10)));
      applySettingsToPage(s);
    });

    audioEl.addEventListener('change', () => {
      s.audioPreview = audioEl.checked;
    });

    fileEl.addEventListener('change', (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        s.backgroundImage = e.target.result;
        preview.src = s.backgroundImage;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    clearBtn.addEventListener('click', () => {
      s.backgroundImage = null;
      preview.style.display = 'none';
      applySettingsToPage(s);
    });

    saveBtn.addEventListener('click', () => {
      saveSettings(s);
      // small visual confirmation
      saveBtn.textContent = 'Saved ✓';
      setTimeout(() => saveBtn.textContent = 'Save', 900);
    });

    translateBtn.addEventListener('click', () => {
      // open Nova Translate tool in the dock
      if (window.NovaApps && typeof window.NovaApps.openApp === 'function') {
        window.NovaApps.openApp('nova-translate');
      }
    });

    // Apply immediately so user sees changes live
    applySettingsToPage(s);
  }

  // Register the app with the Appsbar runtime
  function registerWhenReady() {
    if (window.NovaApps && typeof window.NovaApps.registerApp === 'function') {
      window.NovaApps.registerApp({
        id: 'settings',
        title: 'Settings',
        iconHTML: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="color:var(--nova-primary-bg)"><path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="currentColor"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.9.9a1 1 0 0 1-1.4 1.4l-.9-.9a1 1 0 0 0-1.1-.2 7.1 7.1 0 0 1-1.6.9 1 1 0 0 0-.6 1v1.3a1 1 0 0 1-2 0V18a1 1 0 0 0-.6-1 7.1 7.1 0 0 1-1.6-.9 1 1 0 0 0-1.1.2l-.9.9a1 1 0 0 1-1.4-1.4l.9-.9a1 1 0 0 0 .2-1.1 7.1 7.1 0 0 1-.9-1.6 1 1 0 0 0-1-.6H3.7a1 1 0 0 1 0-2H5a1 1 0 0 0 1-.6c.2-.6.5-1.2.9-1.6a1 1 0 0 0-.2-1.1l-.9-.9A1 1 0 0 1 6.2 3.6l.9.9a1 1 0 0 0 1.1.2c.5-.3 1-.6 1.6-.9A1 1 0 0 0 10 3h1.3a1 1 0 0 1 0 2H11a1 1 0 0 0-.6 1c-.2.6-.5 1.2-.9 1.6a1 1 0 0 0 .2 1.1l.9.9a1 1 0 0 1-1.4 1.4l-.9-.9a1 1 0 0 0-1.1-.2c-.5.3-1 .6-1.6.9A1 1 0 0 0 6 13v1.3a1 1 0 0 1-2 0V13a1 1 0 0 0-.6-1 7.1 7.1 0 0 1-.9-1.6 1 1 0 0 0-1.1-.2l-.9.9A1 1 0 0 1 .6 11.4l.9-.9a1 1 0 0 0 1.1-.2c.3-.5.6-1 0-1.6A1 1 0 0 0 2 7h1.3a1 1 0 0 1 0-2H3.7a1 1 0 0 0 0 2H5a1 1 0 0 0 .6 1c.6.2 1.2.5 1.6.9.3.5.6 1 .9 1.6.2.5.6.8 1.1.2l.9-.9a1 1 0 0 1 1.4 1.4l-.9.9a1 1 0 0 0-.2 1.1c.3.5.6 1 1 1.6.3.5.6 1 1.1.2l.9-.9a1 1 0 0 1 1.4 1.4l-.9.9a1 1 0 0 0-.2 1.1c.3.5.6 1 1 1.6.3.5.6 1 1.1.2l.9-.9a1 1 0 0 1 1.4 1.4l-.9.9a1 1 0 0 0-.2 1.1c.3.5.6 1 1 1.6.3.5.6 1 1.1.2l.9-.9a1 1 0 0 1 1.4 1.4l-.9.9a1 1 0 0 0 1.4 1.4l.9-.9a1 1 0 0 1 1.4 1.4l-.9.9a1 1 0 0 0 1.4 1.4l.9-.9a1 1 0 0 1 1.4 1.4l-.9.9z" fill="currentColor"/></svg>`,
        render: renderSettings
      });
    } else {
      setTimeout(registerWhenReady, 120);
    }
  }

  registerWhenReady();
})();

