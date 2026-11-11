/* =========================================================
   NOVA 26.4 — Advanced Appearance
   Separate power-user editor. Existing Settings controls remain unchanged.
   ========================================================= */
(function () {
  "use strict";

  const CONFIG_KEY = "novaAdvancedAppearanceV1";
  const PROFILES_KEY = "novaAdvancedAppearanceProfilesV1";
  const COLOR_KEYS = ["pageBg", "surface", "text", "muted", "border", "inputBg", "inputText", "linkColor"];
  const DEFAULTS = {
    pageBg: null,
    surface: null,
    text: null,
    muted: null,
    border: null,
    inputBg: null,
    inputText: null,
    linkColor: null,
    radius: 12,
    blur: 0,
    shadow: 25,
    surfaceOpacity: 100
  };

  const THEME_COLORS = {
    classic: { bg: "#2596be", text: "#ffffff", surface: "#155b78", muted: "#b8ddeb", border: "#72a9bd" },
    dark:    { bg: "#071018", text: "#eaf6ff", surface: "#10202b", muted: "#9db5c4", border: "#304554" },
    light:   { bg: "#eaf4f8", text: "#10202a", surface: "#dceaf2", muted: "#58717c", border: "#b7cbd7" },
    retro:   { bg: "#c0c0c0", text: "#000000", surface: "#b6b6b6", muted: "#3d3d3d", border: "#777777" }
  };

  let backdrop = null;
  let panel = null;
  let original = null;
  let draft = null;
  let profiles = [];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function validHex(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  }

  function normalizeConfig(value) {
    const result = Object.assign({}, DEFAULTS);
    if (!value || typeof value !== "object" || Array.isArray(value)) return result;
    COLOR_KEYS.forEach(function (key) {
      result[key] = validHex(value[key]) ? value[key].toLowerCase() : null;
    });
    result.radius = Math.max(0, Math.min(28, Number.isFinite(Number(value.radius)) ? Math.round(Number(value.radius)) : DEFAULTS.radius));
    result.blur = Math.max(0, Math.min(20, Number.isFinite(Number(value.blur)) ? Math.round(Number(value.blur)) : DEFAULTS.blur));
    result.shadow = Math.max(0, Math.min(50, Number.isFinite(Number(value.shadow)) ? Math.round(Number(value.shadow)) : DEFAULTS.shadow));
    result.surfaceOpacity = Math.max(40, Math.min(100, Number.isFinite(Number(value.surfaceOpacity)) ? Math.round(Number(value.surfaceOpacity)) : DEFAULTS.surfaceOpacity));
    return result;
  }

  function readConfig() {
    try {
      return normalizeConfig(JSON.parse(localStorage.getItem(CONFIG_KEY) || "null"));
    } catch (_) {
      return normalizeConfig(null);
    }
  }

  function readProfiles() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.slice(0, 20).filter(function (item) {
        return item && typeof item.name === "string" && item.name.trim() && item.config;
      }).map(function (item) {
        return { name: item.name.trim().slice(0, 40), config: normalizeConfig(item.config) };
      });
    } catch (_) {
      return [];
    }
  }

  function currentTheme(settingsOverride) {
    const settings = settingsOverride && typeof settingsOverride === "object"
      ? settingsOverride
      : (window.NovaSettings && window.NovaSettings.loadSettings
        ? window.NovaSettings.loadSettings() : { theme: "classic", smartUI: true });
    return { settings: settings, colors: THEME_COLORS[settings.theme] || THEME_COLORS.classic };
  }

  function readableOn(hex) {
    const match = String(hex || "").match(/^#([0-9a-f]{6})$/i);
    if (!match) return "#ffffff";
    const n = parseInt(match[1], 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 >= 0.58 ? "#10202a" : "#ffffff";
  }

  function basePageText(settings, colors) {
    if (settings.background && settings.smartUI && Number.isFinite(settings.wallpaperLuminance)) {
      return settings.wallpaperLuminance >= 0.56 ? "#10202a" : "#ffffff";
    }
    return settings.smartUI ? readableOn(colors.bg) : colors.text;
  }

  function rgbToHex(value, fallback) {
    const match = String(value || "").match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/i);
    if (!match || (match[4] !== undefined && Number(match[4]) < 0.85)) return fallback;
    return "#" + [match[1], match[2], match[3]].map(function (part) {
      return Number(part).toString(16).padStart(2, "0");
    }).join("");
  }

  function inheritedColor(key) {
    const theme = currentTheme();
    const colors = theme.colors;
    const map = {
      pageBg: colors.bg,
      surface: colors.surface,
      text: basePageText(theme.settings, colors),
      muted: colors.muted,
      border: colors.border,
      inputBg: "#ffffff",
      inputText: "#173747",
      linkColor: "#bfeaff"
    };
    const selectors = {
      pageBg: document.body,
      surface: document.getElementById("webSearchContainer"),
      text: document.getElementById("wikiSummary"),
      muted: document.querySelector(".web-search-note"),
      border: document.getElementById("webSearchContainer"),
      inputBg: document.getElementById("urlInput"),
      inputText: document.getElementById("urlInput"),
      linkColor: document.querySelector(".web-result a")
    };
    const property = key === "pageBg" || key === "surface" || key === "inputBg" ? "backgroundColor"
      : key === "border" ? "borderTopColor" : "color";
    const target = selectors[key];
    if (target) {
      const computed = window.getComputedStyle(target);
      const candidate = rgbToHex(computed[property], map[key]);
      if (candidate) return candidate;
    }
    return map[key];
  }

  function installStyles() {
    if (document.getElementById("nova-advanced-appearance-styles")) return;
    const style = document.createElement("style");
    style.id = "nova-advanced-appearance-styles";
    style.textContent = [
      ".nva-backdrop{position:fixed;inset:0;z-index:2147483100;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(3,15,26,.72);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}",
      ".nva-backdrop.show{display:flex}",
      ".nva-panel{position:relative;display:flex;flex-direction:column;width:min(780px,100%);max-height:min(900px,92vh);overflow:hidden;border:1px solid var(--ns-border,#dce6ed);border-radius:22px;background:var(--ns-bg,#fff);color:var(--ns-text,#122c40);box-shadow:0 28px 90px rgba(0,18,32,.38);font:13px/1.5 ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;text-align:left}",
      ".nva-panel:before{content:'';position:absolute;z-index:3;top:0;left:0;right:0;height:3px;background:var(--nova-accent,#0f75a8)}",
      ".nva-panel *{box-sizing:border-box}",
      ".nva-header{display:flex;align-items:center;gap:13px;padding:21px 58px 17px 24px;border-bottom:1px solid var(--ns-border-soft,#eaf0f4);background:linear-gradient(135deg,var(--ns-bg,#fff),var(--ns-surface,#f4f7fb))}",
      ".nva-mark{display:grid;place-items:center;width:42px;height:42px;flex:none;border:1px solid rgba(255,255,255,.24);border-radius:13px;background:var(--nova-accent,#0f75a8);color:var(--ns-on-accent,#fff);font-size:21px;box-shadow:0 5px 14px rgba(15,117,168,.22)}",
      ".nva-heading{min-width:0}",
      ".nva-heading h2{margin:0;font-size:19px;line-height:1.2;font-weight:750;letter-spacing:-.035em}",
      ".nva-heading p{margin:3px 0 0;color:var(--ns-sub,#687f8d);font-size:12px}",
      ".nva-close{position:absolute;top:17px;right:18px;width:34px;height:34px;min-width:0;margin:0;padding:0;border:1px solid var(--ns-border,#dce6ed);border-radius:50%;background:var(--ns-surface,#f4f7fb);color:var(--ns-sub,#687f8d);font-size:21px;line-height:1;cursor:pointer}",
      ".nva-body{flex:1;min-height:0;overflow:auto;padding:18px 22px 22px;overscroll-behavior:contain}",
      ".nva-intro{margin:0 0 18px;padding:12px 14px;border:1px solid var(--ns-border-soft,#eaf0f4);border-radius:12px;background:var(--ns-surface,#f4f7fb);color:var(--ns-sub,#687f8d);font-size:11.5px;line-height:1.55}",
      ".nva-section{display:flex;align-items:center;gap:10px;margin:21px 0 10px;padding-bottom:7px;border-bottom:1px solid var(--ns-border-soft,#eaf0f4);color:var(--ns-sub,#687f8d);font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}",
      ".nva-color-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}",
      ".nva-color-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0;min-height:60px;padding:11px 13px;border:1px solid var(--ns-border,#e3eaf2);border-radius:13px;background:var(--ns-surface,#f4f7fb);transition:border-color .16s ease,transform .16s ease}",
      ".nva-color-row:hover,.nva-slider-card:hover{border-color:var(--ns-border-strong,#c9d7e3)}",
      ".nva-color-copy{display:flex;flex-direction:column;gap:2px;min-width:0}",
      ".nva-color-copy b{font-size:12px;font-weight:650}",
      ".nva-color-copy small{color:var(--ns-sub,#687f8d);font-size:10px}",
      ".nva-color-row input[type=color]{width:38px;height:32px;flex:none;margin:0;padding:2px;border:1px solid var(--ns-border-strong,#c9d7e3);border-radius:8px;background:transparent;cursor:pointer}",
      ".nva-slider-group{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
      ".nva-slider-card{padding:13px 14px;border:1px solid var(--ns-border,#e3eaf2);border-radius:13px;background:var(--ns-surface,#f4f7fb);transition:border-color .16s ease}",
      ".nva-slider-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}",
      ".nva-slider-head b{font-size:12px}",
      ".nva-slider-head output{color:var(--nova-accent,#0f75a8);font-size:11px;font-weight:750;font-variant-numeric:tabular-nums}",
      ".nva-slider-card input[type=range]{width:100%;margin:0;accent-color:var(--nova-accent,#0f75a8)}",
      ".nva-profile-box{padding:15px;border:1px solid var(--ns-border,#e3eaf2);border-radius:15px;background:var(--ns-surface,#f4f7fb)}",
      ".nva-profile-box p{margin:0 0 10px;color:var(--ns-sub,#687f8d);font-size:11px}",
      ".nva-profile-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}",
      ".nva-profile-controls input,.nva-profile-controls select{width:100%;min-width:0;height:38px;margin:0;padding:0 10px;border:1px solid var(--ns-border-strong,#c9d7e3);border-radius:9px;background:var(--ns-bg,#fff);color:var(--ns-text,#122c40);font:12px ui-sans-serif,system-ui,sans-serif}",
      ".nva-profile-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}",
      ".nva-btn{min-height:38px;margin:0;padding:9px 13px;border:1px solid var(--ns-border,#dce6ed);border-radius:10px;background:var(--ns-bg,#fff);color:var(--ns-text,#122c40);font:650 11.5px ui-sans-serif,system-ui,sans-serif;cursor:pointer;transition:background .16s ease,border-color .16s ease,transform .16s ease}",
      ".nva-btn:hover{border-color:var(--nova-accent,#0f75a8);background:var(--ns-hover,#ebf2f9)}",
      ".nva-btn.primary{border-color:transparent;background:var(--nova-accent,#0f75a8);color:var(--ns-on-accent,#fff)}",
      ".nva-btn.danger{color:var(--ns-danger,#c0392b)}",
      ".nva-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 22px;border-top:1px solid var(--ns-border-soft,#eaf0f4);background:var(--ns-footer,#fff)}",
      ".nva-footer-note{min-width:0;color:var(--ns-sub,#687f8d);font-size:10px}",
      ".nva-footer-actions{display:flex;gap:8px;flex:none}",
      ".nva-panel button:focus-visible,.nva-panel input:focus-visible,.nva-panel select:focus-visible{outline:2px solid var(--nova-accent,#0f75a8);outline-offset:2px}",
      "html.nova-lite-mode .nva-backdrop{backdrop-filter:none;-webkit-backdrop-filter:none}",
      "html.nova-lite-mode .nva-panel{box-shadow:none}",
      "@media(max-width:620px){.nva-backdrop{padding:0}.nva-panel{width:100%;height:100%;max-height:100%;border:0;border-radius:0}.nva-header{padding-left:16px}.nva-body{padding:15px 16px 20px}.nva-footer{padding:11px 16px}.nva-color-grid,.nva-slider-group{grid-template-columns:1fr}.nva-profile-controls{grid-template-columns:1fr}}",
      "@media(prefers-reduced-motion:reduce){.nva-panel *{scroll-behavior:auto!important;transition:none!important}}",
      "html.nova-advanced-appearance body{background-color:var(--nva-page-bg)!important}",
      "html.nova-advanced-appearance #webSearchContainer,html.nova-advanced-appearance #wikiSummary,html.nova-advanced-appearance #relatedMedia,html.nova-advanced-appearance #timelineContainer{color:var(--nva-text,inherit)!important;border:1px solid var(--nva-border)!important;border-radius:var(--nva-radius)!important;box-shadow:var(--nva-shadow)!important;-webkit-backdrop-filter:blur(var(--nva-blur))!important;backdrop-filter:blur(var(--nva-blur))!important}",
      "html.nova-advanced-custom-surface #webSearchContainer,html.nova-advanced-custom-surface #wikiSummary,html.nova-advanced-custom-surface #relatedMedia,html.nova-advanced-custom-surface #timelineContainer{background:var(--nva-surface)!important}",
      "html.nova-advanced-appearance #urlInput{background:var(--nva-input-bg)!important;color:var(--nva-input-text)!important;border:1px solid var(--nva-border)!important;border-radius:var(--nva-radius)!important}",
      "html.nova-advanced-appearance #urlInput::placeholder{color:var(--nva-muted)!important;opacity:.8}",
      "html.nova-advanced-appearance #webSearchContainer .web-result{border-color:var(--nva-border)!important;border-radius:var(--nva-radius)!important}",
      "html.nova-advanced-appearance .timeline-item,html.nova-advanced-appearance .nova-shortcut-card,html.nova-advanced-appearance .nova-home-bookmark,html.nova-advanced-appearance .nova-bookmark-row{border-radius:var(--nva-radius)!important}",
      "html.nova-advanced-appearance #webSearchContainer a{color:var(--nva-link)!important}",
      "html.nova-advanced-appearance .web-search-note,html.nova-advanced-appearance .web-result-url,html.nova-advanced-appearance .timeline-count{color:var(--nva-muted)!important}",
      "html.nova-advanced-appearance .media-section{border:1px solid var(--nva-border)!important;border-radius:var(--nva-radius)!important}",
      "html.nova-advanced-appearance .media-section img,html.nova-advanced-appearance .media-section video{border-radius:var(--nva-radius)!important;box-shadow:var(--nva-shadow)!important}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function hexWithAlpha(hex, opacity) {
    const match = String(hex || "").match(/^#([0-9a-f]{6})$/i);
    if (!match) return "rgba(16,32,43," + opacity + ")";
    const value = parseInt(match[1], 16);
    return "rgba(" + ((value >> 16) & 255) + "," + ((value >> 8) & 255) + "," + (value & 255) + "," + opacity + ")";
  }

  function applyConfig(config, settingsOverride) {
    const cfg = normalizeConfig(config);
    const theme = currentTheme(settingsOverride);
    const colors = theme.colors;
    const anyCustom = COLOR_KEYS.some(function (key) { return !!cfg[key]; }) ||
      cfg.radius !== DEFAULTS.radius || cfg.blur !== DEFAULTS.blur || cfg.shadow !== DEFAULTS.shadow || cfg.surfaceOpacity !== DEFAULTS.surfaceOpacity;
    const root = document.documentElement;
    const htmlStyle = root.style;

    if (!cfg.pageBg) {
      document.body.style.backgroundColor = colors.bg;
    }
    if (cfg.text) {
      document.body.style.color = cfg.text;
    } else {
      document.body.style.color = basePageText(theme.settings, colors);
    }

    if (!anyCustom) {
      root.classList.remove("nova-advanced-appearance");
      root.classList.remove("nova-advanced-custom-surface");
      ["--nva-page-bg", "--nva-surface", "--nva-text", "--nva-muted", "--nva-border",
       "--nva-input-bg", "--nva-input-text", "--nva-link", "--nva-radius", "--nva-blur", "--nva-shadow"]
        .forEach(function (name) { htmlStyle.removeProperty(name); });
      return;
    }

    root.classList.add("nova-advanced-appearance");
    root.classList.toggle("nova-advanced-custom-surface", !!cfg.surface);
    htmlStyle.setProperty("--nva-page-bg", cfg.pageBg || colors.bg);
    htmlStyle.setProperty("--nva-surface", hexWithAlpha(cfg.surface || colors.surface, (cfg.surfaceOpacity / 100).toFixed(2)));
    htmlStyle.setProperty("--nva-text", cfg.text || basePageText(theme.settings, colors));
    htmlStyle.setProperty("--nva-muted", cfg.muted || colors.muted);
    htmlStyle.setProperty("--nva-border", cfg.border || colors.border);
    htmlStyle.setProperty("--nva-input-bg", cfg.inputBg || "#ffffff");
    htmlStyle.setProperty("--nva-input-text", cfg.inputText || "#173747");
    htmlStyle.setProperty("--nva-link", cfg.linkColor || "#bfeaff");
    htmlStyle.setProperty("--nva-radius", cfg.radius + "px");
    htmlStyle.setProperty("--nva-blur", cfg.blur + "px");
    htmlStyle.setProperty("--nva-shadow", cfg.shadow === 0 ? "none" : "0 8px 25px rgba(0,0,0," + (cfg.shadow / 100).toFixed(2) + ")");
    document.body.style.backgroundColor = cfg.pageBg || colors.bg;
  }

  function makeColorControl(key, title, description) {
    return '<label class="nva-color-row"><span class="nva-color-copy"><b>' + title +
      '</b><small>' + description + '</small></span><input type="color" data-color="' + key +
      '" aria-label="' + title + '"></label>';
  }

  function makeSlider(key, title, min, max, unit, description) {
    return '<div class="nva-slider-card"><div class="nva-slider-head"><b>' + title +
      '</b><output data-output="' + key + '"></output></div><input type="range" data-range="' +
      key + '" min="' + min + '" max="' + max + '" step="1" aria-label="' + title +
      '"><div style="margin-top:5px;color:var(--ns-sub);font-size:10px">' + description + '</div></div>';
  }

  function buildPanel() {
    if (panel) return;
    backdrop = document.createElement("div");
    backdrop.className = "nva-backdrop";
    backdrop.id = "novaAdvancedAppearanceBackdrop";
    backdrop.setAttribute("aria-hidden", "true");

    panel = document.createElement("section");
    panel.className = "nva-panel";
    panel.id = "novaAdvancedAppearancePanel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "nva-title");
    panel.innerHTML =
      '<header class="nva-header"><span class="nva-mark">✳</span><span class="nva-heading"><h2 id="nva-title">Advanced Appearance</h2><p>Fine-tune Nova beyond the standard theme controls.</p></span></header>' +
      '<button type="button" class="nva-close" id="nva-close" aria-label="Close advanced appearance">×</button>' +
      '<div class="nva-body">' +
        '<p class="nva-intro">These settings are for users who want more control. Changes preview live and are saved only when you choose Save changes.</p>' +
        '<div class="nva-section">Color controls</div>' +
        '<div class="nva-color-grid">' +
          makeColorControl("pageBg", "Page background", "Main Nova page behind its content") +
          makeColorControl("surface", "Content surfaces", "Search results, summaries, and panels") +
          makeColorControl("text", "Content text", "Text inside the main content areas") +
          makeColorControl("muted", "Secondary text", "Helper text, URLs, and small details") +
          makeColorControl("border", "Borders", "Outlines around content and search fields") +
          makeColorControl("inputBg", "Search field background", "Fill color of Nova’s search box") +
          makeColorControl("inputText", "Search field text", "Text typed into the search box") +
          makeColorControl("linkColor", "Link color", "Links in Nova’s web search results") +
        '</div>' +
        '<div class="nva-section">Shape and effects</div>' +
        '<div class="nva-slider-group">' +
          makeSlider("radius", "Corner roundness", 0, 28, "px", "0 = square corners · 28 = very rounded") +
          makeSlider("surfaceOpacity", "Surface opacity", 40, 100, "%", "Applies to your custom Content surfaces color") +
          makeSlider("blur", "Background blur", 0, 20, "px", "Controls blur behind content surfaces") +
          makeSlider("shadow", "Shadow strength", 0, 50, "%", "0 removes shadows · 50 gives stronger depth") +
        '</div>' +
        '<div class="nva-section">Theme profiles</div>' +
        '<div class="nva-profile-box"><p>Save your advanced colors and effects as named profiles. Profiles stay in this browser.</p>' +
          '<div class="nva-profile-controls"><input id="nva-profile-name" type="text" maxlength="40" placeholder="Name this profile" aria-label="Theme profile name"><button type="button" class="nva-btn primary" id="nva-profile-save">Save profile</button></div>' +
          '<div class="nva-profile-controls" style="margin-top:8px"><select id="nva-profile-select" aria-label="Saved theme profiles"><option value="">No saved profiles</option></select><button type="button" class="nva-btn" id="nva-profile-load">Load profile</button></div>' +
          '<div class="nva-profile-actions"><button type="button" class="nva-btn danger" id="nva-profile-delete">Delete selected profile</button><button type="button" class="nva-btn" id="nva-reset">Reset advanced controls</button></div>' +
        '</div>' +
      '</div>' +
      '<footer class="nva-footer"><span class="nva-footer-note" id="nva-status" role="status">Live preview · Not saved yet</span><span class="nva-footer-actions"><button type="button" class="nva-btn" id="nva-cancel">Cancel</button><button type="button" class="nva-btn primary" id="nva-apply">Save changes</button></span></footer>';

    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    panel.querySelectorAll("[data-color]").forEach(function (input) {
      input.addEventListener("input", function () {
        draft[input.dataset.color] = input.value.toLowerCase();
        preview();
      });
    });

    panel.querySelectorAll("[data-range]").forEach(function (input) {
      input.addEventListener("input", function () {
        draft[input.dataset.range] = Number(input.value);
        syncOutputs();
        preview();
      });
    });

    panel.querySelector("#nva-profile-save").addEventListener("click", saveProfile);
    panel.querySelector("#nva-profile-load").addEventListener("click", loadProfile);
    panel.querySelector("#nva-profile-delete").addEventListener("click", deleteProfile);
    panel.querySelector("#nva-reset").addEventListener("click", resetDraft);
    panel.querySelector("#nva-apply").addEventListener("click", saveChanges);
    panel.querySelector("#nva-cancel").addEventListener("click", cancel);
    panel.querySelector("#nva-close").addEventListener("click", cancel);
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) cancel();
    });
  }

  function syncOutputs() {
    if (!panel || !draft) return;
    ["radius", "surfaceOpacity", "blur", "shadow"].forEach(function (key) {
      const input = panel.querySelector('[data-range="' + key + '"]');
      const output = panel.querySelector('[data-output="' + key + '"]');
      if (input) input.value = draft[key];
      if (output) output.textContent = draft[key] + (key === "shadow" || key === "surfaceOpacity" ? "%" : "px");
    });
  }

  function syncControls() {
    if (!panel || !draft) return;
    panel.querySelectorAll("[data-color]").forEach(function (input) {
      const key = input.dataset.color;
      input.value = draft[key] || inheritedColor(key);
    });
    syncOutputs();
    refreshProfiles();
  }

  function refreshProfiles() {
    if (!panel) return;
    profiles = readProfiles();
    const select = panel.querySelector("#nva-profile-select");
    const previous = select.value;
    select.innerHTML = "";
    if (!profiles.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No saved profiles";
      select.appendChild(option);
    } else {
      profiles.forEach(function (item, index) {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = item.name;
        select.appendChild(option);
      });
      select.value = previous !== "" && profiles[Number(previous)] ? previous : "0";
    }
    panel.querySelector("#nva-profile-load").disabled = profiles.length === 0;
    panel.querySelector("#nva-profile-delete").disabled = profiles.length === 0;
  }

  function setStatus(message) {
    const status = panel && panel.querySelector("#nva-status");
    if (status) status.textContent = message;
  }

  function preview() {
    applyConfig(draft);
    setStatus("Live preview · Not saved yet");
  }

  function open() {
    buildPanel();
    original = readConfig();
    draft = clone(original);
    syncControls();
    applyConfig(draft);
    backdrop.classList.add("show");
    backdrop.setAttribute("aria-hidden", "false");
    panel.querySelector("#nva-close").focus();
  }

  function closePanel() {
    if (!backdrop) return;
    backdrop.classList.remove("show");
    backdrop.setAttribute("aria-hidden", "true");
  }

  function cancel() {
    if (original) applyConfig(original);
    closePanel();
  }

  function saveChanges() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(normalizeConfig(draft)));
      original = normalizeConfig(draft);
      applyConfig(original);
      setStatus("Changes saved");
      closePanel();
    } catch (error) {
      setStatus("Could not save · Browser storage may be full");
    }
  }

  function resetDraft() {
    draft = normalizeConfig(null);
    syncControls();
    preview();
  }

  function saveProfile() {
    const nameInput = panel.querySelector("#nva-profile-name");
    const name = nameInput.value.trim().slice(0, 40);
    if (!name) {
      setStatus("Enter a name for this profile");
      nameInput.focus();
      return;
    }
    const existing = profiles.findIndex(function (item) { return item.name.toLowerCase() === name.toLowerCase(); });
    if (existing >= 0) {
      profiles[existing] = { name: name, config: normalizeConfig(draft) };
    } else {
      if (profiles.length >= 20) {
        setStatus("You can save up to 20 profiles");
        return;
      }
      profiles.push({ name: name, config: normalizeConfig(draft) });
    }
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      refreshProfiles();
      panel.querySelector("#nva-profile-select").value = String(profiles.findIndex(function (item) {
        return item.name.toLowerCase() === name.toLowerCase();
      }));
      nameInput.value = "";
      setStatus("Profile saved");
    } catch (error) {
      setStatus("Could not save profile · Browser storage may be full");
    }
  }

  function loadProfile() {
    const selected = Number(panel.querySelector("#nva-profile-select").value);
    if (!Number.isInteger(selected) || !profiles[selected]) return;
    draft = clone(profiles[selected].config);
    syncControls();
    preview();
    setStatus("Loaded “" + profiles[selected].name + "” · Save changes to keep it");
  }

  function deleteProfile() {
    const selected = Number(panel.querySelector("#nva-profile-select").value);
    if (!Number.isInteger(selected) || !profiles[selected]) return;
    const name = profiles[selected].name;
    profiles.splice(selected, 1);
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      refreshProfiles();
      setStatus("Deleted “" + name + "”");
    } catch (error) {
      setStatus("Could not update saved profiles");
    }
  }

  function closeOnEscape(event) {
    if (event.key === "Escape" && backdrop && backdrop.classList.contains("show")) {
      event.preventDefault();
      cancel();
    }
  }

  installStyles();
  buildPanel();
  applyConfig(readConfig());
  window.NovaAdvancedAppearance = {
    open: open,
    close: cancel,
    apply: function (settings) { applyConfig(readConfig(), settings); }
  };
  document.addEventListener("keydown", closeOnEscape);
})();