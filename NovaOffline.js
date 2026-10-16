/* Nova Offline Experience — local-first connection notice and Nova Dash */
(() => {
  "use strict";

  const STYLE_ID = "nova-offline-experience-styles";
  const BEST_KEY = "novaOfflineDashBest";
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a", "Enter"];
  let overlay = null;
  let modalKind = "";
  let game = null;
  let heldKeys = new Set();
  let keySequence = [];
  let toastNode = null;
  let toastTimer = null;

  function safeGetBest() {
    try { return Math.max(0, Number(localStorage.getItem(BEST_KEY)) || 0); }
    catch (error) { return 0; }
  }

  function safeSetBest(value) {
    try { localStorage.setItem(BEST_KEY, String(value)); }
    catch (error) { /* Nova Dash remains playable when storage is blocked. */ }
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#novaOfflineOverlay{position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:rgba(3,15,26,.74);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#f4fbff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}",
      "#novaOfflineOverlay.show{display:flex}",
      ".nova-offline-card{position:relative;width:min(650px,100%);max-height:calc(100vh - 36px);overflow:auto;box-sizing:border-box;padding:clamp(19px,4vw,30px);border:1px solid rgba(184,228,246,.35);border-radius:22px;background:linear-gradient(150deg,#103c56 0%,#092638 62%,#071b2b 100%);box-shadow:0 24px 90px rgba(0,0,0,.45);text-align:left}",
      ".nova-offline-close{position:absolute;top:12px;right:12px;width:36px;height:36px;margin:0;padding:0;border:1px solid #ffffff30;border-radius:50%;background:#ffffff12;color:#fff;font-size:23px;line-height:1;cursor:pointer}",
      ".nova-offline-close:hover{background:#ffffff26}",
      ".nova-offline-heading{display:flex;align-items:center;gap:13px;padding-right:35px;margin-bottom:12px}",
      ".nova-offline-icon{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border:1px solid #7acbe84d;border-radius:15px;background:#2596be35;font-size:25px}",
      ".nova-offline-title{margin:0;color:#fff;font-size:clamp(22px,4vw,29px);line-height:1.18}",
      ".nova-offline-message{margin:0 0 17px;color:#d5eaf4;font-size:14px;line-height:1.65}",
      ".nova-offline-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:17px}",
      ".nova-offline-btn{min-height:39px;margin:0;padding:9px 14px;border:1px solid #ffffff35;border-radius:10px;background:#ffffff12;color:#f4fbff;font:600 13px system-ui,sans-serif;cursor:pointer}",
      ".nova-offline-btn:hover{background:#ffffff23}",
      ".nova-offline-btn.primary{border-color:#61c9ee;background:#1684ad;color:#fff}",
      ".nova-offline-btn.primary:hover{background:#219bc5}",
      ".nova-offline-muted{color:#aac8d7;font-size:12px;line-height:1.5}",
      ".nova-offline-game-hud{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}",
      ".nova-offline-stat{flex:1 1 95px;padding:9px 11px;border:1px solid #ffffff22;border-radius:10px;background:#ffffff0b}",
      ".nova-offline-stat span{display:block;color:#b6d7e5;font-size:11px}",
      ".nova-offline-stat strong{display:block;margin-top:2px;color:#fff;font-size:19px;font-variant-numeric:tabular-nums}",
      "#novaDashCanvas{display:block;width:100%;height:auto;aspect-ratio:760/390;border:1px solid #5fa6c244;border-radius:13px;background:#071827;touch-action:pan-y}",
      ".nova-offline-game-help{margin:10px 0 0;color:#c6e0ec;font-size:12px;line-height:1.55}",
      ".nova-offline-mobile-controls{display:flex;gap:8px;margin-top:10px}",
      ".nova-offline-mobile-controls button{flex:1;touch-action:none}",
      ".nova-offline-toast{position:fixed;left:50%;bottom:18px;z-index:2147483647;max-width:calc(100vw - 30px);display:flex;align-items:center;gap:12px;box-sizing:border-box;padding:11px 14px;border:1px solid #ffffff35;border-radius:13px;background:#08283bf2;color:#fff;box-shadow:0 8px 30px #0005;font:13px system-ui,sans-serif;transform:translate(-50%,20px);opacity:0;pointer-events:none;transition:opacity .2s ease,transform .2s ease}",
      ".nova-offline-toast.show{transform:translate(-50%,0);opacity:1;pointer-events:auto}",
      ".nova-offline-toast button{margin:0;padding:6px 9px;border:1px solid #ffffff38;border-radius:8px;background:#2596be;color:white;font:600 12px system-ui,sans-serif;cursor:pointer}",
      "@media(max-width:520px){#novaOfflineOverlay{padding:9px}.nova-offline-card{max-height:calc(100vh - 18px);border-radius:17px;padding:18px}.nova-offline-mobile-controls{display:flex}}",
      "@media(prefers-reduced-motion:reduce){.nova-offline-toast{transition:none}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    installStyles();
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "novaOfflineOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closePanel();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function stopGame() {
    if (game) {
      game.running = false;
      if (game.raf) cancelAnimationFrame(game.raf);
    }
    game = null;
    heldKeys.clear();
  }

  function closePanel() {
    stopGame();
    if (overlay) {
      overlay.classList.remove("show");
      overlay.setAttribute("aria-hidden", "true");
    }
    modalKind = "";
  }

  function makeButton(label, action, primary) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nova-offline-btn" + (primary ? " primary" : "");
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
  }

  function renderPanel(title, icon, message, kind, buttons) {
    stopGame();
    const root = ensureOverlay();
    root.innerHTML = "";
    modalKind = kind || "message";

    const card = document.createElement("section");
    card.className = "nova-offline-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "novaOfflineTitle");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "nova-offline-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", closePanel);

    const heading = document.createElement("div");
    heading.className = "nova-offline-heading";
    const iconEl = document.createElement("div");
    iconEl.className = "nova-offline-icon";
    iconEl.setAttribute("aria-hidden", "true");
    iconEl.textContent = icon || "✨";
    const h = document.createElement("h2");
    h.className = "nova-offline-title";
    h.id = "novaOfflineTitle";
    h.textContent = title;
    heading.append(iconEl, h);

    const p = document.createElement("p");
    p.className = "nova-offline-message";
    p.textContent = message;

    const actions = document.createElement("div");
    actions.className = "nova-offline-actions";
    (buttons || [{ label: "Close", action: closePanel, primary: true }]).forEach(item => {
      actions.appendChild(makeButton(item.label, item.action, item.primary));
    });

    card.append(close, heading, p);
    if (kind === "cake") {
      const cake = document.createElement("div");
      cake.textContent = "🍰";
      cake.setAttribute("aria-hidden", "true");
      cake.style.cssText = "font-size:52px;text-align:center;padding:10px;animation:novaCakePop .55s cubic-bezier(.2,1.4,.4,1)";
      card.appendChild(cake);
      if (!document.getElementById("novaCakePopStyle")) {
        const anim = document.createElement("style");
        anim.id = "novaCakePopStyle";
        anim.textContent = "@keyframes novaCakePop{from{transform:scale(.2) rotate(-25deg);opacity:0}to{transform:scale(1) rotate(0);opacity:1}}";
        document.head.appendChild(anim);
      }
    }
    card.appendChild(actions);
    root.appendChild(card);
    root.classList.add("show");
    root.setAttribute("aria-hidden", "false");
    const firstButton = card.querySelector("button");
    if (firstButton) firstButton.focus({ preventScroll: true });
    return card;
  }

  function showEasterEgg(title, message, icon, kind) {
    renderPanel(title, icon || "✨", message, kind || "message");
  }

  function showKonamiReward() {
    renderPanel(
      "Secret code accepted!",
      "🏆",
      "You found a hidden Nova achievement. Your reward is a round of Nova Dash.",
      "konami",
      [
        { label: "Play Nova Dash", action: openGame, primary: true },
        { label: "Keep searching", action: closePanel, primary: false }
      ]
    );
  }

  function showOfflinePanel() {
    if (modalKind === "game") return;
    renderPanel(
      "You're offline",
      "📡",
      "Nova can't reach the internet right now. Web search needs a connection, but Nova Dash runs entirely on this device.",
      "offline",
      [
        { label: "Play Nova Dash", action: openGame, primary: true },
        { label: "Continue offline", action: closePanel, primary: false }
      ]
    );
  }

  function showConnectionPanel() {
    if (modalKind === "game" || modalKind === "offline") return;
    const message = "Nova couldn't load web results. Your connection may be offline, or a search provider may be temporarily unavailable. You can still play Nova Dash.";
    renderPanel(
      "Can't reach web search",
      "📡",
      message,
      "connection",
      [
        { label: "Play Nova Dash", action: openGame, primary: true },
        { label: "Try again later", action: closePanel, primary: false }
      ]
    );
  }

  function reportSearchFailure(reason) {
    const text = String(reason || "");
    if (navigator.onLine === false || /failed to fetch|networkerror|load failed|internet disconnected|network is unreachable/i.test(text)) {
      showConnectionPanel();
    }
  }

  function showToast(message) {
    installStyles();
    if (!toastNode) {
      toastNode = document.createElement("div");
      toastNode.className = "nova-offline-toast";
      toastNode.setAttribute("role", "status");
      document.body.appendChild(toastNode);
    }
    toastNode.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = message;
    toastNode.appendChild(text);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Nova Dash";
    button.addEventListener("click", openGame);
    toastNode.appendChild(button);
    toastNode.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (toastNode) toastNode.classList.remove("show");
    }, 6500);
  }

  function openGame() {
    const card = renderPanel(
      "Nova Dash",
      "✦",
      "Catch the falling stars before time runs out. Move with the ← and → keys or A and D. This game works without internet.",
      "game",
      [
        { label: "Restart", action: openGame, primary: true },
        { label: "Close game", action: closePanel, primary: false }
      ]
    );

    const hud = document.createElement("div");
    hud.className = "nova-offline-game-hud";
    hud.innerHTML = '<div class="nova-offline-stat"><span>SCORE</span><strong id="novaDashScore">0</strong></div>' +
      '<div class="nova-offline-stat"><span>BEST</span><strong id="novaDashBest">0</strong></div>' +
      '<div class="nova-offline-stat"><span>TIME LEFT</span><strong id="novaDashTime">30</strong></div>';

    const canvas = document.createElement("canvas");
    canvas.id = "novaDashCanvas";
    canvas.width = 760;
    canvas.height = 390;
    canvas.setAttribute("aria-label", "Nova Dash game. Move the catcher to collect falling stars.");

    const controls = document.createElement("div");
    controls.className = "nova-offline-mobile-controls";
    const left = makeButton("← Move left", () => {}, false);
    const right = makeButton("Move right →", () => {}, false);
    left.addEventListener("pointerdown", event => { event.preventDefault(); heldKeys.add("ArrowLeft"); });
    right.addEventListener("pointerdown", event => { event.preventDefault(); heldKeys.add("ArrowRight"); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(name => {
      left.addEventListener(name, () => heldKeys.delete("ArrowLeft"));
      right.addEventListener(name, () => heldKeys.delete("ArrowRight"));
    });
    controls.append(left, right);

    const help = document.createElement("p");
    help.className = "nova-offline-game-help";
    help.textContent = "Tip: keep moving and aim for every star. Best score stays on this device when browser storage is available.";

    const actions = card.querySelector(".nova-offline-actions");
    card.insertBefore(hud, actions);
    card.insertBefore(canvas, actions);
    card.insertBefore(controls, actions);
    card.insertBefore(help, actions);

    startGame(canvas, hud);
  }

  function startGame(canvas, hud) {
    const context = canvas.getContext("2d");
    if (!context) return;
    const scoreNode = hud.querySelector("#novaDashScore");
    const bestNode = hud.querySelector("#novaDashBest");
    const timeNode = hud.querySelector("#novaDashTime");
    const state = {
      running: true,
      raf: 0,
      startTime: performance.now(),
      lastSpawn: 0,
      playerX: canvas.width / 2 - 48,
      playerWidth: 96,
      playerHeight: 15,
      stars: [],
      score: 0,
      best: safeGetBest(),
      lastFrame: 0,
      ended: false
    };
    game = state;
    bestNode.textContent = String(state.best);
    const w = canvas.width;
    const h = canvas.height;
    const paddleY = h - 42;

    canvas.addEventListener("pointermove", event => {
      if (!state.running) return;
      const box = canvas.getBoundingClientRect();
      const scale = w / Math.max(1, box.width);
      state.playerX = Math.max(0, Math.min(w - state.playerWidth, (event.clientX - box.left) * scale - state.playerWidth / 2));
    });

    function drawStar(x, y, r, rotation) {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / 5;
        const radius = i % 2 === 0 ? r : r * 0.42;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.closePath();
      context.fillStyle = "#8ce6ff";
      context.shadowColor = "#35bbec";
      context.shadowBlur = 15;
      context.fill();
      context.restore();
    }

    function frame(now) {
      if (!state.running) return;
      const elapsed = (now - state.startTime) / 1000;
      const secondsLeft = Math.max(0, Math.ceil(30 - elapsed));
      const delta = state.lastFrame ? Math.min(2.2, (now - state.lastFrame) / 16.67) : 1;
      state.lastFrame = now;

      if (heldKeys.has("ArrowLeft") || heldKeys.has("a")) state.playerX -= 7.2 * delta;
      if (heldKeys.has("ArrowRight") || heldKeys.has("d")) state.playerX += 7.2 * delta;
      state.playerX = Math.max(0, Math.min(w - state.playerWidth, state.playerX));

      if (now - state.lastSpawn > 510) {
        state.lastSpawn = now;
        state.stars.push({
          x: 18 + Math.random() * (w - 36),
          y: -10,
          speed: 2.1 + Math.random() * 1.9 + Math.min(2, state.score * 0.025),
          rotation: Math.random() * Math.PI
        });
      }

      const gradient = context.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#0d3851");
      gradient.addColorStop(1, "#071725");
      context.fillStyle = gradient;
      context.fillRect(0, 0, w, h);

      context.strokeStyle = "rgba(154,222,246,.075)";
      context.lineWidth = 1;
      for (let x = 0; x < w; x += 38) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, h); context.stroke();
      }
      for (let y = 0; y < h; y += 38) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke();
      }

      for (let i = state.stars.length - 1; i >= 0; i--) {
        const star = state.stars[i];
        star.y += star.speed * delta;
        star.rotation += 0.035 * delta;
        drawStar(star.x, star.y, 10, star.rotation);

        const caught = star.y >= paddleY - 10 &&
          star.y <= paddleY + 26 &&
          star.x >= state.playerX - 6 &&
          star.x <= state.playerX + state.playerWidth + 6;
        if (caught) {
          state.score++;
          state.stars.splice(i, 1);
          if (state.score > state.best) {
            state.best = state.score;
            safeSetBest(state.best);
          }
          continue;
        }
        if (star.y > h + 20) state.stars.splice(i, 1);
      }

      const paddleGradient = context.createLinearGradient(state.playerX, paddleY, state.playerX, paddleY + state.playerHeight);
      paddleGradient.addColorStop(0, "#8ce6ff");
      paddleGradient.addColorStop(1, "#1687b4");
      context.fillStyle = paddleGradient;
      context.shadowColor = "#2596be";
      context.shadowBlur = 15;
      context.beginPath();
      if (typeof context.roundRect === "function") context.roundRect(state.playerX, paddleY, state.playerWidth, state.playerHeight, 8);
      else context.rect(state.playerX, paddleY, state.playerWidth, state.playerHeight);
      context.fill();
      context.shadowBlur = 0;

      scoreNode.textContent = String(state.score);
      bestNode.textContent = String(state.best);
      timeNode.textContent = String(secondsLeft);

      if (secondsLeft <= 0) {
        state.running = false;
        state.ended = true;
        context.fillStyle = "rgba(3,15,26,.77)";
        context.fillRect(0, 0, w, h);
        context.textAlign = "center";
        context.fillStyle = "#ffffff";
        context.font = "700 34px system-ui,sans-serif";
        context.fillText("Time's up!", w / 2, h / 2 - 18);
        context.fillStyle = "#bfefff";
        context.font = "600 20px system-ui,sans-serif";
        context.fillText("You caught " + state.score + " star" + (state.score === 1 ? "" : "s") + ".", w / 2, h / 2 + 20);
        context.fillStyle = "#a9c9d8";
        context.font = "14px system-ui,sans-serif";
        context.fillText("Press Restart to play again.", w / 2, h / 2 + 50);
        return;
      }
      state.raf = requestAnimationFrame(frame);
    }

    state.raf = requestAnimationFrame(frame);
  }

  document.addEventListener("keydown", event => {
    if (game && game.running) {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "a", "d", " "].includes(key)) event.preventDefault();
      if (event.key === "ArrowLeft") heldKeys.add("ArrowLeft");
      if (event.key === "ArrowRight") heldKeys.add("ArrowRight");
      if (key === "a") heldKeys.add("a");
      if (key === "d") heldKeys.add("d");
      if (event.key === "Escape") closePanel();
      return;
    }

    if (overlay && overlay.classList.contains("show")) {
      if (event.key === "Escape") closePanel();
      return;
    }

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (!KONAMI.includes(key)) {
      keySequence = [];
      return;
    }
    keySequence.push(key);
    if (keySequence.length > KONAMI.length) keySequence.shift();
    const matched = keySequence.length === KONAMI.length && KONAMI.every((item, index) => keySequence[index] === item);
    if (matched) {
      event.preventDefault();
      event.stopImmediatePropagation();
      keySequence = [];
      showKonamiReward();
    }
  }, true);

  document.addEventListener("keyup", event => {
    if (event.key === "ArrowLeft") heldKeys.delete("ArrowLeft");
    if (event.key === "ArrowRight") heldKeys.delete("ArrowRight");
    const key = event.key.toLowerCase();
    if (key === "a" || key === "d") heldKeys.delete(key);
  }, true);

  window.addEventListener("offline", showOfflinePanel);
  window.addEventListener("online", () => {
    if (modalKind === "offline" || modalKind === "connection") closePanel();
    showToast("Connection restored. You can try Nova's web search again.");
  });

  window.NovaOffline = {
    showEasterEgg,
    showKonamiReward,
    openGame,
    showOfflinePanel,
    reportSearchFailure
  };

  if (navigator.onLine === false) {
    window.setTimeout(showOfflinePanel, 150);
  }

  // Cache Nova's own app shell after the first online visit, so this page and
  // the local game can reopen without the network. External search APIs stay online-only.
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch(error => {
        console.warn("Nova offline cache could not be registered:", error);
      });
    }, { once: true });
  }
})();