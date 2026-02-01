/* Appsbar.js
   Nova tool dock — updated: thinner, lower, longer
   - Bottom-left fixed app bar (not full width)
   - Tools slide up from the bar and never replace search
   - Nova Translate implemented
   - Clock & Timers stored in localStorage
   - Consistent animation and behavior for all tools
*/

(function () {
  // CONFIG (adjusted: thinner, lower, longer)
  const CONFIG = {
    colors: {
      primaryBg: '#2596be',
      button: '#0f75a8',
      heading: '#a8d0e6',
      text: '#ffffff',
      errorLight: '#ffd4d4',
      errorSubtle: '#d6eefb',
      panelOverlay: 'rgba(0,0,0,0.28)',
      lightBar: 'rgba(255,255,255,0.98)'
    },
    sizes: {
      barWidth: 720,        // longer
      barHeight: 48,        // thinner
      toolWidth: 520,
      toolHeight: 360,
      gapFromEdge: 12       // lower (closer to bottom)
    },
    animation: {
      duration: 420,
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

  // UTILS
  const $ = (sel, root = document) => root.querySelector(sel);
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

  // Inject styles
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

/* App bar container (thinner, longer, lower) */
.nova-appsbar {
  position: fixed;
  left: ${CONFIG.sizes.gapFromEdge}px;
  bottom: ${CONFIG.sizes.gapFromEdge}px;
  width: var(--nova-bar-width);
  height: var(--nova-bar-height);
  background: var(--nova-lightbar);
  border-radius: 14px 36px 36px 14px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.16);
  display: flex;
  align-items: center;
  padding: 6px 10px;
  gap: 10px;
  z-index: 9999;
  user-select: none;
  transform: translateZ(0);
  backdrop-filter: blur(6px);
  font-family: var(--nova-font);
}

/* Left system area */
.nova-left {
  display:flex;
  align-items:center;
  gap:8px;
  margin-right: 6px;
  color: #333;
  min-width: 110px;
}
.nova-clock {
  display:flex;
  flex-direction:column;
  gap:1px;
  align-items:flex-start;
  cursor:pointer;
}
.nova-clock .time {
  font-weight:700;
  color: var(--nova-primary-bg);
  font-size: 13px;
}
.nova-clock .date {
  font-size: 10px;
  color: #666;
}

/* Icon dock (icons smaller to match thinner bar) */
.nova-dock {
  display:flex;
  align-items:center;
  gap:10px;
  padding: 4px 6px;
  flex: 1 1 auto;
}
.nova-icon {
  width:36px;
  height:36px;
  border-radius: 999px;
  display:flex;
  align-items:center;
  justify-content:center;
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.85));
  box-shadow: 0 6px 12px rgba(0,0,0,0.10);
  cursor:pointer;
  transition: transform var(--nova-duration) var(--nova-ease), box-shadow var(--nova-duration) var(--nova-ease), background 220ms;
  border: 1px solid rgba(0,0,0,0.06);
  font-size: 14px;
}
.nova-icon:hover { transform: translateY(-5px); }
.nova-icon.active {
  background: var(--nova-primary-bg);
  color: var(--nova-text);
  box-shadow: 0 10px 24px rgba(0,0,0,0.22);
}

/* Tool panel base (slightly shifted to align with longer bar) */
.nova-tool {
  position: fixed;
  left: ${CONFIG.sizes.gapFromEdge + 8}px;
  bottom: calc(${CONFIG.sizes.gapFromEdge}px + ${CONFIG.sizes.barHeight}px + 10px);
  width: var(--nova-tool-width);
  height: var(--nova-tool-height);
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.28);
  transform: translateY(18px) scale(0.98);
  opacity: 0;
  transition: transform var(--nova-duration) var(--nova-ease), opacity var(--nova-duration) var(--nova-ease);
  overflow: hidden;
  z-index: 10000;
  display:flex;
  flex-direction:column;
  color: var(--nova-text);
  font-family: var(--nova-font);
  border: 1px solid rgba(255,255,255,0.04);
  backdrop-filter: blur(6px);
}

/* Visible state */
.nova-tool.open {
  transform: translateY(0) scale(1);
  opacity: 1;
}

/* Tool header */
.nova-tool .header {
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 10px 12px;
  gap:8px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.nova-tool .title {
  display:flex;
  gap:10px;
  align-items:center;
}
.nova-tool .title h4 {
  margin:0;
  color: var(--nova-heading);
  font-size: 14px;
  font-weight:700;
}
.nova-tool .controls {
  display:flex;
  gap:8px;
}
.nova-tool .btn {
  background: var(--nova-button);
  color: var(--nova-text);
  border-radius: 28px;
  padding: 6px 10px;
  font-weight:700;
  cursor:pointer;
  border: none;
  transition: all 220ms var(--nova-ease);
  box-shadow: 0 6px 14px rgba(0,0,0,0.18);
}
.nova-tool .btn:hover {
  background: white;
  color: var(--nova-button);
  transform: translateY(-3px);
}

/* Tool body */
.nova-tool .body {
  padding: 12px;
  display:flex;
  flex-direction:column;
  gap:10px;
  flex:1 1 auto;
  overflow:auto;
}

/* Nova Translate UI */
.nova-translate {
  display:flex;
  flex-direction:column;
  gap:8px;
}
.nova-translate .row {
  display:flex;
  gap:8px;
}
.nova-translate textarea {
  width:100%;
  min-height:84px;
  resize:vertical;
  border-radius: 10px;
  padding:8px 10px;
  border: none;
  background: rgba(0,0,0,0.35);
  color: var(--nova-text);
  font-family: var(--nova-font);
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
}
.nova-translate .controls {
  display:flex;
  gap:8px;
  align-items:center;
}
.nova-translate select {
  border-radius: 10px;
  padding:6px 8px;
  background: rgba(255,255,255,0.02);
  color: var(--nova-text);
  border: 1px solid rgba(255,255,255,0.03);
}

/* Clock panel */
.nova-clock-panel {
  width: 320px;
  padding: 10px;
  background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.5));
  color: var(--nova-text);
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.36);
}
.nova-clock-panel h5 { margin:0 0 6px 0; color: var(--nova-heading); }
.nova-timers { display:flex; flex-direction:column; gap:8px; max-height:220px; overflow:auto; }
.nova-timer {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  padding:8px;
  border-radius:8px;
  background: rgba(255,255,255,0.02);
  font-size:13px;
}
.nova-timer .meta { color:#cfeffb; font-size:12px; }
.nova-timer .actions button { margin-left:6px; }

/* Small responsive adjustments */
@media (max-width: 720px) {
  :root { --nova-tool-width: calc(100% - 56px); }
  .nova-appsbar { left: 12px; right: 12px; width: auto; border-radius: 12px; bottom: 10px; }
  .nova-tool { left: 12px; right: 12px; width: auto; }
}
`;
    document.head.appendChild(s);
  }

  // Create bar DOM
  function createBar() {
    if (document.querySelector('.nova-appsbar')) return;

    const bar = create('div', { class: 'nova-appsbar', id: 'nova-appsbar' });

    // Left side: clock & battery
    const left = create('div', { class: 'nova-left' });
    const clock = create('div', { class: 'nova-clock', role: 'button', tabindex: 0, id: 'nova-clock-button' });
    const timeEl = create('div', { class: 'time', id: 'nova-clock-time', text: '--:--' });
    const dateEl = create('div', { class: 'date', id: 'nova-clock-date', text: '—' });
    clock.appendChild(timeEl);
    clock.appendChild(dateEl);

    const batteryWrap = create('div', { class: 'nova-battery', id: 'nova-battery' });
    batteryWrap.innerHTML = `<svg width="32" height="16" viewBox="0 0 36 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="28" height="12" rx="2" stroke="#cfdde6" stroke-width="1.4" fill="none"/>
      <rect x="30" y="6" width="4" height="6" rx="1" fill="#cfdde6"/>
      <rect x="3" y="5" width="22" height="8" rx="1" fill="#cfdde6" id="nova-batt-fill"/>
    </svg>`;
    left.appendChild(clock);
    left.appendChild(batteryWrap);

    // Dock icons
    const dock = create('div', { class: 'nova-dock' });

    // Icon factory (small placeholders)
    function iconSVG() {
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
      </svg>`;
    }

    const tools = [
      { id: 'nova-translate', title: 'Nova Translate', svg: iconSVG() },
      { id: 'nova-calculator', title: 'Calculator', svg: iconSVG() },
      { id: 'nova-dictionary', title: 'Dictionary', svg: iconSVG() },
      { id: 'nova-clocktool', title: 'Clock & Timers', svg: iconSVG() }
    ];

    tools.forEach(t => {
      const btn = create('button', { class: 'nova-icon', 'data-tool': t.id, title: t.title, 'aria-label': t.title });
      btn.innerHTML = t.svg;
      dock.appendChild(btn);
    });

    bar.appendChild(left);
    bar.appendChild(dock);
    document.body.appendChild(bar);

    // Event listeners
    dock.addEventListener('click', onDockClick);
    clock.addEventListener('click', () => toggleTool('tool-clock-panel'));
    clock.addEventListener('keydown', (e) => { if (e.key === 'Enter') toggleTool('tool-clock-panel'); });

    // Create tool containers
    createToolContainers();
    updateClock();
    setInterval(updateClock, 1000);
    initBattery();
  }

  // Tool container creation
  function createToolContainers() {
    // Nova Translate tool
    const translateTool = create('div', { class: 'nova-tool', id: 'tool-nova-translate', 'aria-hidden': 'true' });
    translateTool.innerHTML = `
      <div class="header">
        <div class="title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color:var(--nova-primary-bg)">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/>
          </svg>
          <h4>Nova Translate</h4>
        </div>
        <div class="controls">
          <button class="btn" data-action="minimize" title="Minimize">Minimize</button>
          <button class="btn" data-action="close" title="Close">Close</button>
        </div>
      </div>
      <div class="body">
        <div class="nova-translate">
          <div class="row">
            <textarea id="nova-translate-input" placeholder="Type text to translate..."></textarea>
          </div>
          <div class="row controls">
            <select id="nova-translate-from" aria-label="From language">
              <option value="auto">Detect language</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
            <select id="nova-translate-to" aria-label="To language">
              <option value="en">English</option>
              <option value="es" selected>Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
            <button class="btn" id="nova-translate-run">Translate</button>
          </div>
          <div class="row">
            <textarea id="nova-translate-output" placeholder="Translation appears here..." readonly></textarea>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(translateTool);

    // Clock panel (small)
    const clockPanel = create('div', { class: 'nova-tool', id: 'tool-clock-panel', 'aria-hidden': 'true' });
    clockPanel.style.width = '340px';
    clockPanel.style.height = 'auto';
    clockPanel.innerHTML = `
      <div class="header">
        <div class="title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="color:var(--nova-primary-bg)">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor"/>
          </svg>
          <h4>Clock & Timers</h4>
        </div>
        <div class="controls">
          <button class="btn" data-action="minimize">Minimize</button>
          <button class="btn" data-action="close">Close</button>
        </div>
      </div>
      <div class="body">
        <div class="nova-clock-panel">
          <h5>Clock Settings</h5>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <label style="font-size:13px;color:#cfeffb;">12/24</label>
            <select id="nova-clock-format" style="border-radius:8px;padding:6px;background:rgba(255,255,255,0.02);color:var(--nova-text);">
              <option value="12">12-hour</option>
              <option value="24">24-hour</option>
            </select>
          </div>
          <h5 style="margin-top:8px;">Timers</h5>
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <input id="nova-timer-label" placeholder="Label" style="flex:1;border-radius:8px;padding:8px;background:rgba(255,255,255,0.02);border:none;color:var(--nova-text)"/>
            <input id="nova-timer-time" type="time" style="border-radius:8px;padding:8px;background:rgba(255,255,255,0.02);border:none;color:var(--nova-text)"/>
            <button class="btn" id="nova-add-timer">Add</button>
          </div>
          <div class="nova-timers" id="nova-timers-list"></div>
        </div>
      </div>
    `;
    document.body.appendChild(clockPanel);

    // Placeholder tools (calculator, dictionary)
    const placeholderIds = ['tool-calculator', 'tool-dictionary', 'tool-clocktool'];
    placeholderIds.forEach(id => {
      const el = create('div', { class: 'nova-tool', id: id, 'aria-hidden': 'true' });
      el.innerHTML = `
        <div class="header">
          <div class="title">
            <h4>${id.replace('tool-','').replace(/-/g,' ')}</h4>
          </div>
          <div class="controls">
            <button class="btn" data-action="minimize">Minimize</button>
            <button class="btn" data-action="close">Close</button>
          </div>
        </div>
        <div class="body" style="align-items:center;justify-content:center;">
          <div style="text-align:center;color:var(--nova-heading);opacity:0.95;">Tool placeholder</div>
        </div>
      `;
      document.body.appendChild(el);
    });

    // Wire up tool controls
    document.querySelectorAll('.nova-tool .btn').forEach(b => {
      b.addEventListener('click', (e) => {
        const action = b.getAttribute('data-action');
        const tool = b.closest('.nova-tool');
        if (!tool) return;
        if (action === 'minimize' || action === 'close') {
          closeTool(tool.id);
        }
      });
    });

    // Translate actions
    $('#nova-translate-run').addEventListener('click', runTranslateMock);

    // Timers actions
    $('#nova-add-timer').addEventListener('click', addTimerFromUI);
    $('#nova-clock-format').addEventListener('change', saveClockPrefs);

    // Load timers
    renderTimers();
    loadClockPrefs();
  }

  // Dock click handler
  function onDockClick(e) {
    const btn = e.target.closest('.nova-icon');
    if (!btn) return;
    const tool = btn.dataset.tool;
    if (!tool) return;

    const map = {
      'nova-translate': 'tool-nova-translate',
      'nova-calculator': 'tool-calculator',
      'nova-dictionary': 'tool-dictionary',
      'nova-clocktool': 'tool-clock-panel'
    };
    const panelId = map[tool];
    if (!panelId) return;
    toggleTool(panelId);

    // active icon style
    document.querySelectorAll('.nova-icon').forEach(i => i.classList.remove('active'));
    btn.classList.add('active');
  }

  // Toggle tool open/close
  function toggleTool(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      closeTool(panelId);
    } else {
      openTool(panelId);
    }
  }

  // Open tool
  function openTool(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    // Close other tools to keep behavior consistent
    document.querySelectorAll('.nova-tool.open').forEach(p => {
      if (p.id !== panelId) closeTool(p.id);
    });

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');

    // Focus first interactive element
    setTimeout(() => {
      const focusable = panel.querySelector('textarea, input, select, button');
      if (focusable) focusable.focus();
    }, CONFIG.animation.duration + 30);
  }

  // Close tool
  function closeTool(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');

    const toolMap = {
      'tool-nova-translate': 'nova-translate',
      'tool-calculator': 'nova-calculator',
      'tool-dictionary': 'nova-dictionary',
      'tool-clock-panel': 'nova-clocktool'
    };
    const dockBtn = document.querySelector(`.nova-icon[data-tool="${toolMap[panelId]}"]`);
    if (dockBtn) dockBtn.classList.remove('active');
  }

  // Nova Translate mock (no external API)
  function runTranslateMock() {
    const input = $('#nova-translate-input').value.trim();
    const from = $('#nova-translate-from').value;
    const to = $('#nova-translate-to').value;
    const out = $('#nova-translate-output');

    if (!input) {
      out.value = '';
      return;
    }

    const simulated = `[${from}→${to}] ` + input.split('').reverse().join('');
    out.value = 'Translating…';
    setTimeout(() => {
      out.value = simulated;
    }, 420);
  }

  // Clock update
  function updateClock() {
    const now = new Date();
    const prefs = loadClockPrefs();
    const use24 = prefs && prefs.format === '24';
    const hours = use24 ? now.getHours() : ((now.getHours() + 11) % 12) + 1;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = use24 ? '' : (now.getHours() >= 12 ? ' PM' : ' AM');
    $('#nova-clock-time').textContent = `${hours}:${minutes}${ampm}`;
    $('#nova-clock-date').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    // Check timers
    checkTimers(now);
  }

  // Battery API
  function initBattery() {
    const fill = document.getElementById('nova-batt-fill');
    if (!navigator.getBattery) {
      if (fill) fill.setAttribute('width', '22');
      return;
    }
    navigator.getBattery().then(batt => {
      function update() {
        const pct = Math.round(batt.level * 100);
        const width = Math.max(2, Math.round((pct / 100) * 22));
        if (fill) fill.setAttribute('width', width.toString());
      }
      batt.addEventListener('levelchange', update);
      batt.addEventListener('chargingchange', update);
      update();
    }).catch(() => {
      if (fill) fill.setAttribute('width', '22');
    });
  }

  // Timers storage and UI
  function loadTimers() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKeys.timers);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveTimers(timers) {
    localStorage.setItem(CONFIG.storageKeys.timers, JSON.stringify(timers));
  }

  function renderTimers() {
    const list = $('#nova-timers-list');
    if (!list) return;
    list.innerHTML = '';
    const timers = loadTimers();
    timers.forEach((t, idx) => {
      const item = create('div', { class: 'nova-timer' });
      const left = create('div', { class: 'meta', html: `<strong>${escapeHtml(t.label)}</strong><div style="font-size:12px;color:#cfeffb">${t.time}</div>` });
      const actions = create('div', { class: 'actions' });
      const btnDel = create('button', { class: 'btn', text: 'Delete' });
      btnDel.addEventListener('click', () => {
        timers.splice(idx, 1);
        saveTimers(timers);
        renderTimers();
      });
      actions.appendChild(btnDel);
      item.appendChild(left);
      item.appendChild(actions);
      list.appendChild(item);
    });
    if (timers.length === 0) {
      list.innerHTML = `<div style="color:#cfeffb;opacity:0.8;font-size:13px;">No timers yet</div>`;
    }
  }

  function addTimerFromUI() {
    const label = $('#nova-timer-label').value.trim() || 'Timer';
    const time = $('#nova-timer-time').value;
    if (!time) return;
    const timers = loadTimers();
    timers.push({ label, time, recurring: false });
    saveTimers(timers);
    renderTimers();
    $('#nova-timer-label').value = '';
    $('#nova-timer-time').value = '';
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
          Notification.requestPermission().then(p => {
            if (p === 'granted') new Notification('Nova Timer', { body: `${t.label} — ${t.time}` });
          });
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

  // Clock prefs
  function loadClockPrefs() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKeys.clockPrefs);
      const prefs = raw ? JSON.parse(raw) : { format: '12' };
      const sel = $('#nova-clock-format');
      if (sel) sel.value = prefs.format || '12';
      return prefs;
    } catch (e) {
      return { format: '12' };
    }
  }
  function saveClockPrefs() {
    const sel = $('#nova-clock-format');
    const prefs = { format: sel ? sel.value : '12' };
    localStorage.setItem(CONFIG.storageKeys.clockPrefs, JSON.stringify(prefs));
  }

  // Escape HTML helper
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // Initialize everything
  function init() {
    injectStyles();
    createBar();

    // Close tools when clicking outside
    document.addEventListener('click', (e) => {
      const insideTool = e.target.closest('.nova-tool, .nova-appsbar');
      if (!insideTool) {
        document.querySelectorAll('.nova-tool.open').forEach(p => closeTool(p.id));
      }
    });

    // Keyboard: Esc closes open tools
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.nova-tool.open').forEach(p => closeTool(p.id));
      }
    });
  }

  // Run init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
