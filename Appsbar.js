/* Appsbar.js
   Nova tool dock — final rebuild
   - Slim, left-aligned, flush to bottom-left (safe-area aware)
   - Tools slide up from the bar and never replace search
   - Nova Translate implemented
   - Clock & Timers stored in localStorage
   - Public API: window.NovaApps.registerApp(...) for easy external app registration
   - Consistent animation and behavior for all tools
*/

(function () {
  // ---------- CONFIG ----------
  const CONFIG = {
    colors: {
      primaryBg: '#2596be',
      button: '#0f75a8',
      heading: '#a8d0e6',
      text: '#ffffff',
      panelOverlay: 'rgba(0,0,0,0.28)',
      lightBar: 'rgba(255,255,255,0.98)'
    },
    sizes: {
      barWidth: 900,   // longer but not full width
      barHeight: 28,   // slim bar
      toolWidth: 560,
      toolHeight: 360,
      gapFromEdge: 0   // 0 to be flush; safe-area used in CSS
    },
    animation: {
      duration: 380,
      easing: 'cubic-bezier(.2,.9,.25,1)'
    },
    fonts: {
      primary: '"Pixelify Sans", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace'
    },
    storageKeys: {
      timers: 'nova_timers_v1',
      clockPrefs: 'nova_clock_prefs_v1'
    }
  };

  // ---------- UTILITIES ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const create = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    });
    children.forEach(c => el.appendChild(c));
    return el;
  };
  const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // ---------- STYLE INJECTION ----------
  function injectStyles() {
    if (document.getElementById('nova-appsbar-styles')) return;
    const s = document.createElement('style');
    s.id = 'nova-appsbar-styles';
    s.textContent = `
:root{
  --nova-primary-bg: ${CONFIG.colors.primaryBg};
  --nova-button: ${CONFIG.colors.button};
  --nova-heading: ${CONFIG.colors.heading};
  --nova-text: ${CONFIG.colors.text};
  --nova-panel-overlay: ${CONFIG.colors.panelOverlay};
  --nova-lightbar: ${CONFIG.colors.lightBar};
  --nova-bar-width: ${CONFIG.sizes.barWidth}px;
  --nova-bar-height: ${CONFIG.sizes.barHeight}px;
  --nova-tool-width: ${CONFIG.sizes.toolWidth}px;
  --nova-tool-height: ${CONFIG.sizes.toolHeight}px;
  --nova-duration: ${CONFIG.animation.duration}ms;
  --nova-ease: ${CONFIG.animation.easing};
  --nova-font: ${CONFIG.fonts.primary};
  --nova-mono: ${CONFIG.fonts.mono};
}

/* App bar: flush to left/bottom using safe-area */
.nova-appsbar {
  position: fixed;
  left: env(safe-area-inset-left, 0);
  bottom: env(safe-area-inset-bottom, 0);
  width: var(--nova-bar-width);
  max-width: calc(100% - 24px);
  height: var(--nova-bar-height);
  background: var(--nova-lightbar);
  border-radius: 10px 36px 36px 10px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.14);
  display: flex;
  align-items: center;
  padding: 4px 10px;
  gap: 10px;
  z-index: 9999;
  user-select: none;
  transform: translateZ(0);
  backdrop-filter: blur(6px);
  font-family: var(--nova-font);
  overflow: visible;
}

/* subtle inward curve accent */
.nova-appsbar::after{
  content: "";
  position: absolute;
  right: -12px;
  top: 0;
  height: 100%;
  width: 28px;
  background: linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.02));
  border-radius: 0 32px 32px 0;
  pointer-events: none;
  box-shadow: -6px 0 12px rgba(0,0,0,0.06) inset;
}

/* left system area */
.nova-left { display:flex; align-items:center; gap:8px; min-width:110px; padding-left:6px; }
.nova-clock { display:flex; flex-direction:column; gap:1px; cursor:pointer; }
.nova-clock .time { font-weight:700; color: var(--nova-primary-bg); font-size:12px; }
.nova-clock .date { font-size:10px; color:#666; }

/* dock icons */
.nova-dock { display:flex; align-items:center; gap:8px; padding: 2px 6px; flex:1 1 auto; }
.nova-icon {
  width:28px; height:28px; border-radius:999px; display:flex; align-items:center; justify-content:center;
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.88));
  box-shadow: 0 6px 12px rgba(0,0,0,0.08);
  cursor:pointer; transition: transform var(--nova-duration) var(--nova-ease), box-shadow var(--nova-duration) var(--nova-ease), background 180ms;
  border: 1px solid rgba(0,0,0,0.06); font-size:12px;
}
.nova-icon:hover { transform: translateY(-4px); }
.nova-icon.active { background: var(--nova-primary-bg); color: var(--nova-text); box-shadow: 0 10px 24px rgba(0,0,0,0.22); }

/* tool panel base */
.nova-tool {
  position: fixed;
  left: env(safe-area-inset-left, 0);
  bottom: calc(var(--nova-bar-height) + env(safe-area-inset-bottom, 0) + 8px);
  width: var(--nova-tool-width);
  max-width: calc(100% - env(safe-area-inset-left, 0) - env(safe-area-inset-right, 0) - 24px);
  height: var(--nova-tool-height);
  background: linear-gradient(180deg, rgba(0,0,0,0.56), rgba(0,0,0,0.44));
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0,0,0,0.36);
  transform: translateY(18px) scale(0.98);
  opacity: 0;
  transition: transform var(--nova-duration) var(--nova-ease), opacity var(--nova-duration) var(--nova-ease);
  overflow: hidden;
  z-index: 10000;
  display:flex; flex-direction:column; color:var(--nova-text); font-family:var(--nova-font);
  border: 1px solid rgba(255,255,255,0.04); backdrop-filter: blur(6px);
}
.nova-tool.open { transform: translateY(0) scale(1); opacity: 1; }

/* header & controls */
.nova-tool .header { display:flex; align-items:center; justify-content:space-between; padding: 8px 10px; border-bottom:1px solid rgba(255,255,255,0.03); }
.nova-tool .title h4 { margin:0; color:var(--nova-heading); font-size:14px; font-weight:700; }
.nova-tool .controls { display:flex; gap:8px; }
.nova-tool .btn { background: var(--nova-button); color:var(--nova-text); border-radius: 22px; padding:6px 10px; font-weight:700; border:none; cursor:pointer; transition: all 180ms var(--nova-ease); box-shadow: 0 6px 14px rgba(0,0,0,0.18); }
.nova-tool .btn:hover { background:white; color:var(--nova-button); transform: translateY(-2px); }

/* body */
.nova-tool .body { padding: 10px; display:flex; flex-direction:column; gap:10px; flex:1 1 auto; overflow:auto; }

/* translate UI */
.nova-translate textarea { width:100%; min-height:84px; resize:vertical; border-radius:10px; padding:8px 10px; border:none; background: rgba(255,255,255,0.03); color:var(--nova-text); font-family:var(--nova-font); outline:none; }

/* clock panel */
.nova-clock-panel { width:320px; padding:10px; background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.5)); border-radius:10px; box-shadow:0 10px 24px rgba(0,0,0,0.36); }
.nova-timers { display:flex; flex-direction:column; gap:8px; max-height:220px; overflow:auto; }

/* responsive */
@media (max-width: 900px) {
  :root { --nova-tool-width: calc(100% - 56px); }
  .nova-appsbar { left: 12px; width: calc(100% - 24px); border-radius: 12px; bottom: 10px; }
  .nova-tool { left: 12px; right: 12px; width: auto; max-width: calc(100% - 24px); }
}
`;
    document.head.appendChild(s);
  }

  // ---------- APP REGISTRY (public API) ----------
  // Simple registry so outer JS files can add apps easily:
  // window.NovaApps.registerApp({ id, title, iconHTML, render }) 
  // - render(container) should populate the tool body or return an element.
  const AppRegistry = {
    apps: {},
    register(appDef) {
      if (!appDef || !appDef.id) throw new Error('registerApp requires {id, title, render}');
      if (this.apps[appDef.id]) console.warn('NovaApps: overriding app', appDef.id);
      this.apps[appDef.id] = appDef;
      // create dock icon and placeholder panel immediately
      createDockIcon(appDef);
      createToolPanel(appDef);
    },
    get(id) { return this.apps[id]; },
    list() { return Object.values(this.apps); }
  };

  // Expose API
  window.NovaApps = {
    registerApp: (def) => AppRegistry.register(def),
    openApp: (id) => openTool(`tool-${id}`),
    closeApp: (id) => closeTool(`tool-${id}`),
    list: () => AppRegistry.list()
  };

  // ---------- DOM CREATION ----------
  function createBar() {
    if (document.querySelector('.nova-appsbar')) return;

    const bar = create('div', { class: 'nova-appsbar', id: 'nova-appsbar' });

    // left: clock + battery
    const left = create('div', { class: 'nova-left' });
    const clock = create('div', { class: 'nova-clock', role: 'button', tabindex: 0, id: 'nova-clock-button' });
    const timeEl = create('div', { class: 'time', id: 'nova-clock-time', text: '--:--' });
    const dateEl = create('div', { class: 'date', id: 'nova-clock-date', text: '—' });
    clock.appendChild(timeEl); clock.appendChild(dateEl);

    const batteryWrap = create('div', { class: 'nova-battery', id: 'nova-battery' });
    batteryWrap.innerHTML = `<svg width="28" height="14" viewBox="0 0 36 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="28" height="12" rx="2" stroke="#cfdde6" stroke-width="1.2" fill="none"/>
      <rect x="30" y="6" width="4" height="6" rx="1" fill="#cfdde6"/>
      <rect x="3" y="5" width="22" height="8" rx="1" fill="#cfdde6" id="nova-batt-fill"/>
    </svg>`;

    left.appendChild(clock); left.appendChild(batteryWrap);

    // dock
    const dock = create('div', { class: 'nova-dock', id: 'nova-dock' });

    bar.appendChild(left); bar.appendChild(dock);
    document.body.appendChild(bar);

    // default apps: Nova Translate, placeholders
    // Register default apps (translate + clock panel)
    AppRegistry.register({
      id: 'nova-translate',
      title: 'Nova Translate',
      iconHTML: defaultIconSVG(),
      render: (container) => renderTranslate(container)
    });

    AppRegistry.register({
      id: 'clock-panel',
      title: 'Clock & Timers',
      iconHTML: defaultIconSVG(),
      render: (container) => renderClockPanel(container)
    });

    // event listeners
    dock.addEventListener('click', onDockClick);
    clock.addEventListener('click', () => toggleTool('tool-clock-panel'));
    clock.addEventListener('keydown', (e) => { if (e.key === 'Enter') toggleTool('tool-clock-panel'); });

    updateClock();
    setInterval(updateClock, 1000);
    initBattery();
  }

  // ---------- ICON + PANEL CREATION ----------
  function defaultIconSVG() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
    </svg>`;
  }

  function createDockIcon(appDef) {
    const dock = $('#nova-dock');
    if (!dock) return;
    // avoid duplicates
    if (dock.querySelector(`[data-tool="${appDef.id}"]`)) return;
    const btn = create('button', { class: 'nova-icon', 'data-tool': appDef.id, title: appDef.title, 'aria-label': appDef.title });
    btn.innerHTML = appDef.iconHTML || defaultIconSVG();
    dock.appendChild(btn);
  }

  function createToolPanel(appDef) {
    // panel id: tool-<id>
    const panelId = `tool-${appDef.id}`;
    if (document.getElementById(panelId)) return;

    const panel = create('div', { class: 'nova-tool', id: panelId, 'aria-hidden': 'true' });
    panel.innerHTML = `
      <div class="header">
        <div class="title">
          ${appDef.iconHTML || defaultIconSVG()}
          <h4>${escapeHtml(appDef.title)}</h4>
        </div>
        <div class="controls">
          <button class="btn" data-action="minimize">Minimize</button>
          <button class="btn" data-action="close">Close</button>
        </div>
      </div>
      <div class="body" data-body></div>
    `;
    document.body.appendChild(panel);

    // wire up controls
    panel.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('click', () => closeTool(panelId));
    });

    // call render to populate body
    const body = panel.querySelector('[data-body]');
    try {
      const result = appDef.render && appDef.render(body);
      if (result instanceof HTMLElement) {
        body.innerHTML = '';
        body.appendChild(result);
      }
    } catch (err) {
      body.innerHTML = `<div style="color:#ffd4d4">Error loading tool</div>`;
      console.error('NovaApps render error for', appDef.id, err);
    }
  }

  // ---------- DOCK CLICK HANDLING ----------
  function onDockClick(e) {
    const btn = e.target.closest('.nova-icon');
    if (!btn) return;
    const id = btn.dataset.tool;
    if (!id) return;
    const panelId = `tool-${id}`;
    toggleTool(panelId);

    // active icon style
    $$('.nova-icon').forEach(i => i.classList.remove('active'));
    btn.classList.add('active');
  }

  // ---------- TOOL OPEN/CLOSE ----------
  function toggleTool(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    if (panel.classList.contains('open')) closeTool(panelId);
    else openTool(panelId);
  }

  function openTool(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    // close others
    $$('.nova-tool.open').forEach(p => { if (p.id !== panelId) closeTool(p.id); });
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    // focus first interactive element
    setTimeout(() => {
      const focusable = panel.querySelector('textarea, input, select, button');
      if (focusable) focusable.focus();
    }, CONFIG.animation.duration - 60);
  }

  function closeTool(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    // remove active icon highlight
    const toolMapId = panelId.replace(/^tool-/, '');
    const dockBtn = document.querySelector(`.nova-icon[data-tool="${toolMapId}"]`);
    if (dockBtn) dockBtn.classList.remove('active');
  }

  // ---------- DEFAULT TOOL RENDERS ----------
  // Nova Translate (simple mock; replace renderTranslate with API call if desired)
  function renderTranslate(container) {
    container.innerHTML = `
      <div class="nova-translate">
        <div style="display:flex;gap:8px;">
          <select id="nova-translate-from" aria-label="From language" style="border-radius:8px;padding:6px;background:rgba(255,255,255,0.02);color:var(--nova-text);">
            <option value="auto">Detect</option><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option>
          </select>
          <select id="nova-translate-to" aria-label="To language" style="border-radius:8px;padding:6px;background:rgba(255,255,255,0.02);color:var(--nova-text);">
            <option value="en">English</option><option value="es" selected>Spanish</option><option value="fr">French</option>
          </select>
          <button class="btn" id="nova-translate-run">Translate</button>
        </div>
        <textarea id="nova-translate-input" placeholder="Type text to translate..."></textarea>
        <textarea id="nova-translate-output" placeholder="Translation appears here..." readonly></textarea>
      </div>
    `;
    const run = container.querySelector('#nova-translate-run');
    run.addEventListener('click', () => {
      const input = container.querySelector('#nova-translate-input').value.trim();
      const from = container.querySelector('#nova-translate-from').value;
      const to = container.querySelector('#nova-translate-to').value;
      const out = container.querySelector('#nova-translate-output');
      if (!input) { out.value = ''; return; }
      out.value = 'Translating…';
      setTimeout(() => out.value = `[${from}→${to}] ${input.split('').reverse().join('')}`, 420);
    });
  }

  // Clock & Timers panel
  function renderClockPanel(container) {
    container.innerHTML = `
      <div class="nova-clock-panel">
        <h5 style="margin:0 0 8px 0;color:var(--nova-heading)">Clock Settings</h5>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <label style="font-size:13px;color:#cfeffb;">12/24</label>
          <select id="nova-clock-format" style="border-radius:8px;padding:6px;background:rgba(255,255,255,0.02);color:var(--nova-text);">
            <option value="12">12-hour</option><option value="24">24-hour</option>
          </select>
        </div>
        <h5 style="margin:6px 0 8px 0;color:var(--nova-heading)">Timers</h5>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <input id="nova-timer-label" placeholder="Label" style="flex:1;border-radius:8px;padding:8px;background:rgba(255,255,255,0.02);border:none;color:var(--nova-text)"/>
          <input id="nova-timer-time" type="time" style="border-radius:8px;padding:8px;background:rgba(255,255,255,0.02);border:none;color:var(--nova-text)"/>
          <button class="btn" id="nova-add-timer">Add</button>
        </div>
        <div class="nova-timers" id="nova-timers-list"></div>
      </div>
    `;
    container.querySelector('#nova-add-timer').addEventListener('click', addTimerFromUI);
    container.querySelector('#nova-clock-format').addEventListener('change', saveClockPrefs);
    renderTimers();
    loadClockPrefs();
  }

  // ---------- CLOCK + TIMERS + BATTERY ----------
  function updateClock() {
    const now = new Date();
    const prefs = loadClockPrefs();
    const use24 = prefs && prefs.format === '24';
    const hours = use24 ? now.getHours() : ((now.getHours() + 11) % 12) + 1;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = use24 ? '' : (now.getHours() >= 12 ? ' PM' : ' AM');
    const timeEl = $('#nova-clock-time');
    const dateEl = $('#nova-clock-date');
    if (timeEl) timeEl.textContent = `${hours}:${minutes}${ampm}`;
    if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    checkTimers(now);
  }

  function initBattery() {
    const fill = document.getElementById('nova-batt-fill');
    if (!navigator.getBattery || !fill) {
      if (fill) fill.setAttribute('width', '22');
      return;
    }
    navigator.getBattery().then(batt => {
      function update() {
        const pct = Math.round(batt.level * 100);
        const width = Math.max(2, Math.round((pct / 100) * 22));
        fill.setAttribute('width', width.toString());
      }
      batt.addEventListener('levelchange', update);
      batt.addEventListener('chargingchange', update);
      update();
    }).catch(() => { if (fill) fill.setAttribute('width', '22'); });
  }

  // timers storage
  function loadTimers() {
    try { const raw = localStorage.getItem(CONFIG.storageKeys.timers); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  }
  function saveTimers(timers) { localStorage.setItem(CONFIG.storageKeys.timers, JSON.stringify(timers)); }

  function renderTimers() {
    const list = $('#nova-timers-list');
    if (!list) return;
    list.innerHTML = '';
    const timers = loadTimers();
    timers.forEach((t, idx) => {
      const item = create('div', { class: 'nova-timer' });
      item.style.display = 'flex'; item.style.justifyContent = 'space-between'; item.style.alignItems = 'center';
      item.style.padding = '8px'; item.style.borderRadius = '8px'; item.style.background = 'rgba(255,255,255,0.02)';
      item.innerHTML = `<div style="font-size:13px;color:#cfeffb"><strong>${escapeHtml(t.label)}</strong><div style="font-size:12px;color:#cfeffb">${t.time}</div></div>`;
      const del = create('button', { class: 'btn', text: 'Delete' });
      del.addEventListener('click', () => { timers.splice(idx,1); saveTimers(timers); renderTimers(); });
      item.appendChild(del);
      list.appendChild(item);
    });
    if (timers.length === 0) list.innerHTML = `<div style="color:#cfeffb;opacity:0.8;font-size:13px;">No timers yet</div>`;
  }

  function addTimerFromUI() {
    const label = ($('#nova-timer-label') && $('#nova-timer-label').value.trim()) || 'Timer';
    const time = $('#nova-timer-time') && $('#nova-timer-time').value;
    if (!time) return;
    const timers = loadTimers();
    timers.push({ label, time, recurring: false });
    saveTimers(timers);
    renderTimers();
    if ($('#nova-timer-label')) $('#nova-timer-label').value = '';
    if ($('#nova-timer-time')) $('#nova-timer-time').value = '';
  }

  function checkTimers(now) {
    const timers = loadTimers();
    if (!timers || timers.length === 0) return;
    const nowStr = now.toTimeString().slice(0,5);
    timers.forEach((t) => {
      if (!t._fired && t.time === nowStr) {
        t._fired = true;
        openTool('tool-clock-panel');
        flashBar();
        if (window.Notification && Notification.permission === 'granted') {
          new Notification('Nova Timer', { body: `${t.label} — ${t.time}` });
        } else if (window.Notification && Notification.permission !== 'denied') {
          Notification.requestPermission().then(p => { if (p === 'granted') new Notification('Nova Timer', { body: `${t.label} — ${t.time}` }); });
        }
      }
      if (t._fired && t.time !== nowStr) t._fired = false;
    });
    saveTimers(timers);
  }

  function flashBar() {
    const bar = document.getElementById('nova-appsbar');
    if (!bar) return;
    bar.style.transition = 'box-shadow 220ms';
    bar.style.boxShadow = '0 18px 40px rgba(37,150,190,0.28)';
    setTimeout(() => bar.style.boxShadow = '', 900);
  }

  // clock prefs
  function loadClockPrefs() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKeys.clockPrefs);
      const prefs = raw ? JSON.parse(raw) : { format: '12' };
      const sel = $('#nova-clock-format'); if (sel) sel.value = prefs.format || '12';
      return prefs;
    } catch { return { format: '12' }; }
  }
  function saveClockPrefs() {
    const sel = $('#nova-clock-format'); const prefs = { format: sel ? sel.value : '12' };
    localStorage.setItem(CONFIG.storageKeys.clockPrefs, JSON.stringify(prefs));
  }

  // ---------- INIT ----------
  function init() {
    injectStyles();
    createBar();

    // create panels for any apps already registered externally (if registerApp called before script loaded)
    Object.values(AppRegistry.apps).forEach(app => { createToolPanel(app); createDockIcon(app); });

    // close tools when clicking outside
    document.addEventListener('click', (e) => {
      const inside = e.target.closest('.nova-tool, .nova-appsbar');
      if (!inside) $$('.nova-tool.open').forEach(p => closeTool(p.id));
    });

    // esc closes
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.nova-tool.open').forEach(p => closeTool(p.id)); });
  }

  // run init
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // ---------- USAGE NOTE (for external JS files) ----------
  // Example external registration:
  // window.NovaApps.registerApp({
  //   id: 'calculator',
  //   title: 'Calculator',
  //   iconHTML: '<img src="icons/calc.svg" style="width:18px;height:18px"/>',
  //   render: (container) => { container.innerHTML = '<div>Calculator UI here</div>'; }
  // });
  //
  // After registering, the dock icon and tool panel are created automatically.
})();

