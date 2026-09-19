/* =========================================================
   NOVA SETTINGS
   ========================================================= */
(function () {
  const STORAGE = {
    theme: "novaTheme",
    accent: "novaAccent",
    darkMode: "novaDarkMode",
    background: "novaBackground",
    fontSize: "novaFontSize",
    audioPreview: "novaAudioPreview",
    animations: "novaAnimations",
    compact: "novaCompact",
    highContrast: "novaHighContrast",
    suggestions: "novaSuggestions",
    webResults: "novaWebResults",
    autoFocus: "novaAutoFocus",
    openLinksNewTab: "novaOpenLinksNewTab",
    saveHistory: "novaSaveHistory",
    restoreSearch: "novaRestoreSearch",
    smoothScroll: "novaSmoothScroll",
    showTabs: "novaShowTabs"
  };

  const DEFAULTS = {
    theme: "classic",
    accent: "#0f75a8",
    background: "",
    fontSize: 16,
    audioPreview: false,
    animations: true,
    compact: false,
    highContrast: false,
    suggestions: true,
    webResults: true,
    autoFocus: true,
    openLinksNewTab: true,
    saveHistory: true,
    restoreSearch: true,
    smoothScroll: true,
    showTabs: true
  };

  const THEMES = {
    classic: { name: "Classic Blue", bg: "#2596be", text: "#ffffff" },
    dark:    { name: "Midnight",     bg: "#071018", text: "#eaf6ff" },
    light:   { name: "Light",        bg: "#eaf4f8", text: "#10202a" },
    retro:   { name: "Retro",        bg: "#c0c0c0", text: "#000000" }
  };

  function bool(key, fallback) {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
  }

  function loadSettings() {
    let theme = localStorage.getItem(STORAGE.theme);
    if (!THEMES[theme]) {
      theme = localStorage.getItem(STORAGE.darkMode) === "true" ? "dark" : DEFAULTS.theme;
    }

    const parsedFont = parseInt(localStorage.getItem(STORAGE.fontSize) || String(DEFAULTS.fontSize), 10);

    return {
      theme: theme,
      accent: localStorage.getItem(STORAGE.accent) || DEFAULTS.accent,
      background: localStorage.getItem(STORAGE.background) || DEFAULTS.background,
      fontSize: Math.max(10, Math.min(48, Number.isFinite(parsedFont) ? parsedFont : 16)),
      audioPreview: bool(STORAGE.audioPreview, DEFAULTS.audioPreview),
      animations: bool(STORAGE.animations, DEFAULTS.animations),
      compact: bool(STORAGE.compact, DEFAULTS.compact),
      highContrast: bool(STORAGE.highContrast, DEFAULTS.highContrast),
      suggestions: bool(STORAGE.suggestions, DEFAULTS.suggestions),
      webResults: bool(STORAGE.webResults, DEFAULTS.webResults),
      autoFocus: bool(STORAGE.autoFocus, DEFAULTS.autoFocus),
      openLinksNewTab: bool(STORAGE.openLinksNewTab, DEFAULTS.openLinksNewTab),
      saveHistory: bool(STORAGE.saveHistory, DEFAULTS.saveHistory),
      restoreSearch: bool(STORAGE.restoreSearch, DEFAULTS.restoreSearch),
      smoothScroll: bool(STORAGE.smoothScroll, DEFAULTS.smoothScroll),
      showTabs: bool(STORAGE.showTabs, DEFAULTS.showTabs)
    };
  }

  function saveSettings(s) {
    localStorage.setItem(STORAGE.theme, s.theme);
    localStorage.setItem(STORAGE.accent, s.accent);
    localStorage.setItem(STORAGE.fontSize, String(s.fontSize));
    localStorage.setItem(STORAGE.audioPreview, String(!!s.audioPreview));
    localStorage.setItem(STORAGE.animations, String(!!s.animations));
    localStorage.setItem(STORAGE.compact, String(!!s.compact));
    localStorage.setItem(STORAGE.highContrast, String(!!s.highContrast));
    localStorage.setItem(STORAGE.suggestions, String(!!s.suggestions));
    localStorage.setItem(STORAGE.webResults, String(!!s.webResults));
    localStorage.setItem(STORAGE.autoFocus, String(!!s.autoFocus));
    localStorage.setItem(STORAGE.openLinksNewTab, String(!!s.openLinksNewTab));
    localStorage.setItem(STORAGE.saveHistory, String(!!s.saveHistory));
    localStorage.setItem(STORAGE.restoreSearch, String(!!s.restoreSearch));
    localStorage.setItem(STORAGE.smoothScroll, String(!!s.smoothScroll));
    localStorage.setItem(STORAGE.showTabs, String(!!s.showTabs));
    localStorage.setItem(STORAGE.darkMode, String(s.theme === "dark"));
    if (s.background) localStorage.setItem(STORAGE.background, s.background);
    else localStorage.removeItem(STORAGE.background);
  }

  function installStyles() {
    if (document.getElementById("nova-settings-overrides")) return;

    const style = document.createElement("style");
    style.id = "nova-settings-overrides";
    style.textContent = [
      ":root{--nova-accent:#0f75a8;--nova-accent-light:#a8d0e6;}",
      "#openBtn,#novaSettingsButton,#novaNewTab,.nova-settings .nova-action,.nova-settings .nova-preset{background:var(--nova-accent)!important;}",
      ".nova-tab.active,.suggestions div:hover,.suggestions .highlighted{background:var(--nova-accent)!important;}",
      "input#urlInput:focus{outline:none!important;box-shadow:0 0 12px 3px #a8d0e6!important;transition:box-shadow 0.3s ease!important;}",
      ".nova-settings button{margin-top:0!important;}",
      "html.nova-no-motion *,html.nova-no-motion *::before,html.nova-no-motion *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}",
      "html.nova-compact body{margin-top:16px!important;margin-bottom:16px!important;}",
      "html.nova-compact #wikiSummary,html.nova-compact #relatedMedia{padding:12px!important;}",
      "html.nova-compact .media-section img,html.nova-compact .media-section video{width:120px!important;height:84px!important;}",
      "html.nova-high-contrast #wikiSummary,html.nova-high-contrast #relatedMedia,html.nova-high-contrast #dictionaryContainer,html.nova-high-contrast #timelineContainer{border:2px solid currentColor!important;}",
      "html.nova-no-tabs #novaTabsBar{display:none!important;}"
    ].join("");
    document.head.appendChild(style);
  }

  function applySettings(s) {
    installStyles();

    const theme = THEMES[s.theme] || THEMES.classic;

    document.documentElement.style.setProperty("--nova-accent", s.accent);
    document.documentElement.style.setProperty("--nova-accent-light", s.accent + "66");
    document.documentElement.style.fontSize = s.fontSize + "px";

    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;

    if (s.background) {
      document.body.style.backgroundImage = 'url("' + s.background.replace(/"/g, "%22") + '")';
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundAttachment = "";
    }

    document.documentElement.classList.toggle("nova-no-motion", !s.animations);
    document.documentElement.classList.toggle("nova-compact", !!s.compact);
    document.documentElement.classList.toggle("nova-high-contrast", !!s.highContrast);
    document.documentElement.classList.toggle("nova-no-tabs", !s.showTabs);
    document.body.style.scrollBehavior = s.smoothScroll ? "smooth" : "auto";

    const tabs = document.getElementById("novaTabsBar");
    if (tabs) tabs.style.display = s.showTabs ? "" : "none";
  }

  function clearHistory() {
    localStorage.removeItem("nova_history");
  }

  function clearSuggestionCache() {
    Object.keys(localStorage).filter(function (k) {
      return k.indexOf("wiki_suggest_") === 0;
    }).forEach(function (k) {
      localStorage.removeItem(k);
    });

    Object.keys(sessionStorage).filter(function (k) {
      return k.indexOf("wiki_suggest_") === 0;
    }).forEach(function (k) {
      sessionStorage.removeItem(k);
    });
  }

  function storageSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      total += key.length + (localStorage.getItem(key) || "").length;
    }
    return total;
  }

  function prettyBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(2) + " MB";
  }

  function exportBackup() {
    const data = {
      novaBackupVersion: 2,
      exportedAt: new Date().toISOString(),
      settings: loadSettings(),
      history: JSON.parse(localStorage.getItem("nova_history") || "[]")
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nova-backup.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importBackup(file, status) {
    const reader = new FileReader();

    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || ""));
        const incoming = data.settings || data;

        if (incoming.theme && THEMES[incoming.theme]) localStorage.setItem(STORAGE.theme, incoming.theme);
        if (incoming.accent) localStorage.setItem(STORAGE.accent, incoming.accent);
        if (typeof incoming.background === "string") localStorage.setItem(STORAGE.background, incoming.background);
        if (Number.isFinite(Number(incoming.fontSize))) localStorage.setItem(STORAGE.fontSize, String(incoming.fontSize));

        [
          "audioPreview","animations","compact","highContrast","suggestions","webResults",
          "autoFocus","openLinksNewTab","saveHistory","restoreSearch",
          "smoothScroll","showTabs"
        ].forEach(function (key) {
          if (typeof incoming[key] === "boolean") {
            localStorage.setItem(STORAGE[key], String(incoming[key]));
          }
        });

        if (Array.isArray(data.history)) {
          localStorage.setItem("nova_history", JSON.stringify(data.history));
        }

        status.textContent = "Backup imported. Reloading...";
        setTimeout(function () { location.reload(); }, 700);
      } catch {
        status.textContent = "Invalid Nova backup.";
      }
    };

    reader.readAsText(file);
  }

  function resetEverything(status) {
    if (!confirm("Reset Nova settings, history, and local preferences?")) return;
    localStorage.clear();
    sessionStorage.clear();
    status.textContent = "Everything cleared. Reloading...";
    setTimeout(function () { location.reload(); }, 700);
  }

  function renderSettings(container) {
    if (!container) return;

    const s = loadSettings();

    container.innerHTML = [
      '<div class="nova-settings">',
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px">',
      '<div><h2 style="margin:0">Nova Settings</h2><div style="font-size:12px;opacity:.7">Made by Dylan.H :3</div></div>',
      '<span style="font-size:12px;opacity:.6">v2</span>',
      '</div>',

      '<div style="margin-top:16px"><strong>Appearance</strong>',
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">',
      '<button type="button" class="nova-preset" data-theme="classic">Classic Blue</button>',
      '<button type="button" class="nova-preset" data-theme="dark">Midnight</button>',
      '<button type="button" class="nova-preset" data-theme="light">Light</button>',
      '<button type="button" class="nova-preset" data-theme="retro">Retro</button>',
      '</div>',

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">',
      '<label style="display:flex;align-items:center;gap:8px">Accent <input id="ns-accent" type="color" style="width:42px;height:34px;padding:0;border:0"></label>',
      '<label style="display:flex;align-items:center;gap:8px">Font <input id="ns-font" type="number" min="10" max="48" style="width:72px;padding:7px;border-radius:8px;border:1px solid #666"></label>',
      '</div>',

      '<label style="display:flex;align-items:center;gap:8px;margin-top:9px"><input id="ns-compact" type="checkbox"> Compact mode</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-motion" type="checkbox"> Animations & effects</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-contrast" type="checkbox"> High contrast</label>',

      '<div style="margin-top:10px"><input id="ns-bg-file" type="file" accept="image/*">',
      '<button id="ns-clear-bg" type="button" class="nova-action">Classic background</button>',
      '<img id="ns-bg-preview" alt="Background preview" style="display:none;width:100%;height:72px;object-fit:cover;border-radius:8px;margin-top:8px"></div>',
      '</div>',

      '<div style="border-top:1px solid rgba(255,255,255,.14);margin-top:16px;padding-top:14px"><strong>Search & behavior</strong>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:9px"><input id="ns-suggestions" type="checkbox"> Search suggestions</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-web-results" type="checkbox"> Web search results</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-autofocus" type="checkbox"> Focus search box on startup</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-newtab" type="checkbox"> Open websites in a new tab</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-lastsearch" type="checkbox"> Remember last search</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-history" type="checkbox"> Save search history</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-smooth" type="checkbox"> Smooth scrolling</label>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input id="ns-tabs" type="checkbox"> Show tab bar</label>',
      '</div>',

      '<div style="border-top:1px solid rgba(255,255,255,.14);margin-top:16px;padding-top:14px"><strong>Data & privacy</strong>',
      '<div style="font-size:12px;opacity:.7;margin-top:5px">Preferences, history, and backups stay in this browser.</div>',
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:10px">',
      '<button id="ns-clear-history" type="button" class="nova-action">Clear history</button>',
      '<button id="ns-clear-cache" type="button" class="nova-action">Clear suggestion cache</button>',
      '<button id="ns-backup" type="button" class="nova-action">Export backup</button>',
      '<button id="ns-import-btn" type="button" class="nova-action">Import backup</button>',
      '<input id="ns-import" type="file" accept="application/json,.json" hidden>',
      '</div>',
      '<div id="ns-storage" style="font-size:12px;opacity:.7;margin-top:9px"></div>',
      '</div>',

      '<div style="border-top:1px solid rgba(255,255,255,.14);margin-top:16px;padding-top:14px"><strong>Audio</strong>',
      '<label style="display:flex;align-items:center;gap:8px;margin-top:9px"><input id="ns-audio" type="checkbox"> Audio previews</label>',
      '</div>',

      '<div style="display:flex;gap:8px;align-items:center;margin-top:18px">',
      '<button id="ns-save" type="button" class="nova-action" style="font-weight:700">Save settings</button>',
      '<button id="ns-reset" type="button">Reset everything</button>',
      '<span id="ns-status" style="font-size:12px;opacity:.75"></span>',
      '</div>',
      '</div>'
    ].join("");

    const q = function (selector) { return container.querySelector(selector); };

    const accent = q("#ns-accent");
    const font = q("#ns-font");
    const compact = q("#ns-compact");
    const motion = q("#ns-motion");
    const contrast = q("#ns-contrast");
    const suggestions = q("#ns-suggestions");
    const webResults = q("#ns-web-results");
    const autoFocus = q("#ns-autofocus");
    const newTab = q("#ns-newtab");
    const lastSearch = q("#ns-lastsearch");
    const history = q("#ns-history");
    const smooth = q("#ns-smooth");
    const tabs = q("#ns-tabs");
    const audio = q("#ns-audio");
    const bgFile = q("#ns-bg-file");
    const bgPreview = q("#ns-bg-preview");
    const clearBg = q("#ns-clear-bg");
    const save = q("#ns-save");
    const reset = q("#ns-reset");
    const status = q("#ns-status");
    const storage = q("#ns-storage");

    accent.value = s.accent;
    font.value = s.fontSize;
    compact.checked = s.compact;
    motion.checked = s.animations;
    contrast.checked = s.highContrast;
    suggestions.checked = s.suggestions;
    webResults.checked = s.webResults;
    autoFocus.checked = s.autoFocus;
    newTab.checked = s.openLinksNewTab;
    lastSearch.checked = s.restoreSearch;
    history.checked = s.saveHistory;
    smooth.checked = s.smoothScroll;
    tabs.checked = s.showTabs;
    audio.checked = s.audioPreview;

    if (s.background) {
      bgPreview.src = s.background;
      bgPreview.style.display = "block";
    }

    function updateStorage() {
      let historyCount = 0;
      try {
        historyCount = JSON.parse(localStorage.getItem("nova_history") || "[]").length;
      } catch {}
      storage.textContent = "Storage: " + prettyBytes(storageSize()) + " • History: " + historyCount + " entries";
    }

    function msg(text) {
      status.textContent = text;
      setTimeout(function () {
        if (status.textContent === text) status.textContent = "";
      }, 1400);
    }

    applySettings(s);
    updateStorage();

    accent.addEventListener("input", function () {
      s.accent = accent.value;
      applySettings(s);
      saveSettings(s);
    });

    font.addEventListener("change", function () {
      s.fontSize = Math.max(10, Math.min(48, parseInt(font.value || "16", 10)));
      font.value = s.fontSize;
      applySettings(s);
      saveSettings(s);
    });

    compact.addEventListener("change", function () {
      s.compact = compact.checked;
      applySettings(s);
      saveSettings(s);
    });

    motion.addEventListener("change", function () {
      s.animations = motion.checked;
      applySettings(s);
      saveSettings(s);
    });

    contrast.addEventListener("change", function () {
      s.highContrast = contrast.checked;
      applySettings(s);
      saveSettings(s);
    });

    suggestions.addEventListener("change", function () { s.suggestions = suggestions.checked; saveSettings(s); });
    webResults.addEventListener("change", function () {
      s.webResults = webResults.checked;
      saveSettings(s);
      const box = document.getElementById("webSearchContainer");
      if (box && !s.webResults) box.classList.remove("visible");
    });
    autoFocus.addEventListener("change", function () { s.autoFocus = autoFocus.checked; saveSettings(s); });
    newTab.addEventListener("change", function () { s.openLinksNewTab = newTab.checked; saveSettings(s); });
    lastSearch.addEventListener("change", function () { s.restoreSearch = lastSearch.checked; saveSettings(s); });
    history.addEventListener("change", function () { s.saveHistory = history.checked; saveSettings(s); });

    smooth.addEventListener("change", function () {
      s.smoothScroll = smooth.checked;
      applySettings(s);
      saveSettings(s);
    });

    tabs.addEventListener("change", function () {
      s.showTabs = tabs.checked;
      applySettings(s);
      saveSettings(s);
    });

    audio.addEventListener("change", function () { s.audioPreview = audio.checked; saveSettings(s); });

    bgFile.addEventListener("change", function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function () {
        s.background = String(reader.result || "");
        bgPreview.src = s.background;
        bgPreview.style.display = "block";
        applySettings(s);
        saveSettings(s);
      };
      reader.readAsDataURL(file);
    });

    clearBg.addEventListener("click", function () {
      s.background = "";
      bgPreview.removeAttribute("src");
      bgPreview.style.display = "none";
      applySettings(s);
      saveSettings(s);
    });

    container.querySelectorAll(".nova-preset").forEach(function (button) {
      button.addEventListener("click", function () {
        s.theme = button.dataset.theme;
        if (s.theme === "classic") s.accent = "#0f75a8";
        if (s.theme === "dark") s.accent = "#2d9cdb";
        if (s.theme === "light") s.accent = "#1681b8";
        if (s.theme === "retro") s.accent = "#000080";
        accent.value = s.accent;
        applySettings(s);
        saveSettings(s);
        msg((THEMES[s.theme] || THEMES.classic).name + " applied");
      });
    });

    q("#ns-clear-history").addEventListener("click", function () {
      clearHistory();
      updateStorage();
      msg("History cleared");
    });

    q("#ns-clear-cache").addEventListener("click", function () {
      clearSuggestionCache();
      updateStorage();
      msg("Suggestion cache cleared");
    });

    q("#ns-backup").addEventListener("click", function () {
      exportBackup();
      msg("Backup exported");
    });

    q("#ns-import-btn").addEventListener("click", function () {
      q("#ns-import").click();
    });

    q("#ns-import").addEventListener("change", function (event) {
      const file = event.target.files && event.target.files[0];
      if (file) importBackup(file, status);
    });

    save.addEventListener("click", function () {
      saveSettings(s);
      updateStorage();
      msg("Saved ✓");
    });

    reset.addEventListener("click", function () {
      resetEverything(status);
    });
  }

  function openNovaSettings() {
    const panel = document.getElementById("novaSettingsPanel");
    const content = document.getElementById("novaSettingsContent");
    if (!panel || !content) return;
    panel.classList.add("show");
    panel.setAttribute("aria-hidden", "false");
    renderSettings(content);
  }

  function closeNovaSettings() {
    const panel = document.getElementById("novaSettingsPanel");
    if (!panel) return;
    panel.classList.remove("show");
    panel.setAttribute("aria-hidden", "true");
  }

  window.NovaSettings = {
    loadSettings: loadSettings,
    applySettings: applySettings,
    saveSettings: saveSettings
  };

  window.renderNovaSettings = renderSettings;

  const close = document.getElementById("novaSettingsClose");
  if (close) close.addEventListener("click", closeNovaSettings);

  window.openNovaSettings = openNovaSettings;
  window.closeNovaSettings = closeNovaSettings;

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && panel && panel.classList.contains("show")) {
      closeNovaSettings();
      return;
    }

    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      openNovaSettings();
    }
  });

  applySettings(loadSettings());
})();
