/* NovaAppsbar — Fullscreen, Lockable, Draggable, Modular Dock */
(function() {
  const CONFIG = {
    colors: { primaryBg: '#2596be', button: '#0f75a8', heading: '#a8d0e6', text: '#fff', overlay: 'rgba(0,0,0,0.28)', lightBar: 'rgba(255,255,255,0.98)' },
    sizes: { barWidth: 900, barHeight: 28, toolWidth: 560, toolHeight: 360, gapFromEdge: 0 },
    animation: { duration: 380, easing: 'cubic-bezier(.2,.9,.25,1)' },
    fonts: { primary: '"Pixelify Sans", system-ui, sans-serif', mono: 'ui-monospace, monospace' },
    storageKeys: { timers: 'nova_timers_v1', clockPrefs: 'nova_clock_prefs_v1' }
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const create = (tag, attrs={}, children=[]) => { 
    const el = document.createElement(tag); 
    Object.entries(attrs).forEach(([k,v]) => { 
      if(k === 'class') el.className = v; 
      else if(k === 'text') el.textContent = v; 
      else if(k === 'html') el.innerHTML = v; 
      else el.setAttribute(k,v); 
    }); 
    children.forEach(c => el.appendChild(c)); 
    return el; 
  };

  function injectStyles(){
    if(document.getElementById('nova-appsbar-styles')) return;
    const s = create('style', {id: 'nova-appsbar-styles'});
    s.textContent = `
:root {
  --nova-primary-bg: ${CONFIG.colors.primaryBg};
  --nova-button: ${CONFIG.colors.button};
  --nova-heading: ${CONFIG.colors.heading};
  --nova-text: ${CONFIG.colors.text};
  --nova-overlay: ${CONFIG.colors.overlay};
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
.nova-appsbar {
  position: fixed;
  left: env(safe-area-inset-left, 0);
  bottom: env(safe-area-inset-bottom, 0);
  width: var(--nova-bar-width);
  height: var(--nova-bar-height);
  background: var(--nova-lightbar);
  border-radius: 10px 36px 36px 10px;
  display: flex;
  align-items: center;
  padding: 4px 10px;
  gap: 10px;
  z-index: 9999;
  user-select: none;
  backdrop-filter: blur(6px);
  font-family: var(--nova-font);
  overflow: visible;
  cursor: grab;
}
.nova-appsbar.locked { cursor: default; }
.nova-dock {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
}
.nova-app-button {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #333;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}
.nova-app-button:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}
.nova-tool {
  position: fixed;
  bottom: var(--nova-bar-height);
  left: env(safe-area-inset-left, 0);
  width: var(--nova-tool-width);
  height: var(--nova-tool-height);
  background: var(--nova-primary-bg);
  border-radius: 12px;
  padding: 16px;
  z-index: 9998;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
  color: var(--nova-text);
  font-family: var(--nova-font);
  overflow: auto;
  animation: slideUp var(--nova-duration) var(--nova-ease);
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.nova-tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: var(--nova-heading);
}
.nova-tool-close {
  background: none;
  border: none;
  color: var(--nova-heading);
  font-size: 20px;
  cursor: pointer;
}
    `;
    document.head.appendChild(s);
  }

  const apps = {};
  let currentApp = null;

  const appsbar = create('div', { class: 'nova-appsbar' });
  const dock = create('div', { class: 'nova-dock' });
  appsbar.appendChild(dock);
  
  // Lock button
  const lockBtn = create('button', {
    class: 'nova-app-button',
    text: '🔓',
    title: 'Toggle lock'
  });
  lockBtn.onclick = () => {
    appsbar.classList.toggle('locked');
    lockBtn.textContent = appsbar.classList.contains('locked') ? '🔒' : '🔓';
  };
  appsbar.appendChild(lockBtn);

  function registerApp(appConfig) {
    if(!appConfig.id) console.error('App must have id');
    apps[appConfig.id] = appConfig;
    const btn = create('button', {
      class: 'nova-app-button',
      text: appConfig.iconHTML || '📱',
      title: appConfig.title || appConfig.id
    });
    btn.onclick = () => openApp(appConfig.id);
    dock.appendChild(btn);
  }

  function openApp(appId) {
    const app = apps[appId];
    if(!app) return;
    
    // Close current if open
    if(currentApp) closeApp();
    
    const toolContainer = create('div', { class: 'nova-tool' });
    const header = create('div', { class: 'nova-tool-header' });
    header.innerHTML = `<div style="color:var(--nova-heading);font-weight:700">${app.title || appId}</div>`;
    const closeBtn = create('button', { class: 'nova-tool-close', text: '✕' });
    closeBtn.onclick = closeApp;
    header.appendChild(closeBtn);
    toolContainer.appendChild(header);
    
    const content = create('div');
    toolContainer.appendChild(content);
    document.body.appendChild(toolContainer);
    
    currentApp = { id: appId, el: toolContainer };
    
    // Call render if available
    if(app.render && typeof app.render === 'function') {
      app.render(content);
    }
  }

  function closeApp() {
    if(currentApp && currentApp.el) {
      currentApp.el.remove();
      currentApp = null;
    }
  }

  // Global API
  window.NovaApps = {
    registerApp,
    openApp,
    closeApp
  };

  // Inject styles and mount bar
  function init() {
    injectStyles();
    document.body.appendChild(appsbar);
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
