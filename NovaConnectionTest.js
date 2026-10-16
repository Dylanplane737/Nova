/* Nova 26.3 — Connection Test */
(function () {
  "use strict";

  const STYLE_ID = "nova-connection-test-styles";
  const TEST_QUERY = "Nova connection test";
  const TIMEOUT_MS = 8000;
  let overlay = null;
  let runId = 0;

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".nova-connection-overlay{position:fixed;inset:0;z-index:2147483645;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(3,15,26,.72);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#eaf6ff}",
      ".nova-connection-overlay.show{display:flex}",
      ".nova-connection-card{position:relative;width:min(650px,100%);max-height:min(82vh,760px);overflow:auto;box-sizing:border-box;padding:22px;border:1px solid rgba(153,214,239,.35);border-radius:18px;background:#0b2130;color:#eaf6ff;box-shadow:0 18px 55px rgba(0,0,0,.45)}",
      ".nova-connection-header{display:flex;align-items:flex-start;gap:12px;padding-right:35px}",
      ".nova-connection-icon{width:43px;height:43px;flex:none;display:grid;place-items:center;border:1px solid #2596be88;border-radius:12px;background:#2596be24;font-size:22px}",
      ".nova-connection-title{margin:0;font-size:clamp(21px,4vw,28px);line-height:1.2;color:#fff}",
      ".nova-connection-subtitle{margin:5px 0 0;font-size:13px;line-height:1.5;color:#aac8d7}",
      ".nova-connection-close{position:absolute;top:12px;right:12px;width:34px;height:34px;margin:0;padding:0;border:1px solid #ffffff30;border-radius:50%;background:#ffffff0b;color:#fff;font-size:22px;line-height:1;cursor:pointer}",
      ".nova-connection-summary{margin:17px 0 12px;padding:11px 13px;border:1px solid #ffffff20;border-radius:10px;background:#ffffff08;font-size:13px;line-height:1.5}",
      ".nova-connection-list{display:flex;flex-direction:column;gap:8px}",
      ".nova-connection-row{display:flex;align-items:flex-start;gap:11px;padding:12px;border:1px solid #ffffff1e;border-radius:11px;background:#ffffff06}",
      ".nova-connection-indicator{width:10px;height:10px;flex:none;margin-top:5px;border-radius:50%;background:#7e96a4}",
      ".nova-connection-row[data-state='pass'] .nova-connection-indicator{background:#53d89a}",
      ".nova-connection-row[data-state='fail'] .nova-connection-indicator{background:#ff7676}",
      ".nova-connection-row[data-state='warn'] .nova-connection-indicator{background:#ffd166}",
      ".nova-connection-row[data-state='running'] .nova-connection-indicator{background:#62c9f2}",
      ".nova-connection-copy{flex:1;min-width:0}",
      ".nova-connection-row-title{font-size:13.5px;font-weight:700;color:#fff}",
      ".nova-connection-detail{margin-top:3px;font-size:12px;line-height:1.5;color:#b6ceda;overflow-wrap:anywhere}",
      ".nova-connection-state{flex:none;margin-left:5px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#b6ceda}",
      ".nova-connection-row[data-state='pass'] .nova-connection-state{color:#7ce6b2}",
      ".nova-connection-row[data-state='fail'] .nova-connection-state{color:#ff9999}",
      ".nova-connection-row[data-state='warn'] .nova-connection-state{color:#ffda83}",
      ".nova-connection-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}",
      ".nova-connection-btn{min-height:39px;margin:0;padding:9px 14px;border:1px solid #ffffff35;border-radius:9px;background:#ffffff10;color:#f4fbff;font:600 13px system-ui,sans-serif;cursor:pointer}",
      ".nova-connection-btn.primary{border-color:#2596be;background:#147ba2;color:#fff}",
      ".nova-connection-btn:disabled{opacity:.6;cursor:wait}",
      ".nova-connection-note{margin:13px 0 0;color:#8eacbd;font-size:11.5px;line-height:1.5}",
      ".nova-connection-card button:focus-visible{outline:2px solid #65d5ff;outline-offset:3px}",
      "html.nova-lite-mode .nova-connection-overlay{background:#071018!important}",
      "html.nova-lite-mode .nova-connection-card{box-shadow:none!important}",
      "@media(max-width:520px){.nova-connection-overlay{padding:8px}.nova-connection-card{padding:17px;max-height:calc(100vh - 16px);border-radius:13px}.nova-connection-state{font-size:9px}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    installStyles();
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "nova-connection-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) close();
    });

    const card = document.createElement("section");
    card.className = "nova-connection-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "novaConnectionTitle");

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "nova-connection-close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Close connection test");
    closeButton.addEventListener("click", close);

    const header = document.createElement("div");
    header.className = "nova-connection-header";
    const icon = document.createElement("div");
    icon.className = "nova-connection-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "⌁";
    const copy = document.createElement("div");
    copy.style.minWidth = "0";
    const title = document.createElement("h2");
    title.className = "nova-connection-title";
    title.id = "novaConnectionTitle";
    title.textContent = "Nova Connection Test";
    const subtitle = document.createElement("p");
    subtitle.className = "nova-connection-subtitle";
    subtitle.textContent = "Check connectivity and see which search services are responding.";
    copy.append(title, subtitle);
    header.append(icon, copy);

    const summary = document.createElement("div");
    summary.className = "nova-connection-summary";
    summary.setAttribute("role", "status");
    summary.setAttribute("aria-live", "polite");
    summary.textContent = "Ready to test.";

    const list = document.createElement("div");
    list.className = "nova-connection-list";

    const actions = document.createElement("div");
    actions.className = "nova-connection-actions";
    const rerun = document.createElement("button");
    rerun.className = "nova-connection-btn primary";
    rerun.type = "button";
    rerun.textContent = "Run Test Again";
    rerun.addEventListener("click", function () { runChecks(); });
    const closeBottom = document.createElement("button");
    closeBottom.className = "nova-connection-btn";
    closeBottom.type = "button";
    closeBottom.textContent = "Close";
    closeBottom.addEventListener("click", close);
    actions.append(rerun, closeBottom);

    const note = document.createElement("p");
    note.className = "nova-connection-note";
    note.textContent = "Search checks send the generic query “Nova connection test” to Nova's providers. A browser security or CORS block can prevent a result from being inspected, so “Could not verify” is not always proof that a service is down.";

    card.append(closeButton, header, summary, list, actions, note);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay._novaParts = { summary: summary, list: list, rerun: rerun };
    return overlay;
  }

  function close() {
    runId++;
    if (!overlay) return;
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  function statusText(state) {
    return state === "pass" ? "Working" :
      state === "fail" ? "Failed" :
      state === "warn" ? "Could not verify" : "Testing";
  }

  function makeRow(title) {
    const row = document.createElement("div");
    row.className = "nova-connection-row";
    row.dataset.state = "running";
    const indicator = document.createElement("span");
    indicator.className = "nova-connection-indicator";
    indicator.setAttribute("aria-hidden", "true");
    const copy = document.createElement("div");
    copy.className = "nova-connection-copy";
    const label = document.createElement("div");
    label.className = "nova-connection-row-title";
    label.textContent = title;
    const detail = document.createElement("div");
    detail.className = "nova-connection-detail";
    detail.textContent = "Checking…";
    copy.append(label, detail);
    const state = document.createElement("span");
    state.className = "nova-connection-state";
    state.textContent = "Testing";
    row.append(indicator, copy, state);
    return { row: row, detail: detail, state: state };
  }

  async function requestCheck(config) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    let timer = null;
    let didTimeout = false;
    const start = Date.now();
    const options = {
      method: config.method || "GET",
      headers: config.headers || { "Accept": "application/json" },
      credentials: "omit",
      cache: "no-store"
    };
    if (config.body !== undefined) options.body = config.body;
    if (controller) options.signal = controller.signal;

    const request = (async function () {
      const response = await fetch(config.url, options);
      const body = await response.text();
      if (!response.ok) {
        return {
          state: "fail",
          detail: "HTTP " + response.status + (response.statusText ? " " + response.statusText : "") + " · " + (Date.now() - start) + " ms"
        };
      }
      let data;
      try { data = JSON.parse(body); }
      catch (error) {
        return { state: "warn", detail: "The service responded, but its response was not valid JSON." };
      }
      const validation = config.validate(data);
      if (!validation.ok) {
        return { state: "warn", detail: validation.detail || "The service responded, but its data format was unexpected." };
      }
      return { state: "pass", detail: validation.detail + " · " + (Date.now() - start) + " ms" };
    })();

    const timeout = new Promise(function (_resolve, reject) {
      timer = setTimeout(function () {
        didTimeout = true;
        if (controller) controller.abort();
        const error = new Error("Timed out after " + (TIMEOUT_MS / 1000) + " seconds");
        error.code = "NOVA_CONNECTION_TIMEOUT";
        reject(error);
      }, TIMEOUT_MS);
    });

    try {
      return await Promise.race([request, timeout]);
    } catch (error) {
      if (didTimeout || (error && error.code === "NOVA_CONNECTION_TIMEOUT")) {
        return { state: "fail", detail: "Timed out after " + (TIMEOUT_MS / 1000) + " seconds." };
      }
      const message = error && error.message ? error.message : String(error);
      return {
        state: "warn",
        detail: "The browser could not verify this request. The service may be unreachable, or browser security/CORS may have blocked access. " + message
      };
    } finally {
      if (timer !== null) clearTimeout(timer);
    }
  }

  function checks() {
    const online = navigator.onLine !== false;
    return [
      {
        title: "Browser connection signal",
        run: async function () {
          return online
            ? { state: "pass", detail: "The browser reports that a network connection is available. This signal alone cannot guarantee internet access." }
            : { state: "fail", detail: "The browser reports that this device is offline." };
        }
      },
      {
        title: "Wikipedia API · internet check",
        run: function () {
          return requestCheck({
            url: "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&meta=siteinfo",
            validate: function (data) {
              return data && data.query && data.query.general
                ? { ok: true, detail: "Wikipedia API responded successfully." }
                : { ok: false, detail: "Wikipedia responded, but its expected API data was missing." };
            }
          });
        }
      },
      {
        title: "Tiago Search API",
        run: function () {
          return requestCheck({
            url: "https://search.tiago.zip/api",
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ query: TEST_QUERY, type: "web", page: 0 }),
            validate: function (data) {
              const results = data && data.results && data.results.web && data.results.web.results;
              return Array.isArray(results)
                ? { ok: true, detail: "Search API responded with valid data (" + results.length + " results)." }
                : { ok: false, detail: "The service responded, but its expected web-results data was missing." };
            }
          });
        }
      },
      {
        title: "cl0q Search API",
        run: function () {
          const params = new URLSearchParams({ q: TEST_QUERY, limit: "1", offset: "0", lang: "en" });
          return requestCheck({
            url: "https://cl0q.com/search?" + params.toString(),
            validate: function (data) {
              return data && Array.isArray(data.results)
                ? { ok: true, detail: "Search API responded with valid data (" + data.results.length + " results)." }
                : { ok: false, detail: "The service responded, but its expected results list was missing." };
            }
          });
        }
      }
    ];
  }

  async function runChecks() {
    const root = ensureOverlay();
    const currentRun = ++runId;
    const parts = root._novaParts;
    parts.rerun.disabled = true;
    parts.summary.textContent = "Running diagnostics…";
    parts.list.textContent = "";
    const rows = checks().map(function (test) {
      const view = makeRow(test.title);
      parts.list.appendChild(view.row);
      return { test: test, view: view };
    });
    await Promise.all(rows.map(async function (item) {
      let result;
      try { result = await item.test.run(); }
      catch (error) {
        result = { state: "warn", detail: error && error.message ? error.message : "This check could not complete." };
      }
      if (currentRun !== runId) return;
      item.view.row.dataset.state = result.state;
      item.view.state.textContent = statusText(result.state);
      item.view.detail.textContent = result.detail;
    }));
    if (currentRun !== runId) return;
    const results = rows.map(function (item) { return item.view.row.dataset.state; });
    const passed = results.filter(function (state) { return state === "pass"; }).length;
    const failed = results.filter(function (state) { return state === "fail"; }).length;
    const unsure = results.filter(function (state) { return state === "warn"; }).length;
    const bits = [passed + " working"];
    if (failed) bits.push(failed + " failed");
    if (unsure) bits.push(unsure + " could not be verified");
    parts.summary.textContent = "Test complete: " + bits.join(" · ") + ".";
    parts.rerun.disabled = false;
  }

  function open() {
    const root = ensureOverlay();
    root.classList.add("show");
    root.setAttribute("aria-hidden", "false");
    runChecks();
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay && overlay.classList.contains("show")) close();
  });

  window.NovaConnectionTest = { open: open, close: close, run: runChecks };
})();