/* =========================================================
   NOVA V26.1 — Home, Bookmarks & Search Improvements
   Local-first: bookmarks and home shortcuts stay in this browser.
   ========================================================= */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const input = $("#urlInput");
  const homeButton = $("#novaHomeButton");
  const bookmarksButton = $("#novaBookmarksButton");
  const searchModes = $("#novaSearchModes");
  const webBox = $("#webSearchContainer");
  const webResults = $("#webSearchResults");

  if (!input || !homeButton || !bookmarksButton || !webBox || !webResults) return;

  const BOOKMARKS_KEY = "novaBookmarksV1";
  const SHORTCUTS_KEY = "novaHomeShortcutsV1";
  const defaultShortcuts = [
    { id: "wiki", title: "Wikipedia", url: "https://www.wikipedia.org/" },
    { id: "youtube", title: "YouTube", url: "https://www.youtube.com/" },
    { id: "github", title: "GitHub", url: "https://github.com/" },
    { id: "archive", title: "Internet Archive", url: "https://archive.org/" }
  ];

  let viewMode = "home";
  let bookmarks = loadBookmarks();
  let shortcuts = loadShortcuts();
  let editingBookmarkId = null;
  let editingShortcutId = null;
  let toastTimer = null;

  const style = document.createElement("style");
  style.id = "nova-v261-styles";
  style.textContent = `
    .nova-action-btn::after,.nova-shortcut-card::after { display:none!important; }
    #novaHomePanel,#novaBookmarksPanel {
      width:min(1060px,94%); box-sizing:border-box; margin:18px auto 24px; padding:clamp(15px,3vw,25px);
      border:1px solid rgba(255,255,255,.22); border-radius:20px;
      background:rgba(0,20,32,.31); color:var(--nova-page-text,#fff);
      text-align:left; box-shadow:0 12px 32px rgba(0,0,0,.10);
      -webkit-backdrop-filter:blur(12px) saturate(145%); backdrop-filter:blur(12px) saturate(145%);
    }
    .nova-panel-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
    .nova-panel-heading h1 { margin:0 0 5px; font-size:clamp(24px,4vw,34px); line-height:1.15; }
    .nova-panel-heading p,.nova-home-muted { margin:0; color:rgba(255,255,255,.8); font-size:13px; line-height:1.5; }
    .nova-section-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:21px 0 10px; }
    .nova-section-heading h2 { font-size:17px; margin:0; }
    .nova-shortcut-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
    .nova-shortcut-card {
      display:flex; align-items:center; gap:10px; min-height:66px; box-sizing:border-box;
      padding:12px; border:1px solid rgba(255,255,255,.22); border-radius:14px;
      color:inherit; text-decoration:none; background:rgba(255,255,255,.10);
      -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px);
      transition:transform .14s ease,background .14s ease,border-color .14s ease;
    }
    .nova-shortcut-card:hover { background:rgba(255,255,255,.19); border-color:rgba(255,255,255,.4); transform:translateY(-2px); text-decoration:none; }
    .nova-shortcut-icon { display:flex; align-items:center; justify-content:center; flex:0 0 34px; height:34px; border-radius:10px; background:rgba(255,255,255,.15); font-size:18px; font-weight:700; }
    .nova-shortcut-copy { min-width:0; display:flex; flex-direction:column; gap:4px; }
    .nova-shortcut-title { font-size:14px; font-weight:700; overflow-wrap:anywhere; }
    .nova-shortcut-host { font-size:11px; opacity:.78; overflow-wrap:anywhere; }
    .nova-action-btn {
      display:inline-flex; align-items:center; justify-content:center; gap:6px;
      margin:0!important; padding:8px 12px!important; border-radius:10px!important;
      border:1px solid rgba(255,255,255,.27)!important; background:rgba(255,255,255,.13)!important;
      color:inherit!important; box-shadow:none!important; font-size:12px!important; font-weight:600!important;
      white-space:nowrap;
    }
    .nova-action-btn:hover { background:rgba(255,255,255,.23)!important; }
    .nova-action-btn.primary { background:rgba(37,150,190,.68)!important; border-color:rgba(255,255,255,.34)!important; }
    .nova-action-btn.danger { background:rgba(150,35,35,.34)!important; }
    .nova-home-bookmarks { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:9px; }
    .nova-home-bookmark { display:flex; align-items:center; gap:10px; padding:11px 12px; min-width:0; border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.12); border-radius:12px; color:inherit; text-decoration:none; }
    .nova-home-bookmark:hover { background:rgba(255,255,255,.12); text-decoration:none; }
    .nova-home-bookmark .nova-shortcut-copy { flex:1; }
    .nova-bookmark-icon { flex:0 0 28px; width:28px; height:28px; object-fit:contain; border-radius:7px; background:rgba(255,255,255,.1); }
    .nova-home-empty { padding:18px; border:1px dashed rgba(255,255,255,.3); border-radius:12px; color:rgba(255,255,255,.82); font-size:13px; line-height:1.5; }
    .nova-bookmark-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin:14px 0; }
    .nova-bookmark-search { flex:1 1 220px; min-width:0; padding:10px 12px; border:1px solid rgba(255,255,255,.3); border-radius:10px; background:rgba(255,255,255,.92); color:#143242; box-sizing:border-box; font:14px system-ui,sans-serif; }
    .nova-bookmark-select { max-width:100%; padding:10px; border:1px solid rgba(255,255,255,.3); border-radius:10px; background:#f6fbff; color:#143242; font:13px system-ui,sans-serif; }
    .nova-bookmark-list { display:flex; flex-direction:column; gap:9px; }
    .nova-bookmark-row { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid rgba(255,255,255,.17); border-radius:13px; background:rgba(0,0,0,.13); min-width:0; }
    .nova-bookmark-main { display:flex; align-items:center; gap:10px; min-width:0; flex:1; color:inherit; text-decoration:none; }
    .nova-bookmark-meta { display:flex; flex-direction:column; gap:4px; min-width:0; }
    .nova-bookmark-name { font-weight:700; font-size:14px; overflow-wrap:anywhere; }
    .nova-bookmark-detail { font-size:12px; opacity:.78; overflow-wrap:anywhere; }
    .nova-bookmark-folder { display:inline-block; width:max-content; max-width:100%; padding:3px 7px; border:1px solid rgba(255,255,255,.16); border-radius:999px; font-size:10px; opacity:.85; }
    .nova-bookmark-actions { display:flex; flex-wrap:wrap; gap:6px; }
    #novaBookmarkEditor,#novaShortcutEditor { width:min(480px,calc(100% - 28px)); max-height:85vh; overflow:auto; border:1px solid #9cbfce; border-radius:17px; padding:22px; color:#173747; background:#f6fbff; box-shadow:0 24px 80px #0008; }
    #novaBookmarkEditor::backdrop,#novaShortcutEditor::backdrop { background:rgba(0,12,20,.68); backdrop-filter:blur(4px); }
    .nova-editor-title { margin:0 0 5px; font-size:22px; }
    .nova-editor-description { margin:0 0 16px; color:#58717c; font:13px/1.5 system-ui,sans-serif; }
    .nova-editor-form { display:grid; gap:12px; }
    .nova-editor-field { display:grid; gap:5px; color:#315363; font:600 12px system-ui,sans-serif; }
    .nova-editor-field input { width:100%; box-sizing:border-box; padding:10px 11px; border:1px solid #c5d8e0; border-radius:9px; background:white; color:#153342; font:14px system-ui,sans-serif; }
    .nova-editor-error { min-height:16px; margin:0; color:#a52e2e; font:12px system-ui,sans-serif; }
    .nova-editor-actions { display:flex; justify-content:flex-end; flex-wrap:wrap; gap:8px; margin-top:4px; }
    .nova-editor-actions button { margin:0!important; padding:9px 13px!important; border-radius:9px!important; font-size:13px!important; }
    .nova-shortcut-editor-list { display:flex; flex-direction:column; gap:7px; max-height:200px; overflow:auto; margin:14px 0; }
    .nova-shortcut-editor-row { display:flex; align-items:center; gap:8px; padding:9px; border:1px solid #d6e5eb; border-radius:9px; background:#fff; color:#173747; }
    .nova-shortcut-editor-row span { min-width:0; flex:1; font:13px system-ui,sans-serif; overflow-wrap:anywhere; }
    .nova-shortcut-editor-row button { margin:0!important; padding:6px 9px!important; box-shadow:none!important; font-size:11px!important; }
    .nova-result-tools { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0 14px; }
    .nova-result-filter { flex:1 1 250px; min-width:0; padding:10px 12px; border:1px solid rgba(255,255,255,.28); border-radius:10px; background:rgba(255,255,255,.94); color:#173747; box-sizing:border-box; font:13px system-ui,sans-serif; }
    .nova-result-sort { padding:9px 11px; border:1px solid rgba(255,255,255,.28); border-radius:10px; background:#f6fbff; color:#173747; font:13px system-ui,sans-serif; }
    .nova-result-count { width:100%; margin:0; color:rgba(255,255,255,.75); font:11px system-ui,sans-serif; }
    .web-result { margin:9px 0; padding:14px!important; border:1px solid rgba(255,255,255,.17)!important; border-radius:14px; background:rgba(0,0,0,.14); transition:background .14s ease,border-color .14s ease,transform .14s ease; }
    .web-result:hover { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.33)!important; }
    .web-result-head { gap:10px!important; }
    .web-result-head a { line-height:1.35; }
    .web-result-favicon { width:24px!important; height:24px!important; flex-basis:24px!important; border:1px solid rgba(255,255,255,.12); }
    .web-result-url { display:inline-block; margin-top:6px!important; padding:3px 7px; border-radius:999px; background:rgba(37,150,190,.18); font-size:11px!important; }
    .web-result-snippet { max-width:850px; font-size:13px!important; line-height:1.6!important; }
    .web-result-actions { display:flex; justify-content:flex-end; gap:7px; flex-wrap:wrap; margin-top:11px; }
    .nova-bookmark-result { margin:0!important; padding:7px 11px!important; border:1px solid rgba(255,255,255,.22)!important; border-radius:9px!important; background:rgba(255,255,255,.10)!important; color:inherit!important; box-shadow:none!important; font-size:12px!important; }
    .nova-bookmark-result.is-saved { background:rgba(37,150,190,.36)!important; border-color:rgba(145,224,255,.5)!important; }
    .nova-feature-toast { position:fixed; left:50%; bottom:20px; z-index:2147483000; transform:translateX(-50%) translateY(12px); max-width:calc(100% - 32px); padding:10px 15px; border:1px solid rgba(255,255,255,.3); border-radius:12px; background:rgba(5,36,52,.94); color:white; box-shadow:0 8px 24px #0004; font:13px system-ui,sans-serif; opacity:0; pointer-events:none; transition:opacity .18s ease,transform .18s ease; }
    .nova-feature-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
    @media(max-width:600px) {
      #novaHomePanel,#novaBookmarksPanel { width:100%; padding:15px; border-radius:15px; }
      .nova-shortcut-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .nova-bookmark-row { align-items:flex-start; flex-wrap:wrap; }
      .nova-bookmark-actions { width:100%; padding-left:40px; }
      .nova-bookmark-actions .nova-action-btn { flex:1; }
    }
  `;
  document.head.appendChild(style);

  const homePanel = document.createElement("section");
  homePanel.id = "novaHomePanel";
  homePanel.setAttribute("aria-label", "Nova Home");
  homePanel.innerHTML =
    '<header class="nova-panel-heading"><div><h1>Welcome to Nova</h1><p>Your starting point for the web.</p></div>' +
    '<button type="button" class="nova-action-btn" id="novaEditShortcuts">Edit quick links</button></header>' +
    '<div class="nova-section-heading"><h2>Quick links</h2></div>' +
    '<div class="nova-shortcut-grid" id="novaHomeShortcuts"></div>' +
    '<div class="nova-section-heading"><h2>Recent bookmarks</h2><button type="button" class="nova-action-btn" id="novaHomeManageBookmarks">Manage bookmarks</button></div>' +
    '<div class="nova-home-bookmarks" id="novaHomeBookmarks"></div>';

  const bookmarkPanel = document.createElement("section");
  bookmarkPanel.id = "novaBookmarksPanel";
  bookmarkPanel.hidden = true;
  bookmarkPanel.setAttribute("aria-label", "Nova Bookmarks");
  bookmarkPanel.innerHTML =
    '<header class="nova-panel-heading"><div><h1>Bookmarks</h1><p>Saved websites, organized your way. Bookmarks stay on this device.</p></div>' +
    '<button type="button" class="nova-action-btn primary" id="novaAddBookmark">＋ Add bookmark</button></header>' +
    '<div class="nova-bookmark-toolbar"><input type="search" class="nova-bookmark-search" id="novaBookmarkSearch" placeholder="Search bookmarks…" aria-label="Search bookmarks">' +
    '<select class="nova-bookmark-select" id="novaBookmarkFolderFilter" aria-label="Filter by folder"><option value="">All folders</option></select>' +
    '<button type="button" class="nova-action-btn" id="novaExportBookmarks">Export backup</button>' +
    '<button type="button" class="nova-action-btn" id="novaImportBookmarks">Import backup</button>' +
    '<input type="file" id="novaImportBookmarksFile" accept="application/json,.json" hidden></div>' +
    '<p class="nova-home-muted" id="novaBookmarkCount" aria-live="polite"></p>' +
    '<div class="nova-bookmark-list" id="novaBookmarkList"></div>';

  const afterAnchor = searchModes || input.closest(".search-wrap") || input;
  afterAnchor.insertAdjacentElement("afterend", homePanel);
  homePanel.insertAdjacentElement("afterend", bookmarkPanel);

  const toast = document.createElement("div");
  toast.className = "nova-feature-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);

  const bookmarkEditor = document.createElement("dialog");
  bookmarkEditor.id = "novaBookmarkEditor";
  bookmarkEditor.innerHTML =
    '<h2 class="nova-editor-title" id="novaBookmarkEditorTitle">Add bookmark</h2>' +
    '<p class="nova-editor-description">Save a website to return to it later.</p>' +
    '<form id="novaBookmarkForm" class="nova-editor-form">' +
    '<label class="nova-editor-field">Name<input id="novaBookmarkTitle" maxlength="120" required autocomplete="off"></label>' +
    '<label class="nova-editor-field">Website address<input id="novaBookmarkUrl" type="url" maxlength="2048" required placeholder="https://example.com"></label>' +
    '<label class="nova-editor-field">Folder<input id="novaBookmarkFolder" maxlength="60" list="novaBookmarkFolderOptions" placeholder="General"></label>' +
    '<datalist id="novaBookmarkFolderOptions"></datalist><p class="nova-editor-error" id="novaBookmarkEditorError"></p>' +
    '<div class="nova-editor-actions"><button type="button" class="nova-action-btn" id="novaCancelBookmark">Cancel</button>' +
    '<button type="submit" class="nova-action-btn primary">Save bookmark</button></div></form>';
  document.body.appendChild(bookmarkEditor);

  const shortcutEditor = document.createElement("dialog");
  shortcutEditor.id = "novaShortcutEditor";
  shortcutEditor.innerHTML =
    '<h2 class="nova-editor-title">Edit quick links</h2>' +
    '<p class="nova-editor-description">Add the websites you use most. You can keep up to 12 quick links.</p>' +
    '<div class="nova-shortcut-editor-list" id="novaShortcutEditorList"></div>' +
    '<form id="novaShortcutForm" class="nova-editor-form">' +
    '<label class="nova-editor-field">Shortcut name<input id="novaShortcutTitle" maxlength="60" required autocomplete="off"></label>' +
    '<label class="nova-editor-field">Website address<input id="novaShortcutUrl" type="url" maxlength="2048" required placeholder="https://example.com"></label>' +
    '<p class="nova-editor-error" id="novaShortcutEditorError"></p>' +
    '<div class="nova-editor-actions"><button type="button" class="nova-action-btn" id="novaCancelShortcut">Done</button>' +
    '<button type="submit" class="nova-action-btn primary" id="novaSaveShortcut">Add shortcut</button></div></form>';
  document.body.appendChild(shortcutEditor);

  $("#novaEditShortcuts").addEventListener("click", openShortcutEditor);
  $("#novaHomeManageBookmarks").addEventListener("click", () => showPage("bookmarks"));
  $("#novaAddBookmark").addEventListener("click", () => openBookmarkEditor());
  $("#novaBookmarkSearch").addEventListener("input", renderBookmarkList);
  $("#novaBookmarkFolderFilter").addEventListener("change", renderBookmarkList);
  $("#novaExportBookmarks").addEventListener("click", exportBookmarks);
  $("#novaImportBookmarks").addEventListener("click", () => $("#novaImportBookmarksFile").click());
  $("#novaImportBookmarksFile").addEventListener("change", importBookmarks);
  $("#novaCancelBookmark").addEventListener("click", () => bookmarkEditor.close());
  $("#novaCancelShortcut").addEventListener("click", () => shortcutEditor.close());
  $("#novaBookmarkForm").addEventListener("submit", saveBookmarkFromEditor);
  $("#novaShortcutForm").addEventListener("submit", saveShortcutFromEditor);

  function makeButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function normalizeUrl(raw) {
    let value = String(raw || "").trim();
    if (!value) throw new Error("Enter a website address.");
    if (!/^https?:\/\//i.test(value)) value = "https://" + value;
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Only HTTP and HTTPS websites are supported.");
    if (!parsed.hostname || !parsed.hostname.includes(".")) throw new Error("Enter a valid website address.");
    return parsed.href;
  }

  function urlKey(value) {
    try {
      const u = new URL(value);
      let path = u.pathname;
      if (path.length > 1) path = path.replace(/\/+$/, "");
      return (u.origin + path + u.search).toLowerCase();
    } catch (_) { return String(value || "").toLowerCase(); }
  }

  function hostFor(value) {
    try { return new URL(value).hostname.replace(/^www\./i, ""); }
    catch (_) { return String(value || ""); }
  }

  function loadBookmarks() {
    try {
      const saved = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      const output = [];
      saved.forEach(item => {
        if (!item || typeof item !== "object" || !item.url) return;
        try {
          const url = normalizeUrl(item.url);
          if (output.some(existing => urlKey(existing.url) === urlKey(url))) return;
          output.push({
            id: String(item.id || uid()),
            title: String(item.title || hostFor(url)).slice(0, 120),
            url: url,
            folder: String(item.folder || "General").trim().slice(0, 60) || "General",
            addedAt: Number(item.addedAt) || Date.now()
          });
        } catch (_) {}
      });
      return output;
    } catch (_) { return []; }
  }

  function persistBookmarks() {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      return true;
    } catch (_) {
      notify("Nova couldn't save bookmarks. Browser storage may be full.");
      return false;
    }
  }

  function loadShortcuts() {
    try {
      const saved = JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || "null");
      if (!Array.isArray(saved)) return defaultShortcuts.map(item => Object.assign({}, item));
      return saved.filter(item => item && item.title && item.url).slice(0, 12).map(item => {
        try { return { id: String(item.id || uid()), title: String(item.title).slice(0, 60), url: normalizeUrl(item.url) }; }
        catch (_) { return null; }
      }).filter(Boolean);
    } catch (_) { return defaultShortcuts.map(item => Object.assign({}, item)); }
  }

  function persistShortcuts() {
    try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts)); return true; }
    catch (_) { notify("Nova couldn't save quick links. Browser storage may be full."); return false; }
  }

  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function showPage(next) {
    viewMode = next;
    homePanel.hidden = next !== "home";
    bookmarkPanel.hidden = next !== "bookmarks";
    homeButton.classList.toggle("is-active", next === "home");
    bookmarksButton.classList.toggle("is-active", next === "bookmarks");
    homeButton.setAttribute("aria-current", next === "home" ? "page" : "false");
    bookmarksButton.setAttribute("aria-current", next === "bookmarks" ? "page" : "false");

    if (next === "home" || next === "bookmarks") {
      input.value = "";
      const suggestions = $("#suggestionBox");
      if (suggestions) { suggestions.innerHTML = ""; suggestions.classList.remove("show"); }
      hideSearchContent();
      if (window.NovaResearchSetMode) window.NovaResearchSetMode("web", { persist: false, runSearch: false });
      renderHome();
      if (next === "bookmarks") renderBookmarkList();
    }

  }

  function showSearchPage() {
    viewMode = "search";
    homePanel.hidden = true;
    bookmarkPanel.hidden = true;
    homeButton.classList.remove("is-active");
    bookmarksButton.classList.remove("is-active");
    homeButton.setAttribute("aria-current", "false");
    bookmarksButton.setAttribute("aria-current", "false");
  }

  function hideSearchContent() {
    if (webBox) webBox.classList.remove("visible");
    if ($("#resultContainer")) $("#resultContainer").classList.remove("visible");
    if ($("#dictionaryContainer")) $("#dictionaryContainer").style.display = "none";
    if ($("#timelineContainer")) $("#timelineContainer").style.display = "none";
    if ($("#rickrollContainer")) $("#rickrollContainer").style.display = "none";
    if ($("#loadingSpinner")) $("#loadingSpinner").classList.remove("visible");
    if ($("#novaResearchResults")) $("#novaResearchResults").style.display = "none";
  }

  function looksLikeDirectUrl(value) {
    return value.includes(".") || /^https?:\/\//i.test(value);
  }

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && input.value.trim() && !looksLikeDirectUrl(input.value.trim())) showSearchPage();
  }, true);

  if (searchModes) {
    searchModes.addEventListener("click", event => {
      const modeButton = event.target && event.target.closest ? event.target.closest("[data-mode]") : null;
      if (modeButton && input.value.trim()) showSearchPage();
    });
  }

  // Keep the view aligned with each tab's restored query/results.
  document.addEventListener("click", event => {
    if (event.target && event.target.closest && event.target.closest("#novaNewTab,.nova-tab")) {
      setTimeout(() => {
        const hasQuery = !!input.value.trim();
        const hasResults = !!((webBox && webBox.classList.contains("visible")) ||
          ($("#resultContainer") && $("#resultContainer").classList.contains("visible")));
        if (!hasQuery && !hasResults) showPage("home");
        else if (hasQuery || hasResults) showSearchPage();
      }, 0);
    }
  });

  function renderHome() {
    renderShortcuts();
    renderHomeBookmarks();
    renderFolderOptions();
  }

  function renderShortcuts() {
    const target = $("#novaHomeShortcuts");
    target.innerHTML = "";
    if (!shortcuts.length) {
      const empty = document.createElement("div");
      empty.className = "nova-home-empty";
      empty.textContent = "No quick links yet. Choose Edit quick links to add your favorite sites.";
      target.appendChild(empty);
      return;
    }
    shortcuts.forEach(item => {
      const card = document.createElement("a");
      card.className = "nova-shortcut-card";
      card.href = item.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";

      const icon = document.createElement("span");
      icon.className = "nova-shortcut-icon";
      icon.textContent = item.title.trim().charAt(0).toUpperCase() || "↗";

      const copy = document.createElement("span");
      copy.className = "nova-shortcut-copy";
      const title = document.createElement("span");
      title.className = "nova-shortcut-title";
      title.textContent = item.title;
      const host = document.createElement("span");
      host.className = "nova-shortcut-host";
      host.textContent = hostFor(item.url);
      copy.append(title, host);
      card.append(icon, copy);
      target.appendChild(card);
    });
  }

  function renderHomeBookmarks() {
    const target = $("#novaHomeBookmarks");
    target.innerHTML = "";
    const recent = bookmarks.slice().sort((a, b) => b.addedAt - a.addedAt).slice(0, 6);
    if (!recent.length) {
      const empty = document.createElement("div");
      empty.className = "nova-home-empty";
      empty.textContent = "Your saved websites will appear here. Use the ☆ Bookmark button on a search result or add a bookmark manually.";
      target.appendChild(empty);
      return;
    }
    recent.forEach(item => {
      const link = document.createElement("a");
      link.className = "nova-home-bookmark";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const icon = document.createElement("img");
      icon.className = "nova-bookmark-icon";
      icon.alt = "";
      icon.loading = "lazy";
      try { icon.src = new URL("/favicon.ico", item.url).href; } catch (_) {}
      icon.onerror = function () { icon.onerror = null; icon.style.display = "none"; };

      const copy = document.createElement("span");
      copy.className = "nova-shortcut-copy";
      const title = document.createElement("span");
      title.className = "nova-shortcut-title";
      title.textContent = item.title;
      const host = document.createElement("span");
      host.className = "nova-shortcut-host";
      host.textContent = hostFor(item.url) + " · " + item.folder;
      copy.append(title, host);
      link.append(icon, copy);
      target.appendChild(link);
    });
  }

  function renderFolderOptions() {
    const folderFilter = $("#novaBookmarkFolderFilter");
    const dataList = $("#novaBookmarkFolderOptions");
    const selected = folderFilter.value;
    const folders = Array.from(new Set(bookmarks.map(item => item.folder).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    folderFilter.innerHTML = '<option value="">All folders</option>';
    folders.forEach(folder => {
      const option = document.createElement("option");
      option.value = folder;
      option.textContent = folder;
      folderFilter.appendChild(option);
    });
    folderFilter.value = folders.includes(selected) ? selected : "";

    dataList.innerHTML = "";
    folders.forEach(folder => {
      const option = document.createElement("option");
      option.value = folder;
      dataList.appendChild(option);
    });
  }

  function renderBookmarkList() {
    const target = $("#novaBookmarkList");
    if (!target) return;
    renderFolderOptions();
    target.innerHTML = "";
    const query = ($("#novaBookmarkSearch").value || "").trim().toLowerCase();
    const folder = $("#novaBookmarkFolderFilter").value;
    const filtered = bookmarks.filter(item => {
      const matchesQuery = !query || (item.title + " " + item.url + " " + item.folder).toLowerCase().includes(query);
      return matchesQuery && (!folder || item.folder === folder);
    });
    $("#novaBookmarkCount").textContent = filtered.length + (filtered.length === 1 ? " bookmark" : " bookmarks") +
      (filtered.length !== bookmarks.length ? " shown · " + bookmarks.length + " total" : " saved");

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "nova-home-empty";
      empty.textContent = bookmarks.length ? "No bookmarks match this search or folder." : "No bookmarks saved yet. Add one here or save a website from search results.";
      target.appendChild(empty);
      return;
    }

    filtered.slice().sort((a, b) => a.title.localeCompare(b.title)).forEach(item => {
      const row = document.createElement("article");
      row.className = "nova-bookmark-row";

      const main = document.createElement("a");
      main.className = "nova-bookmark-main";
      main.href = item.url;
      main.target = "_blank";
      main.rel = "noopener noreferrer";

      const icon = document.createElement("img");
      icon.className = "nova-bookmark-icon";
      icon.alt = "";
      icon.loading = "lazy";
      try { icon.src = new URL("/favicon.ico", item.url).href; } catch (_) {}
      icon.onerror = function () { icon.onerror = null; icon.style.display = "none"; };

      const meta = document.createElement("span");
      meta.className = "nova-bookmark-meta";
      const title = document.createElement("span");
      title.className = "nova-bookmark-name";
      title.textContent = item.title;
      const host = document.createElement("span");
      host.className = "nova-bookmark-detail";
      host.textContent = hostFor(item.url);
      const folderLabel = document.createElement("span");
      folderLabel.className = "nova-bookmark-folder";
      folderLabel.textContent = item.folder;
      meta.append(title, host, folderLabel);
      main.append(icon, meta);

      const actions = document.createElement("div");
      actions.className = "nova-bookmark-actions";
      actions.append(
        makeButton("Edit", "nova-action-btn", () => openBookmarkEditor(item)),
        makeButton("Delete", "nova-action-btn danger", () => deleteBookmark(item.id))
      );
      row.append(main, actions);
      target.appendChild(row);
    });
  }

  function openBookmarkEditor(item) {
    editingBookmarkId = item ? item.id : null;
    $("#novaBookmarkEditorTitle").textContent = item ? "Edit bookmark" : "Add bookmark";
    $("#novaBookmarkTitle").value = item ? item.title : "";
    $("#novaBookmarkUrl").value = item ? item.url : "";
    $("#novaBookmarkFolder").value = item ? item.folder : "General";
    $("#novaBookmarkEditorError").textContent = "";
    bookmarkEditor.showModal();
    $("#novaBookmarkTitle").focus();
  }

  function saveBookmarkFromEditor(event) {
    event.preventDefault();
    const title = $("#novaBookmarkTitle").value.trim();
    const folder = $("#novaBookmarkFolder").value.trim().slice(0, 60) || "General";
    let url;
    try { url = normalizeUrl($("#novaBookmarkUrl").value); }
    catch (error) { $("#novaBookmarkEditorError").textContent = error.message || "Enter a valid website address."; return; }
    if (!title) { $("#novaBookmarkEditorError").textContent = "Enter a name for this bookmark."; return; }

    const duplicate = bookmarks.find(item => urlKey(item.url) === urlKey(url) && item.id !== editingBookmarkId);
    if (duplicate) {
      $("#novaBookmarkEditorError").textContent = "That website is already bookmarked. Edit the existing bookmark instead.";
      return;
    }

    if (editingBookmarkId) {
      const existing = bookmarks.find(item => item.id === editingBookmarkId);
      if (existing) Object.assign(existing, { title: title, url: url, folder: folder });
    } else {
      bookmarks.unshift({ id: uid(), title: title, url: url, folder: folder, addedAt: Date.now() });
    }

    persistBookmarks();
    bookmarkEditor.close();
    renderHome();
    renderBookmarkList();
    refreshResultButtons();
    notify(editingBookmarkId ? "Bookmark updated" : "Bookmark saved");
    editingBookmarkId = null;
  }

  function deleteBookmark(id) {
    const item = bookmarks.find(bookmark => bookmark.id === id);
    if (!item) return;
    if (!confirm('Delete the bookmark "' + item.title + '"?')) return;
    bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
    persistBookmarks();
    renderHome();
    renderBookmarkList();
    refreshResultButtons();
    notify("Bookmark deleted");
  }

  function resultDetails(card) {
    const link = $(".web-result-head a", card);
    if (!link) return null;
    let url;
    try { url = normalizeUrl(link.href); } catch (_) { return null; }
    return { title: (link.textContent || hostFor(url)).trim(), url: url };
  }

  function updateResultBookmarkButton(button, details) {
    const saved = bookmarks.some(item => urlKey(item.url) === urlKey(details.url));
    button.classList.toggle("is-saved", saved);
    button.textContent = saved ? "★ Saved" : "☆ Bookmark";
    button.title = saved ? "Remove this bookmark" : "Save this website";
    button.setAttribute("aria-pressed", String(saved));
  }

  function processResultCard(card) {
    if (!card || !card.classList || !card.classList.contains("web-result")) return;
    const details = resultDetails(card);
    const actions = $(".web-result-actions", card);
    if (!details || !actions) return;

    let button = $(".nova-bookmark-result", actions);
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "nova-bookmark-result";
      button.addEventListener("click", () => {
        const currentDetails = resultDetails(card);
        if (!currentDetails) return;
        const existing = bookmarks.find(item => urlKey(item.url) === urlKey(currentDetails.url));
        if (existing) {
          bookmarks = bookmarks.filter(item => item.id !== existing.id);
          persistBookmarks();
          notify("Bookmark removed");
        } else {
          bookmarks.unshift({
            id: uid(),
            title: currentDetails.title || hostFor(currentDetails.url),
            url: currentDetails.url,
            folder: "General",
            addedAt: Date.now()
          });
          persistBookmarks();
          notify("Bookmark saved");
        }
        renderHome();
        renderBookmarkList();
        refreshResultButtons();
      });
      actions.appendChild(button);
    }
    updateResultBookmarkButton(button, details);
  }

  function refreshResultButtons() {
    $$(".web-result", webResults).forEach(processResultCard);
  }

  // Improved results: quick local filtering/sorting of the results already loaded.
  const resultTools = document.createElement("div");
  resultTools.className = "nova-result-tools";
  resultTools.innerHTML =
    '<input id="novaResultFilter" class="nova-result-filter" type="search" placeholder="Filter results on this page…" aria-label="Filter results on this page">' +
    '<select id="novaResultSort" class="nova-result-sort" aria-label="Sort results">' +
    '<option value="relevance">Relevance order</option><option value="title">Title A–Z</option><option value="site">Website A–Z</option></select>' +
    '<p id="novaResultCount" class="nova-result-count" aria-live="polite"></p>';
  const webTitle = $(".web-search-title", webBox);
  if (webTitle) webTitle.insertAdjacentElement("afterend", resultTools);

  $("#novaResultFilter").addEventListener("input", applyResultFilterSort);
  $("#novaResultSort").addEventListener("change", applyResultFilterSort);

  function applyResultFilterSort() {
    const query = ($("#novaResultFilter").value || "").trim().toLowerCase();
    const sortBy = $("#novaResultSort").value;
    const cards = $$(".web-result", webResults);
    const sorted = cards.slice();
    if (sortBy === "title") {
      sorted.sort((a, b) => ($(".web-result-head a", a)?.textContent || "").localeCompare($(".web-result-head a", b)?.textContent || ""));
    } else if (sortBy === "site") {
      sorted.sort((a, b) => ($(".web-result-url", a)?.textContent || "").localeCompare($(".web-result-url", b)?.textContent || ""));
    }
    const unchanged = cards.every((card, index) => card === sorted[index]);
    if (!unchanged) {
      const pager = $(".nova-web-pagination", webResults);
      sorted.forEach(card => webResults.insertBefore(card, pager || null));
    }

    let shown = 0;
    $$(".web-result", webResults).forEach(card => {
      const match = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !match;
      if (match) shown++;
    });
    $("#novaResultCount").textContent = query
      ? "Showing " + shown + " of " + cards.length + " results on this page"
      : cards.length + (cards.length === 1 ? " result on this page" : " results on this page");
  }

  const resultsObserver = new MutationObserver(() => {
    refreshResultButtons();
    applyResultFilterSort();
    if (viewMode !== "bookmarks" && input.value.trim() &&
        ((webBox && webBox.classList.contains("visible")) ||
         ($("#resultContainer") && $("#resultContainer").classList.contains("visible")))) {
      showSearchPage();
    }
  });
  resultsObserver.observe(webResults, { childList: true });
  const visibilityObserver = new MutationObserver(() => {
    if (viewMode !== "bookmarks" && input.value.trim() &&
        ((webBox && webBox.classList.contains("visible")) ||
         ($("#resultContainer") && $("#resultContainer").classList.contains("visible")))) {
      showSearchPage();
    }
  });
  visibilityObserver.observe(webBox, { attributes: true, attributeFilter: ["class"] });
  const legacyResults = $("#resultContainer");
  if (legacyResults) visibilityObserver.observe(legacyResults, { attributes: true, attributeFilter: ["class"] });

  function openShortcutEditor() {
    editingShortcutId = null;
    $("#novaShortcutTitle").value = "";
    $("#novaShortcutUrl").value = "";
    $("#novaShortcutEditorError").textContent = "";
    $("#novaSaveShortcut").textContent = "Add shortcut";
    renderShortcutEditorList();
    shortcutEditor.showModal();
  }

  function renderShortcutEditorList() {
    const target = $("#novaShortcutEditorList");
    target.innerHTML = "";
    if (!shortcuts.length) {
      const empty = document.createElement("p");
      empty.className = "nova-editor-description";
      empty.textContent = "No quick links yet.";
      target.appendChild(empty);
      return;
    }
    shortcuts.forEach(item => {
      const row = document.createElement("div");
      row.className = "nova-shortcut-editor-row";
      const label = document.createElement("span");
      label.textContent = item.title + " — " + hostFor(item.url);
      const edit = makeButton("Edit", "nova-action-btn", () => {
        editingShortcutId = item.id;
        $("#novaShortcutTitle").value = item.title;
        $("#novaShortcutUrl").value = item.url;
        $("#novaShortcutEditorError").textContent = "";
        $("#novaSaveShortcut").textContent = "Save changes";
        $("#novaShortcutTitle").focus();
      });
      const remove = makeButton("Remove", "nova-action-btn danger", () => {
        shortcuts = shortcuts.filter(shortcut => shortcut.id !== item.id);
        persistShortcuts();
        if (editingShortcutId === item.id) {
          editingShortcutId = null;
          $("#novaShortcutTitle").value = "";
          $("#novaShortcutUrl").value = "";
          $("#novaSaveShortcut").textContent = "Add shortcut";
        }
        renderShortcutEditorList();
        renderShortcuts();
      });
      row.append(label, edit, remove);
      target.appendChild(row);
    });
  }

  function saveShortcutFromEditor(event) {
    event.preventDefault();
    const title = $("#novaShortcutTitle").value.trim();
    let url;
    try { url = normalizeUrl($("#novaShortcutUrl").value); }
    catch (error) { $("#novaShortcutEditorError").textContent = error.message || "Enter a valid website address."; return; }
    if (!title) { $("#novaShortcutEditorError").textContent = "Enter a shortcut name."; return; }
    if (shortcuts.some(item => item.id !== editingShortcutId && urlKey(item.url) === urlKey(url))) {
      $("#novaShortcutEditorError").textContent = "That website is already on your quick links.";
      return;
    }
    if (editingShortcutId) {
      const existing = shortcuts.find(item => item.id === editingShortcutId);
      if (existing) Object.assign(existing, { title: title.slice(0, 60), url: url });
    } else {
      if (shortcuts.length >= 12) { $("#novaShortcutEditorError").textContent = "Nova Home supports up to 12 quick links."; return; }
      shortcuts.push({ id: uid(), title: title.slice(0, 60), url: url });
    }
    persistShortcuts();
    editingShortcutId = null;
    $("#novaShortcutTitle").value = "";
    $("#novaShortcutUrl").value = "";
    $("#novaSaveShortcut").textContent = "Add shortcut";
    $("#novaShortcutEditorError").textContent = "";
    renderShortcutEditorList();
    renderShortcuts();
    notify("Quick links updated");
  }

  function exportBookmarks() {
    const data = { version: 1, exportedAt: new Date().toISOString(), bookmarks: bookmarks };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, "nova-bookmarks-" + new Date().toISOString().slice(0, 10) + ".json");
    notify("Bookmark backup exported");
  }

  async function importBookmarks(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = Array.isArray(parsed) ? parsed : parsed.bookmarks;
      if (!Array.isArray(incoming)) throw new Error("This file doesn't look like a Nova bookmarks backup.");
      let added = 0;
      incoming.forEach(item => {
        if (!item || !item.url) return;
        try {
          const url = normalizeUrl(item.url);
          if (bookmarks.some(existing => urlKey(existing.url) === urlKey(url))) return;
          bookmarks.push({
            id: uid(),
            title: String(item.title || hostFor(url)).slice(0, 120),
            url: url,
            folder: String(item.folder || "General").trim().slice(0, 60) || "General",
            addedAt: Number(item.addedAt) || Date.now()
          });
          added++;
        } catch (_) {}
      });
      persistBookmarks();
      renderHome();
      renderBookmarkList();
      refreshResultButtons();
      notify("Imported " + added + (added === 1 ? " bookmark" : " bookmarks"));
    } catch (error) {
      notify(error.message || "Couldn't import that bookmark file");
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.NovaFeatures = {
    showHome: () => showPage("home"),
    showBookmarks: () => showPage("bookmarks"),
    getBookmarks: () => bookmarks.map(item => Object.assign({}, item))
  };

  renderHome();
  renderBookmarkList();
  refreshResultButtons();
  applyResultFilterSort();
  showPage("home");
})();