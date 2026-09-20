/* =========================================================
   NOVA SETTINGS — v2.2 "Adaptive UI"
   ========================================================= */
(function () {
  "use strict";

  /* ---------- storage contract (unchanged) ---------- */
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
    showTabs: "novaShowTabs",
    smartUI: "novaSmartUI",
    dynamicAccent: "novaDynamicAccent",
    tactileFeedback: "novaTactileFeedback",
    wallpaperAccent: "novaWallpaperAccent",
    wallpaperLuminance: "novaWallpaperLuminance",
    wallpaperMetaHash: "novaWallpaperMetaHash"
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
    showTabs: true,
    smartUI: true,
    dynamicAccent: true,
    tactileFeedback: true,
    wallpaperAccent: "",
    wallpaperLuminance: null,
    wallpaperMetaHash: ""
  };

  const THEMES = {
    classic: { name: "Classic Blue", bg: "#2596be", text: "#ffffff" },
    dark:    { name: "Midnight",     bg: "#071018", text: "#eaf6ff" },
    light:   { name: "Light",        bg: "#eaf4f8", text: "#10202a" },
    retro:   { name: "Retro",        bg: "#c0c0c0", text: "#000000" }
  };

  /* ---------- panel chrome palettes (drawer only, page themes untouched) ---------- */
  const PANEL = {
    classic: { bg:"#ffffff", surface:"#f4f7fb", hover:"#ebf2f9", text:"#122c40", sub:"#5f7688",
      border:"#e3eaf2", borderSoft:"#eef3f8", borderStrong:"#c9d7e3",
      shadow:"rgba(9,42,70,.30)", shadowSoft:"rgba(9,42,70,.12)",
      footer:"rgba(255,255,255,.86)", switchOff:"#c5d4e0", danger:"#c0392b" },
    dark: { bg:"#0b1520", surface:"#101f2f", hover:"#16293c", text:"#e8f2fb", sub:"#8aa2b5",
      border:"#1d3042", borderSoft:"#16283a", borderStrong:"#2c455c",
      shadow:"rgba(0,0,0,.60)", shadowSoft:"rgba(0,0,0,.35)",
      footer:"rgba(11,21,32,.86)", switchOff:"#24384b", danger:"#ff7b6f" },
    light: { bg:"#ffffff", surface:"#eff5f9", hover:"#e5eef5", text:"#122c40", sub:"#5f7688",
      border:"#e0e9f0", borderSoft:"#ecf2f7", borderStrong:"#c4d4e0",
      shadow:"rgba(9,42,70,.24)", shadowSoft:"rgba(9,42,70,.10)",
      footer:"rgba(255,255,255,.86)", switchOff:"#bfd0dd", danger:"#c0392b" },
    retro: { bg:"#c8c8c8", surface:"#d9d9d9", hover:"#bfbfbf", text:"#101010", sub:"#3d3d3d",
      border:"#7e7e7e", borderSoft:"#adadad", borderStrong:"#5a5a5a",
      shadow:"rgba(0,0,0,.45)", shadowSoft:"rgba(0,0,0,.20)",
      footer:"rgba(200,200,200,.92)", switchOff:"#9c9c9c", danger:"#8b0000" }
  };

  const ACCENT_PRESETS = ["#0f75a8", "#2d9cdb", "#1681b8", "#5a67d8", "#00857a", "#000080"];
  const THEME_ACCENTS  = { classic:"#0f75a8", dark:"#2d9cdb", light:"#1681b8", retro:"#000080" };

  /* ---------- icons (feather-style, stroke = currentColor) ---------- */
  const ICON_PATHS = {
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.3" y2="16.3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.8 5.2a9.4 9.4 0 0 1 0 13.6"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON_PATHS[name] + '</svg>';
  }

  const I = {
    spark: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>'
  };
  Object.keys(ICON_PATHS).forEach(function (n) { I[n] = icon(n); });

  /* ---------- helpers ---------- */
  function bool(key, fallback) {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "true";
  }

  function hexToRgb(hex) {
    let h = String(hex || "").replace("#", "").trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16)
    };
  }

  function relativeLuminance(rgb) {
    if (!rgb) return 0;
    const channels = [rgb.r, rgb.g, rgb.b].map(function (v) {
      const c = Math.max(0, Math.min(255, Number(v) || 0)) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function contrastRatio(a, b) {
    const la = relativeLuminance(hexToRgb(a));
    const lb = relativeLuminance(hexToRgb(b));
    const light = Math.max(la, lb);
    const dark = Math.min(la, lb);
    return (light + 0.05) / (dark + 0.05);
  }

  function readableOn(hex) {
    const candidates = ["#ffffff", "#0f2233"];
    return contrastRatio(hex, candidates[0]) >= contrastRatio(hex, candidates[1])
      ? candidates[0]
      : candidates[1];
  }

  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    }).join("");
  }

  function backgroundSignature(data) {
    const str = String(data || "");
    if (!str) return "";
    return str.length + ":" + str.slice(0, 72) + ":" + str.slice(-72);
  }

  function analyzeWallpaper(dataUrl) {
    return new Promise(function (resolve, reject) {
      if (!dataUrl) {
        reject(new Error("No wallpaper"));
        return;
      }

      const img = new Image();

      img.onload = function () {
        try {
          const canvas = document.createElement("canvas");
          const maxSide = 64;
          const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
          canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
          canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));

          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) throw new Error("Canvas unavailable");

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

          const bins = new Map();
          let luminanceSum = 0;
          let luminanceWeight = 0;

          for (let i = 0; i < pixels.length; i += 16) {
            const alpha = pixels[i + 3] / 255;
            if (alpha < 0.15) continue;

            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            const lum = relativeLuminance({ r: r, g: g, b: b });

            luminanceSum += lum * alpha;
            luminanceWeight += alpha;

            const qr = Math.min(15, Math.floor(r / 16));
            const qg = Math.min(15, Math.floor(g / 16));
            const qb = Math.min(15, Math.floor(b / 16));
            const key = qr + "," + qg + "," + qb;
            const weight = alpha * (0.24 + saturation * 0.76);

            const bin = bins.get(key) || { weight: 0, r: 0, g: 0, b: 0 };
            bin.weight += weight;
            bin.r += r * weight;
            bin.g += g * weight;
            bin.b += b * weight;
            bins.set(key, bin);
          }

          let best = null;
          bins.forEach(function (bin) {
            if (!best || bin.weight > best.weight) best = bin;
          });

          if (!best) {
            best = { r: 15, g: 117, b: 168, weight: 1 };
          }

          const accentR = best.r / best.weight;
          const accentG = best.g / best.weight;
          const accentB = best.b / best.weight;
          const avgLuminance = luminanceWeight ? luminanceSum / luminanceWeight : 0.18;

          const extracted = rgbToHex(accentR, accentG, accentB);
          const extractedLum = relativeLuminance(hexToRgb(extracted));
          let accent = extracted;

          if (extractedLum > 0.88) {
            accent = rgbToHex(accentR * 0.78, accentG * 0.78, accentB * 0.78);
          } else if (extractedLum < 0.04) {
            accent = rgbToHex(accentR + 28, accentG + 28, accentB + 28);
          }

          resolve({ accent: accent, luminance: avgLuminance });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = function () {
        reject(new Error("Unable to read wallpaper"));
      };

      img.src = dataUrl;
    });
  }

  let wallpaperAnalysisInFlight = "";

  function ensureWallpaperMeta(s) {
    if (!s.background) {
      wallpaperAnalysisInFlight = "";
      return;
    }

    const signature = backgroundSignature(s.background);
    if (
      signature &&
      s.wallpaperMetaHash === signature &&
      s.wallpaperAccent &&
      Number.isFinite(s.wallpaperLuminance)
    ) {
      return;
    }

    if (wallpaperAnalysisInFlight === signature) return;
    wallpaperAnalysisInFlight = signature;

    analyzeWallpaper(s.background).then(function (meta) {
      const latest = loadSettings();
      if (!latest.background || backgroundSignature(latest.background) !== signature) {
        wallpaperAnalysisInFlight = "";
        return;
      }

      latest.wallpaperAccent = meta.accent;
      latest.wallpaperLuminance = meta.luminance;
      latest.wallpaperMetaHash = signature;
      saveSettings(latest);
      wallpaperAnalysisInFlight = "";
      applySettings(latest);
    }).catch(function () {
      wallpaperAnalysisInFlight = "";
    });
  }

  function effectiveAccent(s) {
    if (s.smartUI && s.dynamicAccent && s.background && s.wallpaperAccent) {
      return s.wallpaperAccent;
    }
    return s.accent;
  }

  function effectivePageText(s, theme) {
    if (s.smartUI && s.background && Number.isFinite(s.wallpaperLuminance)) {
      return s.wallpaperLuminance >= 0.56 ? "#0f2233" : "#ffffff";
    }
    return s.smartUI ? readableOn(theme.bg) : theme.text;
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
      showTabs: bool(STORAGE.showTabs, DEFAULTS.showTabs),
      smartUI: bool(STORAGE.smartUI, DEFAULTS.smartUI),
      dynamicAccent: bool(STORAGE.dynamicAccent, DEFAULTS.dynamicAccent),
      tactileFeedback: bool(STORAGE.tactileFeedback, DEFAULTS.tactileFeedback),
      wallpaperAccent: localStorage.getItem(STORAGE.wallpaperAccent) || DEFAULTS.wallpaperAccent,
      wallpaperLuminance: Number.isFinite(Number(localStorage.getItem(STORAGE.wallpaperLuminance)))
        ? Number(localStorage.getItem(STORAGE.wallpaperLuminance))
        : DEFAULTS.wallpaperLuminance,
      wallpaperMetaHash: localStorage.getItem(STORAGE.wallpaperMetaHash) || DEFAULTS.wallpaperMetaHash
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
    localStorage.setItem(STORAGE.smartUI, String(!!s.smartUI));
    localStorage.setItem(STORAGE.dynamicAccent, String(!!s.dynamicAccent));
    localStorage.setItem(STORAGE.tactileFeedback, String(!!s.tactileFeedback));
    if (s.background) localStorage.setItem(STORAGE.background, s.background);
    else localStorage.removeItem(STORAGE.background);

    if (s.wallpaperAccent) localStorage.setItem(STORAGE.wallpaperAccent, s.wallpaperAccent);
    else localStorage.removeItem(STORAGE.wallpaperAccent);

    if (Number.isFinite(s.wallpaperLuminance)) localStorage.setItem(STORAGE.wallpaperLuminance, String(s.wallpaperLuminance));
    else localStorage.removeItem(STORAGE.wallpaperLuminance);

    if (s.wallpaperMetaHash) localStorage.setItem(STORAGE.wallpaperMetaHash, s.wallpaperMetaHash);
    else localStorage.removeItem(STORAGE.wallpaperMetaHash);
  }

  /* ---------- injected design system ---------- */
  function installStyles() {
    if (document.getElementById("nova-settings-overrides")) return;

    const style = document.createElement("style");
    style.id = "nova-settings-overrides";
    style.textContent = `
/* ===== legacy page overrides (kept) ===== */
:root{
  --nova-accent:#0f75a8;
  --nova-accent-light:#a8d0e6;
  --nova-on-accent:#ffffff;
  --nova-page-text:#ffffff;
  --nova-input-text:#122c40;
}
#openBtn,#novaSettingsButton,#novaNewTab{background:var(--nova-accent)!important;}
.nova-tab.active,.suggestions div:hover,.suggestions .highlighted{background:var(--nova-accent)!important;}
input#urlInput:focus{
  outline:none!important;
  box-shadow:0 0 0 3px var(--ns-focus-ring,rgba(15,117,168,.35)),0 0 18px var(--nova-accent-light)!important;
  transition:box-shadow .26s ease!important;
}
input#urlInput{color:var(--nova-input-text)!important;caret-color:var(--nova-accent)!important;}
input#urlInput::placeholder{color:var(--nova-input-text)!important;opacity:.56;}
#openBtn,#novaSettingsButton,#novaNewTab{color:var(--nova-on-accent)!important;}
.nova-tab.active{color:var(--nova-on-accent)!important;}
body{color:var(--nova-page-text)!important;transition:background-color .34s ease,color .24s ease;}
.nova-tactile-target{touch-action:manipulation;}
.nova-tactile-pulse{animation:novaTactilePulse .18s ease-out;}
.nova-search-focus{animation:novaSearchFocus .36s ease-out;}
.ns-row.is-disabled{opacity:.44;cursor:default;}
.ns-row.is-disabled .ns-switch{pointer-events:none;}
@keyframes novaTactilePulse{
  0%{transform:scale(1);}
  45%{transform:scale(.975);}
  100%{transform:scale(1);}
}
@keyframes novaSearchFocus{
  0%{filter:brightness(1);}
  45%{filter:brightness(1.06);}
  100%{filter:brightness(1);}
}
html.nova-no-motion .nova-tactile-pulse,html.nova-no-motion .nova-search-focus{animation:none!important;}
html.nova-no-motion *,html.nova-no-motion *::before,html.nova-no-motion *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}
html.nova-compact body{margin-top:16px!important;margin-bottom:16px!important;}
html.nova-compact #wikiSummary,html.nova-compact #relatedMedia{padding:12px!important;}
html.nova-compact .media-section img,html.nova-compact .media-section video{width:120px!important;height:84px!important;}
html.nova-high-contrast #wikiSummary,html.nova-high-contrast #relatedMedia,html.nova-high-contrast #dictionaryContainer,html.nova-high-contrast #timelineContainer{border:2px solid currentColor!important;}
html.nova-no-tabs #novaTabsBar{display:none!important;}

/* ===== settings drawer chrome ===== */
#novaSettingsBackdrop{
  position:fixed;inset:0;z-index:2147483000;
  background:rgba(6,20,34,.44);
  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
  opacity:0;pointer-events:none;transition:opacity .4s ease;
}
#novaSettingsBackdrop.show{opacity:1;pointer-events:auto;}

#novaSettingsPanel{
  position:fixed!important;top:12px!important;right:12px!important;bottom:12px!important;left:auto!important;
  height:auto!important;max-height:none!important;width:min(432px,calc(100vw - 24px))!important;
  margin:0!important;padding:0!important;
  border-radius:var(--ns-panel-radius,20px)!important;border:1px solid var(--ns-border,#e3eaf2)!important;
  background:var(--ns-bg,#fff)!important;color:var(--ns-text,#122c40)!important;
  box-shadow:0 24px 70px var(--ns-shadow,rgba(9,42,70,.3))!important;
  display:flex!important;flex-direction:column!important;overflow:hidden!important;
  transform:translateX(calc(100% + 48px));
  transition:transform .5s cubic-bezier(.22,1,.36,1);
  z-index:2147483001!important;opacity:1!important;visibility:visible!important;
  color-scheme:var(--ns-scheme,light);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;
  -webkit-font-smoothing:antialiased;
}
#novaSettingsPanel.show{transform:translateX(0)!important;}

#novaSettingsContent{flex:1 1 auto;min-height:0;display:flex;padding:0!important;margin:0!important;background:transparent!important;}

#novaSettingsClose{
  position:absolute!important;top:14px!important;right:14px!important;
  width:34px!important;height:34px!important;min-width:0!important;padding:0!important;margin:0!important;
  border-radius:50%!important;border:1px solid var(--ns-border,#e3eaf2)!important;
  background:var(--ns-surface,#f4f7fb)!important;color:var(--ns-sub,#5f7688)!important;
  font-size:15px!important;line-height:1!important;cursor:pointer;
  display:grid!important;place-items:center!important;
  transition:color .2s ease,border-color .2s ease,transform .3s ease;
}
#novaSettingsClose:hover{color:var(--ns-text)!important;border-color:var(--ns-border-strong)!important;transform:scale(1.1);}

/* ===== layout ===== */
.nova-settings{flex:1;min-width:0;display:flex;flex-direction:column;font-size:14px;}
.nova-settings *,.nova-settings *::before,.nova-settings *::after{box-sizing:border-box;}
.nova-settings h2{margin:0;}
.nova-settings button{font-family:inherit;}

.ns-header{flex:none;display:flex;align-items:center;gap:12px;padding:18px 52px 14px 20px;border-bottom:1px solid var(--ns-border-soft);}
.ns-logo{width:38px;height:38px;flex:none;border-radius:12px;background:var(--nova-accent);color:var(--ns-on-accent);display:grid;place-items:center;box-shadow:0 6px 16px var(--ns-shadow-soft);}
.ns-logo svg{width:19px;height:19px;}
.ns-heading{min-width:0;}
.ns-heading h2{font-size:16.5px;font-weight:700;letter-spacing:-.01em;}
.ns-heading p{margin:1px 0 0;font-size:12px;color:var(--ns-sub);}
.ns-version{margin-left:auto;flex:none;font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--ns-sub);border:1px solid var(--ns-border);background:var(--ns-surface);padding:3px 8px;border-radius:999px;}

.ns-body{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:4px 20px 24px;scrollbar-width:thin;scrollbar-color:var(--ns-border-strong) transparent;}
.ns-body::-webkit-scrollbar{width:10px;}
.ns-body::-webkit-scrollbar-thumb{background:var(--ns-border-strong);border-radius:8px;border:3px solid var(--ns-bg);}
.ns-body::-webkit-scrollbar-track{background:transparent;}

@keyframes nsRise{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
#novaSettingsPanel.show .ns-body > *{animation:nsRise .5s cubic-bezier(.22,1,.36,1) both;}
#novaSettingsPanel.show .ns-body > *:nth-child(2){animation-delay:.05s}
#novaSettingsPanel.show .ns-body > *:nth-child(3){animation-delay:.09s}
#novaSettingsPanel.show .ns-body > *:nth-child(4){animation-delay:.13s}
#novaSettingsPanel.show .ns-body > *:nth-child(5){animation-delay:.17s}
#novaSettingsPanel.show .ns-body > *:nth-child(6){animation-delay:.21s}
#novaSettingsPanel.show .ns-body > *:nth-child(7){animation-delay:.25s}
#novaSettingsPanel.show .ns-body > *:nth-child(8){animation-delay:.29s}
#novaSettingsPanel.show .ns-body > *:nth-child(9){animation-delay:.33s}
#novaSettingsPanel.show .ns-body > *:nth-child(10){animation-delay:.37s}
#novaSettingsPanel.show .ns-body > *:nth-child(11){animation-delay:.41s}
#novaSettingsPanel.show .ns-body > *:nth-child(12){animation-delay:.45s}
#novaSettingsPanel.show .ns-body > *:nth-child(13){animation-delay:.49s}
#novaSettingsPanel.show .ns-body > *:nth-child(14){animation-delay:.53s}

.ns-section-title{display:flex;align-items:center;gap:7px;margin:20px 2px 9px;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ns-sub);}
.nova-settings .ns-section-title:first-child{margin-top:12px;}
.ns-section-title svg{width:13px;height:13px;flex:none;}

/* ===== theme cards ===== */
.ns-themes{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.ns-theme-card{appearance:none;border:1px solid var(--ns-border);background:var(--ns-surface);border-radius:var(--ns-card-radius,14px);padding:7px 7px 8px;cursor:pointer;display:flex;flex-direction:column;gap:7px;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease;}
.ns-theme-card:hover{transform:translateY(-2px);box-shadow:0 8px 18px var(--ns-shadow-soft);}
.ns-theme-card.is-active{border-color:var(--nova-accent);box-shadow:0 0 0 2px var(--ns-focus-ring);}
.ns-theme-preview{position:relative;height:46px;border-radius:9px;background:var(--tc-bg);border:1px solid rgba(0,0,0,.15);display:flex;flex-direction:column;justify-content:center;gap:5px;padding:0 10px;overflow:hidden;}
.ns-theme-line{height:4px;border-radius:99px;background:var(--tc-fg);opacity:.9;width:85%;}
.ns-theme-line.short{width:55%;opacity:.45;}
.ns-theme-dot{position:absolute;top:7px;right:7px;width:9px;height:9px;border-radius:50%;background:var(--tc-accent);box-shadow:0 0 0 1.5px rgba(255,255,255,.35);}
.ns-theme-name{font-size:10.5px;font-weight:700;color:var(--ns-sub);text-align:center;letter-spacing:.02em;}
.ns-theme-card.is-active .ns-theme-name{color:var(--nova-accent);}

/* ===== cards / groups / rows ===== */
.ns-duo{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px;}
.ns-card{background:var(--ns-surface);border:1px solid var(--ns-border);border-radius:var(--ns-card-radius,14px);padding:12px 13px 13px;min-width:0;}
.ns-card-label{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--ns-sub);}

.ns-group{background:var(--ns-surface);border:1px solid var(--ns-border);border-radius:var(--ns-card-radius,14px);overflow:hidden;}
.ns-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:11px 14px;cursor:pointer;transition:background .16s ease;}
.ns-row:hover{background:var(--ns-hover);}
.ns-row + .ns-row{border-top:1px solid var(--ns-border-soft);}
.ns-row-text{display:flex;flex-direction:column;gap:1px;min-width:0;}
.ns-row-title{font-size:13.5px;font-weight:600;}
.ns-row-desc{font-size:11.5px;color:var(--ns-sub);line-height:1.35;}

/* ===== switch ===== */
.ns-switch{position:relative;flex:none;width:40px;height:22px;}
.ns-switch input{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:pointer;}
.ns-switch i{position:absolute;inset:0;border-radius:999px;background:var(--ns-switch-off);transition:background .22s ease;pointer-events:none;}
.ns-switch i::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .25s cubic-bezier(.22,1,.36,1);}
.ns-switch input:checked + i{background:var(--nova-accent);}
.ns-switch input:checked + i::after{transform:translateX(18px);}
.ns-switch input:focus-visible + i{box-shadow:0 0 0 3px var(--ns-focus-ring);}

/* ===== accent swatches ===== */
.ns-accents{display:flex;align-items:center;gap:7px;margin-top:11px;flex-wrap:wrap;}
.ns-swatch{position:relative;width:24px;height:24px;flex:none;border-radius:50%;border:none;padding:0;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.14);transition:transform .16s ease,box-shadow .16s ease;}
.ns-swatch:hover{transform:scale(1.14);}
.ns-swatch.is-active{box-shadow:0 0 0 2px var(--ns-bg),0 0 0 4px var(--nova-accent);}
.ns-swatch-custom{display:grid;place-items:center;background:var(--nova-accent);}
.ns-swatch-custom svg{width:11px;height:11px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.35));}
.ns-swatch-custom input{position:absolute;inset:0;opacity:0;cursor:pointer;}

/* ===== font slider ===== */
.ns-font-row{display:flex;align-items:center;gap:10px;margin-top:11px;}
.ns-font-aa{flex:none;width:34px;height:34px;border-radius:10px;background:var(--nova-accent);color:var(--ns-on-accent);display:grid;place-items:center;font-weight:700;transition:font-size .15s ease;}
.ns-slider{flex:1;display:flex;flex-direction:column;gap:7px;min-width:0;}
.ns-slider input[type="range"]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:99px;background:linear-gradient(to right,var(--nova-accent) var(--fill,40%),var(--ns-border-strong) var(--fill,40%));outline:none;cursor:pointer;}
.ns-slider input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--nova-accent);box-shadow:0 1px 4px rgba(0,0,0,.3);transition:transform .15s ease;}
.ns-slider input[type="range"]::-webkit-slider-thumb:hover{transform:scale(1.15);}
.ns-slider input[type="range"]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid var(--nova-accent);box-shadow:0 1px 4px rgba(0,0,0,.3);}
.ns-slider-meta{display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:var(--ns-sub);font-variant-numeric:tabular-nums;}
.ns-slider-meta b{color:var(--ns-text);font-weight:700;}

/* ===== background uploader ===== */
.ns-bg-drop{margin-top:9px;display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:var(--ns-card-radius,14px);border:1.5px dashed var(--ns-border-strong);background:var(--ns-surface);cursor:pointer;transition:border-color .2s ease,background .2s ease;}
.ns-bg-drop:hover{border-color:var(--nova-accent);background:var(--ns-hover);}
.ns-bg-icon{flex:none;width:34px;height:34px;border-radius:10px;background:var(--ns-hover);color:var(--nova-accent);display:grid;place-items:center;}
.ns-bg-icon svg{width:17px;height:17px;}
.ns-bg-texts{display:flex;flex-direction:column;min-width:0;}
.ns-bg-title{font-size:13px;font-weight:600;}
.ns-bg-sub{font-size:11.5px;color:var(--ns-sub);}
.ns-bg-active{margin-top:9px;display:flex;align-items:center;gap:12px;padding:10px;border-radius:var(--ns-card-radius,14px);border:1px solid var(--ns-border);background:var(--ns-surface);}
.ns-bg-active[hidden]{display:none!important;}
.ns-bg-active img{width:74px;height:46px;object-fit:cover;border-radius:9px;border:1px solid var(--ns-border-strong);flex:none;}
.ns-bg-active-info{display:flex;flex-direction:column;gap:7px;min-width:0;}

/* ===== buttons ===== */
.ns-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 14px;border-radius:10px;border:1px solid var(--ns-border);background:var(--ns-surface);color:var(--ns-text);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:transform .16s ease,box-shadow .16s ease,background .16s ease,border-color .16s ease,color .16s ease;}
.ns-btn svg{width:14px;height:14px;flex:none;}
.ns-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px var(--ns-shadow-soft);border-color:var(--ns-border-strong);}
.ns-btn:active{transform:translateY(0);box-shadow:none;}
.ns-btn.primary{background:var(--nova-accent);border-color:transparent;color:var(--ns-on-accent);}
.ns-btn.primary:hover{box-shadow:0 6px 18px var(--ns-focus-ring);}
.ns-btn.quiet{background:transparent;border-color:transparent;color:var(--ns-sub);}
.ns-btn.quiet:hover{color:var(--ns-danger);background:var(--ns-hover);border-color:transparent;box-shadow:none;}
.ns-btn.block{width:100%;justify-content:flex-start;}

/* ===== data & privacy ===== */
.ns-note{margin:0 2px 10px;font-size:11.5px;color:var(--ns-sub);line-height:1.45;}
.ns-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.ns-storage{margin-top:12px;padding:12px 14px;border-radius:var(--ns-card-radius,14px);background:var(--ns-surface);border:1px solid var(--ns-border);}
.ns-storage-bar{height:5px;border-radius:99px;background:var(--ns-border);overflow:hidden;}
.ns-storage-bar i{display:block;height:100%;width:0%;border-radius:99px;background:var(--nova-accent);transition:width .5s cubic-bezier(.22,1,.36,1);}
.ns-storage-text{margin-top:7px;font-size:11.5px;color:var(--ns-sub);font-variant-numeric:tabular-nums;}

/* ===== footer + toast ===== */
.ns-footer{flex:none;display:flex;align-items:center;gap:10px;padding:13px 20px calc(13px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--ns-border);background:var(--ns-footer);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
.ns-status{position:absolute;right:18px;bottom:78px;max-width:75%;padding:9px 15px;border-radius:999px;background:var(--ns-text);color:var(--ns-bg);font-size:12.5px;font-weight:600;box-shadow:0 10px 30px var(--ns-shadow);opacity:0;transform:translateY(8px) scale(.96);pointer-events:none;transition:opacity .3s ease,transform .3s cubic-bezier(.22,1,.36,1);z-index:5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ns-status.visible{opacity:1;transform:none;}

.nova-settings :focus-visible,#novaSettingsClose:focus-visible{outline:2px solid var(--nova-accent);outline-offset:2px;}
html.nova-high-contrast .ns-group,html.nova-high-contrast .ns-card{border-width:1.5px;}

@media (max-width:520px){
  #novaSettingsPanel{top:0!important;right:0!important;bottom:0!important;left:0!important;width:100vw!important;border-radius:0!important;border:none!important;transform:translateX(100%);}
}
@media (prefers-reduced-motion:reduce){
  #novaSettingsPanel,#novaSettingsBackdrop,.ns-status{transition:none!important;}
  #novaSettingsPanel.show .ns-body > *{animation:none!important;}
}`;
    document.head.appendChild(style);
  }

  /* ---------- tactile feedback ---------- */
  function playTactileTone(kind) {
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = window.__novaTactileAudioContext || (window.__novaTactileAudioContext = new AudioContextCtor());
      if (ctx.state === "suspended" && ctx.resume) ctx.resume().catch(function () {});

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(kind === "focus" ? 560 : 300, now);
      osc.frequency.exponentialRampToValueAtTime(kind === "focus" ? 720 : 240, now + 0.07);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(kind === "focus" ? 0.022 : 0.014, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.105);
    } catch (err) {}
  }

  function tactilePulse(element, kind) {
    const s = loadSettings();
    if (!s.tactileFeedback || !element || element.disabled) return;

    element.classList.remove("nova-tactile-pulse");
    if (s.animations) {
      void element.offsetWidth;
      element.classList.add("nova-tactile-pulse");
      setTimeout(function () { element.classList.remove("nova-tactile-pulse"); }, 220);
    }

    if (navigator.vibrate && kind !== "focus") {
      try { navigator.vibrate(kind === "strong" ? 10 : 6); } catch (err) {}
    }

    playTactileTone(kind);
  }

  function installTactileFeedback() {
    if (window.__novaTactileInstalled) return;

    document.addEventListener("pointerdown", function (event) {
      if (!event.isTrusted) return;
      const target = event.target && event.target.closest
        ? event.target.closest("button,.ns-row,.ns-swatch,.ns-bg-drop,.nova-tab,#urlInput")
        : null;
      if (!target || target.id === "urlInput" || target.disabled) return;
      target.classList.add("nova-tactile-target");
      tactilePulse(target, "tap");
    }, true);

    document.addEventListener("focusin", function (event) {
      if (!event.isTrusted) return;
      const target = event.target;
      if (!target || target.id !== "urlInput") return;
      target.classList.add("nova-tactile-target", "nova-search-focus");
      const s = loadSettings();
      if (s.tactileFeedback) {
        if (navigator.vibrate) {
          try { navigator.vibrate(4); } catch (err) {}
        }
        playTactileTone("focus");
      }
    }, true);

    document.addEventListener("focusout", function (event) {
      const target = event.target;
      if (target && target.id === "urlInput") {
        target.classList.remove("nova-search-focus");
      }
    }, true);

    document.addEventListener("keydown", function (event) {
      if (!event.isTrusted || (event.key !== "Enter" && event.key !== " ")) return;
      const target = event.target && event.target.closest
        ? event.target.closest("button,.ns-row,.ns-swatch,.ns-bg-drop,.nova-tab")
        : null;
      if (!target || target.disabled) return;
      tactilePulse(target, "tap");
    }, true);

    window.__novaTactileInstalled = true;
  }

  /* ---------- apply settings ----------
  function applySettings(s) {
    installStyles();
    installTactileFeedback();

    const theme = THEMES[s.theme] || THEMES.classic;
    const pal = PANEL[s.theme] || PANEL.classic;
    const rs = document.documentElement.style;
    const accent = effectiveAccent(s);
    const pageText = effectivePageText(s, theme);

    rs.setProperty("--nova-accent", accent);
    rs.setProperty("--nova-accent-light", accent + "66");
    rs.setProperty("--nova-on-accent", readableOn(accent));
    rs.setProperty("--nova-page-text", pageText);
    rs.setProperty("--nova-input-text", readableOn("#ffffff"));
    rs.setProperty("--ns-on-accent", readableOn(accent));
    rs.setProperty("--ns-focus-ring", accent + "55");
    rs.setProperty("--ns-scheme", s.theme === "dark" ? "dark" : "light");
    rs.setProperty("--ns-panel-radius", s.theme === "retro" ? "6px" : "20px");
    rs.setProperty("--ns-card-radius", s.theme === "retro" ? "6px" : "14px");

    rs.setProperty("--ns-bg", pal.bg);
    rs.setProperty("--ns-surface", pal.surface);
    rs.setProperty("--ns-hover", pal.hover);
    rs.setProperty("--ns-text", pal.text);
    rs.setProperty("--ns-sub", pal.sub);
    rs.setProperty("--ns-border", pal.border);
    rs.setProperty("--ns-border-soft", pal.borderSoft);
    rs.setProperty("--ns-border-strong", pal.borderStrong);
    rs.setProperty("--ns-shadow", pal.shadow);
    rs.setProperty("--ns-shadow-soft", pal.shadowSoft);
    rs.setProperty("--ns-footer", pal.footer);
    rs.setProperty("--ns-switch-off", pal.switchOff);
    rs.setProperty("--ns-danger", pal.danger);

    document.documentElement.style.fontSize = s.fontSize + "px";
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = pageText;

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
    document.documentElement.classList.toggle("nova-no-tactile", !s.tactileFeedback);
    document.body.style.scrollBehavior = s.smoothScroll ? "smooth" : "auto";

    const tabs = document.getElementById("novaTabsBar");
    if (tabs) tabs.style.display = s.showTabs ? "" : "none";

    if (s.background) ensureWallpaperMeta(s);
  }

  /* ---------- data helpers (unchanged) ---------- */
  function clearHistory() { localStorage.removeItem("nova_history"); }

  function clearSuggestionCache() {
    Object.keys(localStorage).filter(function (k) { return k.indexOf("wiki_suggest_") === 0; })
      .forEach(function (k) { localStorage.removeItem(k); });
    Object.keys(sessionStorage).filter(function (k) { return k.indexOf("wiki_suggest_") === 0; })
      .forEach(function (k) { sessionStorage.removeItem(k); });
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
      novaBackupVersion: 3,
      exportedAt: new Date().toISOString(),
      settings: loadSettings(),
      history: JSON.parse(localStorage.getItem("nova_history") || "[]")
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "nova-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importBackup(file, notify) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || ""));
        const incoming = data.settings || data;

        if (incoming.theme && THEMES[incoming.theme]) localStorage.setItem(STORAGE.theme, incoming.theme);
        if (incoming.accent) localStorage.setItem(STORAGE.accent, incoming.accent);
        if (typeof incoming.background === "string") localStorage.setItem(STORAGE.background, incoming.background);
        if (Number.isFinite(Number(incoming.fontSize))) localStorage.setItem(STORAGE.fontSize, String(incoming.fontSize));

        if (incoming.wallpaperAccent) localStorage.setItem(STORAGE.wallpaperAccent, incoming.wallpaperAccent);
        if (Number.isFinite(Number(incoming.wallpaperLuminance))) localStorage.setItem(STORAGE.wallpaperLuminance, String(incoming.wallpaperLuminance));
        if (incoming.wallpaperMetaHash) localStorage.setItem(STORAGE.wallpaperMetaHash, incoming.wallpaperMetaHash);

        ["audioPreview","animations","compact","highContrast","suggestions","webResults",
         "autoFocus","openLinksNewTab","saveHistory","restoreSearch","smoothScroll","showTabs",
         "smartUI","dynamicAccent","tactileFeedback"
        ].forEach(function (key) {
          if (typeof incoming[key] === "boolean") localStorage.setItem(STORAGE[key], String(incoming[key]));
        });

        if (Array.isArray(data.history)) localStorage.setItem("nova_history", JSON.stringify(data.history));

        notify("Backup imported — reloading…");
        setTimeout(function () { location.reload(); }, 800);
      } catch (err) {
        notify("Invalid Nova backup.");
      }
    };
    reader.readAsText(file);
  }

  function resetEverything(notify) {
    if (!confirm("Reset Nova settings, history, and local preferences?")) return;
    localStorage.clear();
    sessionStorage.clear();
    notify("Everything cleared — reloading…");
    setTimeout(function () { location.reload(); }, 800);
  }

  /* ---------- render ---------- */
  function rowHTML(id, title, desc) {
    return '<label class="ns-row">' +
      '<span class="ns-row-text"><span class="ns-row-title">' + title + '</span>' +
      (desc ? '<span class="ns-row-desc">' + desc + '</span>' : '') +
      '</span><span class="ns-switch"><input type="checkbox" id="' + id + '"><i></i></span></label>';
  }

  function themeCardHTML(key) {
    const t = THEMES[key];
    return '<button type="button" class="ns-theme-card" data-theme="' + key + '" ' +
      'style="--tc-bg:' + t.bg + ';--tc-fg:' + t.text + ';--tc-accent:' + THEME_ACCENTS[key] + '">' +
      '<span class="ns-theme-preview"><span class="ns-theme-dot"></span><span class="ns-theme-line"></span><span class="ns-theme-line short"></span></span>' +
      '<span class="ns-theme-name">' + t.name + '</span></button>';
  }

  function renderSettings(container) {
    if (!container) return;

    const s = loadSettings();

    container.innerHTML = `
<div class="nova-settings">
  <header class="ns-header">
    <span class="ns-logo">${I.spark}</span>
    <span class="ns-heading">
      <h2>Nova Settings</h2>
      <p>Made by Dylan.H&nbsp;:3</p>
    </span>
    <span class="ns-version">V2.2</span>
  </header>

  <div class="ns-body">
    <div class="ns-section-title">${I.sliders} Appearance</div>
    <div class="ns-themes">${["classic","dark","light","retro"].map(themeCardHTML).join("")}</div>

    <div class="ns-duo">
      <div class="ns-card">
        <div class="ns-card-label">Accent</div>
        <div class="ns-accents" id="ns-accents"></div>
      </div>
      <div class="ns-card">
        <div class="ns-card-label">Font size</div>
        <div class="ns-font-row">
          <span class="ns-font-aa" id="ns-font-aa">Aa</span>
          <span class="ns-slider">
            <input type="range" id="ns-font" min="10" max="48" step="1">
            <span class="ns-slider-meta"><span>10</span><b id="ns-font-val"></b><span>48</span></span>
          </span>
        </div>
      </div>
    </div>

    <label class="ns-bg-drop" id="ns-bg-drop">
      <input type="file" id="ns-bg-file" accept="image/*" hidden>
      <span class="ns-bg-icon">${I.image}</span>
      <span class="ns-bg-texts">
        <span class="ns-bg-title" id="ns-bg-title">Add a background image</span>
        <span class="ns-bg-sub">Stored locally — never uploaded</span>
      </span>
    </label>

    <div class="ns-bg-active" id="ns-bg-active" hidden>
      <img id="ns-bg-img" alt="Current background">
      <span class="ns-bg-active-info">
        <span class="ns-row-title">Custom background</span>
        <span><button type="button" class="ns-btn" id="ns-clear-bg">${I.trash} Remove</button></span>
      </span>
    </div>

    <div class="ns-section-title">${I.spark} Smart UI</div>
    <div class="ns-group">
      ${rowHTML("ns-smart-ui", "Smart UI", "Automatically adapt text contrast and visual colors")}
      ${rowHTML("ns-dynamic-accent", "Dynamic wallpaper accents", "Match Nova's accent to your background image")}
      ${rowHTML("ns-tactile", "Tactile feedback", "Glow, click sound, and touch feedback")}
    </div>

    <div class="ns-group" style="margin-top:9px">
      ${rowHTML("ns-compact", "Compact mode", "Tighter spacing and smaller media")}
      ${rowHTML("ns-motion", "Animations & effects", "Transitions across the interface")}
      ${rowHTML("ns-contrast", "High contrast", "Bolder borders for readability")}
    </div>

    <div class="ns-section-title">${I.search} Search &amp; behavior</div>
    <div class="ns-group">
      ${rowHTML("ns-suggestions", "Search suggestions", "Wikipedia suggestions while you type")}
      ${rowHTML("ns-web-results", "Web search results", "Show matching links from the web")}
      ${rowHTML("ns-autofocus", "Focus search on startup", "Cursor ready in the search box")}
      ${rowHTML("ns-newtab", "Open sites in a new tab", "Keep Nova running in this tab")}
      ${rowHTML("ns-lastsearch", "Remember last search", "Restore your previous query")}
      ${rowHTML("ns-history", "Save search history", "Keep a local list of searches")}
      ${rowHTML("ns-smooth", "Smooth scrolling", "Animated page scrolling")}
      ${rowHTML("ns-tabs", "Show tab bar", "Display the Nova tab strip")}
    </div>

    <div class="ns-section-title">${I.shield} Data &amp; privacy</div>
    <p class="ns-note">Everything stays on this device — preferences, history, and backups never leave your browser.</p>
    <div class="ns-actions">
      <button type="button" class="ns-btn block" id="ns-clear-history">${I.trash} Clear history</button>
      <button type="button" class="ns-btn block" id="ns-clear-cache">${I.eraser} Clear cache</button>
      <button type="button" class="ns-btn block" id="ns-backup">${I.download} Export backup</button>
      <button type="button" class="ns-btn block" id="ns-import-btn">${I.upload} Import backup</button>
      <input type="file" id="ns-import" accept="application/json,.json" hidden>
    </div>
    <div class="ns-storage">
      <div class="ns-storage-bar"><i id="ns-storage-fill"></i></div>
      <div class="ns-storage-text" id="ns-storage"></div>
    </div>

    <div class="ns-section-title">${I.volume} Audio</div>
    <div class="ns-group">
      ${rowHTML("ns-audio", "Audio previews", "Play samples directly from results")}
    </div>
    <div style="height:6px"></div>
  </div>

  <footer class="ns-footer">
    <button type="button" class="ns-btn primary" id="ns-save">${I.check} Save settings</button>
    <button type="button" class="ns-btn quiet" id="ns-reset">${I.undo} Reset</button>
  </footer>

  <span class="ns-status" id="ns-status" role="status" aria-live="polite"></span>
</div>`;

    const q = function (sel) { return container.querySelector(sel); };
    const qa = function (sel) { return container.querySelectorAll(sel); };

    const font = q("#ns-font");
    const status = q("#ns-status");
    const storage = q("#ns-storage");
    const bgFile = q("#ns-bg-file");
    const bgTitle = q("#ns-bg-title");
    const bgActive = q("#ns-bg-active");
    const bgImg = q("#ns-bg-img");
    const clearBg = q("#ns-clear-bg");
    const save = q("#ns-save");
    const reset = q("#ns-reset");

    /* --- toast --- */
    let statusTimer = null;
    function msg(text) {
      status.textContent = text;
      status.classList.add("visible");
      if (statusTimer) clearTimeout(statusTimer);
      statusTimer = setTimeout(function () { status.classList.remove("visible"); }, 1800);
    }

    /* --- accent swatches --- */
    const accentsWrap = q("#ns-accents");
    accentsWrap.innerHTML =
      ACCENT_PRESETS.map(function (c) {
        return '<button type="button" class="ns-swatch" data-color="' + c + '" style="background:' + c + '" aria-label="Accent ' + c + '"></button>';
      }).join("") +
      '<label class="ns-swatch ns-swatch-custom" title="Custom color">' +
      '<input type="color" id="ns-accent" value="' + s.accent + '">' + I.plus + '</label>';

    const accentInput = q("#ns-accent");

    function refreshAccentsUI() {
      const lower = String(s.accent).toLowerCase();
      let presetHit = false;
      qa(".ns-swatch[data-color]").forEach(function (sw) {
        const hit = sw.dataset.color.toLowerCase() === lower;
        if (hit) presetHit = true;
        sw.classList.toggle("is-active", hit);
      });
      const custom = q(".ns-swatch-custom");
      if (custom) {
        custom.classList.toggle("is-active", !presetHit);
        custom.style.background = s.accent;
        custom.style.color = readableOn(s.accent);
        if (accentInput && accentInput.value.toLowerCase() !== lower) accentInput.value = s.accent;
      }
    }
    refreshAccentsUI();

    /* --- font slider --- */
    function syncFont() {
      const v = s.fontSize;
      font.style.setProperty("--fill", ((v - 10) / 38 * 100) + "%");
      q("#ns-font-val").textContent = v + "px";
      q("#ns-font-aa").style.fontSize = Math.min(26, v) + "px";
    }
    font.value = s.fontSize;
    syncFont();

    /* --- theme cards --- */
    qa(".ns-theme-card").forEach(function (card) {
      card.classList.toggle("is-active", card.dataset.theme === s.theme);
      card.addEventListener("click", function () {
        s.theme = card.dataset.theme;
        s.accent = THEME_ACCENTS[s.theme] || s.accent;
        qa(".ns-theme-card").forEach(function (c) { c.classList.toggle("is-active", c === card); });
        refreshAccentsUI();
        applySettings(s);
        saveSettings(s);
        msg((THEMES[s.theme] || THEMES.classic).name + " applied");
      });
    });

    /* --- swatch + custom picker --- */
    qa(".ns-swatch[data-color]").forEach(function (sw) {
      sw.addEventListener("click", function () {
        s.accent = sw.dataset.color;
        refreshAccentsUI();
        applySettings(s);
        saveSettings(s);
      });
    });
    accentInput.addEventListener("input", function () {
      s.accent = accentInput.value;
      refreshAccentsUI();
      applySettings(s);
      saveSettings(s);
    });

    /* --- font --- */
    font.addEventListener("input", function () {
      s.fontSize = Math.max(10, Math.min(48, parseInt(font.value, 10) || 16));
      font.value = s.fontSize;
      syncFont();
      applySettings(s);
      saveSettings(s);
    });

    /* --- toggles --- */
    function toggle(id, key, after) {
      const el = q(id);
      if (!el) return;
      el.checked = !!s[key];
      el.addEventListener("change", function () {
        s[key] = el.checked;
        saveSettings(s);
        if (after) after();
      });
    }
    toggle("#ns-compact", "compact", function () { applySettings(s); });
    toggle("#ns-motion", "animations", function () { applySettings(s); });
    toggle("#ns-contrast", "highContrast", function () { applySettings(s); });
    toggle("#ns-suggestions", "suggestions");
    toggle("#ns-web-results", "webResults", function () {
      const box = document.getElementById("webSearchContainer");
      if (box && !s.webResults) box.classList.remove("visible");
    });
    toggle("#ns-autofocus", "autoFocus");
    toggle("#ns-newtab", "openLinksNewTab");
    toggle("#ns-lastsearch", "restoreSearch");
    toggle("#ns-history", "saveHistory");
    toggle("#ns-smooth", "smoothScroll", function () { applySettings(s); });
    toggle("#ns-tabs", "showTabs", function () { applySettings(s); });
    toggle("#ns-audio", "audioPreview");

    function syncSmartUIControls() {
      const smart = q("#ns-smart-ui");
      const dynamic = q("#ns-dynamic-accent");
      if (smart) smart.checked = !!s.smartUI;
      if (dynamic) {
        dynamic.checked = !!s.dynamicAccent;
        dynamic.disabled = !s.smartUI || !s.background;
        const row = dynamic.closest(".ns-row");
        if (row) row.classList.toggle("is-disabled", dynamic.disabled);
      }
    }

    toggle("#ns-smart-ui", "smartUI", function () {
      syncSmartUIControls();
      applySettings(s);
    });
    toggle("#ns-dynamic-accent", "dynamicAccent", function () {
      applySettings(s);
    });
    toggle("#ns-tactile", "tactileFeedback");
    syncSmartUIControls();

    /* --- background --- */
    function syncBg() {
      if (s.background) {
        bgActive.hidden = false;
        bgImg.src = s.background;
        bgTitle.textContent = "Replace background image";
      } else {
        bgActive.hidden = true;
        bgImg.removeAttribute("src");
        bgTitle.textContent = "Add a background image";
      }
    }
    syncBg();

    bgFile.addEventListener("change", function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        s.background = String(reader.result || "");
        s.wallpaperAccent = "";
        s.wallpaperLuminance = null;
        s.wallpaperMetaHash = "";

        saveSettings(s);
        applySettings(s);
        syncBg();
        syncSmartUIControls();
        msg("Background added — matching colors…");

        const signature = backgroundSignature(s.background);
        analyzeWallpaper(s.background).then(function (meta) {
          if (backgroundSignature(loadSettings().background) !== signature) return;
          s.wallpaperAccent = meta.accent;
          s.wallpaperLuminance = meta.luminance;
          s.wallpaperMetaHash = signature;
          saveSettings(s);
          applySettings(s);
          msg("Wallpaper colors matched");
        }).catch(function () {
          msg("Background added");
        });
      };
      reader.readAsDataURL(file);
    });

    clearBg.addEventListener("click", function () {
      s.background = "";
      s.wallpaperAccent = "";
      s.wallpaperLuminance = null;
      s.wallpaperMetaHash = "";
      saveSettings(s);
      applySettings(s);
      syncBg();
      syncSmartUIControls();
      msg("Background removed");
    });

    /* --- storage meter --- */
    function updateStorage() {
      let historyCount = 0;
      try { historyCount = JSON.parse(localStorage.getItem("nova_history") || "[]").length; } catch (err) {}
      const total = storageSize();
      storage.textContent = prettyBytes(total) + " of local storage used · " +
        historyCount + (historyCount === 1 ? " history entry" : " history entries");
      const fill = q("#ns-storage-fill");
      if (fill) fill.style.width = Math.max(2, Math.min(100, (total / (5 * 1024 * 1024)) * 100)).toFixed(1) + "%";
    }

    applySettings(s);
    updateStorage();

    /* --- actions --- */
    q("#ns-clear-history").addEventListener("click", function () {
      clearHistory(); updateStorage(); msg("History cleared");
    });
    q("#ns-clear-cache").addEventListener("click", function () {
      clearSuggestionCache(); updateStorage(); msg("Suggestion cache cleared");
    });
    q("#ns-backup").addEventListener("click", function () {
      exportBackup(); msg("Backup exported");
    });
    q("#ns-import-btn").addEventListener("click", function () {
      q("#ns-import").click();
    });
    q("#ns-import").addEventListener("change", function (event) {
      const file = event.target.files && event.target.files[0];
      if (file) importBackup(file, msg);
    });
    save.addEventListener("click", function () {
      saveSettings(s); updateStorage(); msg("Saved ✓");
    });
    reset.addEventListener("click", function () { resetEverything(msg); });
  }

  /* ---------- open / close ---------- */
  function ensureBackdrop() {
    let bd = document.getElementById("novaSettingsBackdrop");
    if (!bd) {
      bd = document.createElement("div");
      bd.id = "novaSettingsBackdrop";
      bd.addEventListener("click", closeNovaSettings);
      document.body.appendChild(bd);
    }
    return bd;
  }

  function openNovaSettings() {
    const panel = document.getElementById("novaSettingsPanel");
    const content = document.getElementById("novaSettingsContent");
    if (!panel || !content) return;
    ensureBackdrop().classList.add("show");
    panel.classList.add("show");
    panel.setAttribute("aria-hidden", "false");
    renderSettings(content);
  }

  function closeNovaSettings() {
    const panel = document.getElementById("novaSettingsPanel");
    if (!panel) return;
    panel.classList.remove("show");
    panel.setAttribute("aria-hidden", "true");
    const bd = document.getElementById("novaSettingsBackdrop");
    if (bd) bd.classList.remove("show");
  }

  /* ---------- exports ---------- */
  window.NovaSettings = {
    loadSettings: loadSettings,
    applySettings: applySettings,
    saveSettings: saveSettings
  };
  window.renderNovaSettings = renderSettings;
  window.openNovaSettings = openNovaSettings;
  window.closeNovaSettings = closeNovaSettings;

  const closeBtn = document.getElementById("novaSettingsClose");
  if (closeBtn) closeBtn.addEventListener("click", closeNovaSettings);

  document.addEventListener("keydown", function (event) {
    const panel = document.getElementById("novaSettingsPanel");
    if (event.key === "Escape" && panel && panel.classList.contains("show")) {
      closeNovaSettings();
      return;
    }
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      openNovaSettings();
    }
  });

  ensureBackdrop();
  applySettings(loadSettings());
})();
