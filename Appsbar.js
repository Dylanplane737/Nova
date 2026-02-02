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
  const create = (tag, attrs={}, children=[]) => { const el=document.createElement(tag); Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') el.className=v; else if(k==='text') el.textContent=v; else if(k==='html') el.innerHTML=v; else el.setAttribute(k,v); }); children.forEach(c=>el.appendChild(c)); return el; };
  const escapeHtml = s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]||m));

  function injectStyles(){
    if(document.getElementById('nova-appsbar-styles')) return;
    const s=create('style',{id:'nova-appsbar-styles'});
    s.textContent=`
:root{--nova-primary-bg:${CONFIG.colors.primaryBg};--nova-button:${CONFIG.colors.button};--nova-heading:${CONFIG.colors.heading};--nova-text:${CONFIG.colors.text};--nova-overlay:${CONFIG.colors.overlay};--nova-lightbar:${CONFIG.colors.lightBar};--nova-bar-width:${CONFIG.sizes.barWidth}px;--nova-bar-height:${CONFIG.sizes.barHeight}px;--nova-tool-width:${CONFIG.sizes.toolWidth}px;--nova-tool-height:${CONFIG.sizes.toolHeight}px;--nova-duration:${CONFIG.animation.duration}ms;--nova-ease:${CONFIG.animation.easing};--nova-font:${CONFIG.fonts.primary};--nova-mono:${CONFIG.fonts.mono};}
.nova-appsbar{position:fixed;left:env(safe-area-inset-left,0);bottom:env(safe-area-inset-bottom,0);width:var(--nova-bar-width);height:var(--nova-bar-height);background:var(--nova-lightbar);border-radius:10px 36px 36px 10px;display:flex;align-items:center;padding:4px 10px;gap:10px;z-index:9999;user-select:none;backdrop-filter:blur(6px);font-family:var(--nova-font);overflow:visible;cursor:grab;}
.nova-appsbar.locked{cursor:default;}
.nova-dock{display:flex;align-items:center;gap:8px;flex:1 1 auto;}
.nova-icon{width:28px;height:28px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.88));box-shadow:0 6px 12px rgba(0,0,0,0.08);cursor:pointer;transition:0.2s;}
.nova-icon.active{background:var(--nova-primary-bg);color:var(--nova-text);}
.nova-tool{position:fixed;left:env(safe-area-inset-left,0);bottom:calc(var(--nova-bar-height)+env(safe-area-inset-bottom,0)+8px);width:var(--nova-tool-width);max-width:calc(100%-24px);height:var(--nova-tool-height);background:linear-gradient(180deg,rgba(0,0,0,0.56),rgba(0,0,0,0.44));border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,0.36);transform:translateY(18px) scale(0.98);opacity:0;transition:transform var(--nova-duration) var(--nova-ease),opacity var(--nova-duration) var(--nova-ease);overflow:hidden;z-index:10000;display:flex;flex-direction:column;color:var(--nova-text);}
.nova-tool.open{transform:translateY(0) scale(1);opacity:1;}
.nova-tool.fullscreen{width:100vw;height:100vh;left:0;bottom:0;border-radius:0;}
.nova-tool .header{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.03);}
.nova-tool .body{padding:10px;flex:1;overflow:auto;}
.nova-tool .btn{padding:6px 10px;border-radius:22px;border:none;cursor:pointer;transition:all 0.18s;}
`; document.head.appendChild(s);}

  const AppRegistry = { apps:{}, register(app){ if(!app||!app.id) throw new Error('App must have id'); this.apps[app.id]=app; createDockIcon(app); createToolPanel(app); }, get(id){return this.apps[id];}, list(){return Object.values(this.apps);} };
  window.NovaApps={registerApp:(def)=>AppRegistry.register(def),openApp:id=>openTool(`tool-${id}`),closeApp:id=>closeTool(`tool-${id}`),list:()=>AppRegistry.list()};

  function createBar(){
    if($('.nova-appsbar')) return;
    const bar=create('div',{class:'nova-appsbar',id:'nova-appsbar'});
    const dock=create('div',{class:'nova-dock',id:'nova-dock'});
    bar.appendChild(dock); document.body.appendChild(bar);

    let isLocked=false, dragOffset={x:0,y:0};
    bar.addEventListener('mousedown', e=>{if(isLocked) return; dragOffset={x:e.clientX-bar.offsetLeft,y:e.clientY-bar.offsetTop}; document.addEventListener('mousemove',dragBar); document.addEventListener('mouseup',dropBar);});
    function dragBar(e){bar.style.left=(e.clientX-dragOffset.x)+'px'; bar.style.bottom=(window.innerHeight-(e.clientY-dragOffset.y)-bar.offsetHeight)+'px';}
    function dropBar(){document.removeEventListener('mousemove',dragBar);document.removeEventListener('mouseup',dropBar);}

    // Fullscreen toggle button
    const fsBtn=create('button',{class:'btn',text:'⛶'}); fsBtn.addEventListener('click',()=>{isLocked=!isLocked; bar.classList.toggle('locked',isLocked);});
    bar.appendChild(fsBtn);
  }

  function createDockIcon(app){
    const dock=$('#nova-dock'); if(!dock||dock.querySelector(`[data-tool='${app.id}']`)) return;
    const btn=create('button',{class:'nova-icon','data-tool':app.id,'aria-label':app.title,title:app.title,html:app.iconHTML||app.id});
    btn.addEventListener('click',()=>toggleTool(`tool-${app.id}`)); dock.appendChild(btn);
  }

  function createToolPanel(app){
    if(document.getElementById(`tool-${app.id}`)) return;
    const panel=create('div',{class:'nova-tool',id:`tool-${app.id}`});
    panel.innerHTML=`<div class='header'><h4>${escapeHtml(app.title)}</h4></div><div class='body' data-body></div>`;
    document.body.appendChild(panel);
    const body=panel.querySelector('[data-body]'); if(app.render) app.render(body);
  }

  function toggleTool(id){const p=document.getElementById(id);if(!p)return;p.classList.toggle('open');}
  function openTool(id){const p=document.getElementById(id);if(!p)return;p.classList.add('open');}
  function closeTool(id){const p=document.getElementById(id);if(!p)return;p.classList.remove('open');}

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{injectStyles();createBar();});
  else {injectStyles();createBar();}

})();

// ---- Adding new apps ----
// window.NovaApps.registerApp({
//   id:'calculator',
//   title:'Calculator',
//   iconHTML:'<img src="calc.svg" style="width:18px;height:18px">',
//   render: container=>{container.innerHTML='<div>Calculator UI</div>';}
// });
