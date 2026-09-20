// Placeholder for future easter eggs
function stopSnow() {}

// State
let highlightedIndex = -1;
let debounceTimer;
let commonsOffset = 0;
let currentQuery = "";
let imagesList = [];
let currentLightIndex = -1;
let matrixState = { running: false, intervalId: null };

// Elements
const urlInput = document.getElementById("urlInput");
const suggestionBox = document.getElementById("suggestionBox");
const spinner = document.getElementById("loadingSpinner");
const webSearchContainer = document.getElementById("webSearchContainer");
const webSearchResults = document.getElementById("webSearchResults");
const resultContainer = document.getElementById("resultContainer");
const imagesSection = document.getElementById("imagesSection");
const videosSection = document.getElementById("videosSection");
const wikiSummaryEl = document.getElementById("wikiSummary");
const dictionaryContainer = document.getElementById("dictionaryContainer");
const dictionaryResults = document.getElementById("dictionaryResults");
const timelineContainer = document.getElementById("timelineContainer");
const timelineList = document.getElementById("timelineList");
const rickrollContainer = document.getElementById("rickrollContainer");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeLightbox = document.getElementById("closeLightbox");
const lightPrev = document.getElementById("lightPrev");
const lightNext = document.getElementById("lightNext");
const matrixCanvas = document.getElementById("matrixCanvas");
const calc = document.getElementById("clac");

// helpers
function showSpinner(){ spinner.classList.add("visible"); spinner.setAttribute("aria-hidden","false"); }
function hideSpinner(){ spinner.classList.remove("visible"); spinner.setAttribute("aria-hidden","true"); }
function formatURL(input){
  input = input.trim();
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (input.includes(".")) return "https://" + input;
  return input;
}
function safeText(s){ return (s || "").toString(); }
function escapeHtml(text){
  if (!text) return "";
  return text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[c]);
}

// --- Autocomplete (Wikipedia opensearch) ---
urlInput.addEventListener("input", (e)=>{
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(()=> showSuggestions(e.target.value.trim()), 240);
});
async function fetchWikiSuggestions(q){
  if (!q) return [];
  const cacheKey = `wiki_suggest_${q}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const j = await res.json();
    const results = j[1]||[];
    sessionStorage.setItem(cacheKey, JSON.stringify(results));
    return results;
  } catch { return []; }
}
async function showSuggestions(input){
  suggestionBox.innerHTML = ""; highlightedIndex = -1;
  if (!input) { suggestionBox.classList.remove("show"); return; }
  const list = await fetchWikiSuggestions(input);
  if (!list || !list.length) { suggestionBox.classList.remove("show"); return; }
  list.forEach(item=>{
    const d = document.createElement("div");
    d.textContent = item;
    d.tabIndex = 0;
    d.onclick = ()=> { urlInput.value = item; suggestionBox.innerHTML=""; suggestionBox.classList.remove("show"); };
    suggestionBox.appendChild(d);
  });
  suggestionBox.classList.add("show");
}
urlInput.addEventListener("keydown", (e)=>{
  const items = suggestionBox.querySelectorAll("div");
  if (!items.length) return;
  if (e.key === "ArrowDown"){ e.preventDefault(); highlightedIndex = (highlightedIndex+1)%items.length; updateHighlight(items); }
  else if (e.key === "ArrowUp"){ e.preventDefault(); highlightedIndex = (highlightedIndex-1+items.length)%items.length; updateHighlight(items); }
  else if (e.key === "Enter"){ if (highlightedIndex>=0){ e.preventDefault(); urlInput.value = items[highlightedIndex].textContent; suggestionBox.innerHTML=""; suggestionBox.classList.remove("show"); } else { openWebsite(); } }
  else if (e.key === "Escape"){ suggestionBox.innerHTML=""; suggestionBox.classList.remove("show"); highlightedIndex=-1; }
});
function updateHighlight(items){ items.forEach((it,i)=> it.classList.toggle("highlighted", i===highlightedIndex)); }

// --- Wikipedia summary & helpers ---
async function getWikiSummary(query){
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=extracts|pageimages&exintro&explaintext&piprop=thumbnail&pithumbsize=400&format=json&titles=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query && data.query.pages ? data.query.pages : null;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    if (!page || page.missing) return null;
    return {
      title: page.title,
      extract: page.extract || "",
      thumbnail: page.thumbnail ? page.thumbnail.source : null,
      fullurl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
    };
  } catch (err) { console.warn("getWikiSummary error", err); return null; }
}

// --- Wikimedia Commons media ---
async function getCommonsMedia(query, offset=0){
  try {
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=20&gsroffset=${offset}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|thumbmime&iiurlwidth=400`;
    const res = await fetch(endpoint);
    if (!res.ok) return { images:[], videos:[] };
    const data = await res.json();
    if (!data.query || !data.query.pages) return { images:[], videos:[] };
    const pages = Object.values(data.query.pages);
    const images = [], videos = [];
    for (const p of pages){
      const info = p.imageinfo && p.imageinfo[0] ? p.imageinfo[0] : null;
      if (!info) continue;
      if (info.mime && info.mime.startsWith("image/")) images.push(info.thumburl || info.url);
      else if (info.mime && info.mime.startsWith("video/")) videos.push(info.url);
    }
    return { images, videos };
  } catch (err) { console.warn("getCommonsMedia error", err); return { images:[], videos:[] }; }
}

// --- Dictionary ---
async function getDictionaryDefinition(word){
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const j = await res.json();
    return j[0] || null;
  } catch { return null; }
}

// --- Video APIs (Moved outside of try/catch to fix scoping bug) ---
async function fetchPeerTubeVideos(query, limit=5) {
  try {
    const instance = "https://framatube.org";
    const res = await fetch(`${instance}/api/v1/videos/search?q=${encodeURIComponent(query)}&count=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data && data.data ? data.data.map(v => ({
      title: v.name, url: v.url,
      embed: `${instance}/videos/embed/${v.uuid}`, thumbnail: v.thumbnailUrl
    })) : [];
  } catch(err) { console.warn("PeerTube fetch error:", err); return []; }
}

async function fetchDailymotionVideos(query, limit=5){
  try {
    const res = await fetch(`https://api.dailymotion.com/videos?search=${encodeURIComponent(query)}&limit=${limit}&fields=title,id,thumbnail_url,url`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.list.map(v => ({
      title: v.title, url: v.url,
      embed: `https://www.dailymotion.com/embed/video/${v.id}`, thumbnail: v.thumbnail_url
    }));
  } catch(err){ console.warn("Dailymotion fetch error:", err); return []; }
}

// --- Timeline extractor ---
function extractTimelineFromText(text){
  if (!text) return [];
  const sentences = text.replace(/\r/g," ").split(/(?<=[.?!;])\s+|\n+/);
  const events = [];
  const yearRegex = /\b(1[0-9]{3}|20[0-9]{2})\b/g;
  for (const s of sentences){
    const found = [...s.matchAll(yearRegex)];
    if (found.length){
      const y = parseInt(found[0][1],10);
      const clean = s.trim().replace(/[\n\r]+/g," ").replace(/\s{2,}/g," ");
      events.push({ year: y, text: clean });
    }
  }
  const unique = [];
  const seen = new Set();
  events.sort((a,b)=> a.year - b.year);
  for (const e of events){
    const key = `${e.year}||${e.text}`;
    if (!seen.has(key)) { seen.add(key); unique.push(e); }
  }
  return unique;
}
function renderTimeline(events){
  timelineList.innerHTML = "";
  if (!events.length){ timelineContainer.style.display = "none"; return; }
  for (const ev of events){
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `<span class="timeline-year">${ev.year}</span> <span>${escapeHtml(ev.text)}</span>`;
    timelineList.appendChild(div);
  }
  timelineContainer.style.display = "block";
}

// --- Lightbox gallery ---
function openLightbox(index){
  if (index < 0 || index >= imagesList.length) return;
  currentLightIndex = index;
  lightboxImg.src = imagesList[index];
  lightbox.classList.add("show");
  lightbox.setAttribute("aria-hidden","false");
}
function closeLightboxFn(){
  lightbox.classList.remove("show");
  lightbox.setAttribute("aria-hidden","true");
  currentLightIndex = -1;
}
function lightNextFn(){
  if (imagesList.length === 0) return;
  currentLightIndex = (currentLightIndex + 1) % imagesList.length;
  lightboxImg.src = imagesList[currentLightIndex];
}
function lightPrevFn(){
  if (imagesList.length === 0) return;
  currentLightIndex = (currentLightIndex - 1 + imagesList.length) % imagesList.length;
  lightboxImg.src = imagesList[currentLightIndex];
}
closeLightbox.onclick = closeLightboxFn;
lightNext.onclick = lightNextFn;
lightPrev.onclick = lightPrevFn;
document.addEventListener("keydown", (e)=>{
  if (lightbox.classList.contains("show")){
    if (e.key === "Escape") closeLightboxFn();
    if (e.key === "ArrowRight") lightNextFn();
    if (e.key === "ArrowLeft") lightPrevFn();
  }
});

// --- Matrix Easter Egg ---
function startMatrix(){
  stopMatrix();
  const c = matrixCanvas;
  c.style.display = "block";
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  const ctx = c.getContext("2d");
  const cols = Math.floor(c.width/10);
  const ypos = Array(cols).fill(0);
  ctx.font = "10pt monospace";
  matrixState.running = true;
  matrixState.intervalId = setInterval(()=>{
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#0F0";
    for (let i=0;i<cols;i++){
      const text = String.fromCharCode(0x30A0 + Math.random()*96);
      ctx.fillText(text, i*10, ypos[i]*10);
      if (ypos[i]*10 > c.height && Math.random() > 0.975) ypos[i]=0;
      ypos[i]++;
    }
  }, 50);
  function escStop(e){ if (e.key === "Escape") stopMatrix(); }
  document.addEventListener("keydown", escStop, { once: true });
}
function stopMatrix(){
  if (matrixState.intervalId) clearInterval(matrixState.intervalId);
  matrixState.intervalId = null;
  matrixState.running = false;
  matrixCanvas.style.display = "none";
  const ctx = matrixCanvas.getContext && matrixCanvas.getContext("2d");
  if (ctx) ctx.clearRect(0,0,matrixCanvas.width,matrixCanvas.height);
}

// --- Easter Eggs dispatcher ---
function checkEasterEggs(input){
  const lower = input.trim().toLowerCase();
  stopMatrix();
  document.body.style.transform = "";
  rickrollContainer.style.display = "none";

  // Never let an easter egg/search clear Nova's saved theme or custom background.
  // Settings.js owns the page theme, so only restore it if an old effect changed it.
  if (window.NovaSettings && typeof window.NovaSettings.applySettings === "function") {
    window.NovaSettings.applySettings(window.NovaSettings.loadSettings());
  }

  if (!lower) return false;
  if (lower === "67"){ rickrollContainer.style.display = "block"; window.scrollTo({top:0,behavior:"smooth"}); return true; }
  if (lower === "matrix"){ startMatrix(); return true; }
  if (lower === "pong"){ window.open("https://sethclydesdale.github.io/browser-pong/","_blank"); return true; }
  if (lower === "nyancat"){ window.open("https://www.nyan.cat","_blank"); return true; }
  if (lower === "flip"){ document.body.style.transition = "transform 1.6s"; document.body.style.transform = "rotate(360deg)"; setTimeout(()=>{ document.body.style.transform = ""; }, 1600); return true; }
  if (lower === "doge" || lower === "credits"){ imagesSection.innerHTML = '<img src="https://dogecoin.com/assets/img/dogecoin-300.png" style="width:160px;height:160px;object-fit:cover;border-radius:8px"/>'; return true; }
  return false;
}

// --- Web search ---
function normalizeWebUrl(url){
  if (!url) return "";

  try {
    const parsed = new URL(url, "https://duckduckgo.com");

    // DuckDuckGo wraps result links through /l/?uddg=...
    // Unwrap them so Nova shows/opens the actual destination.
    if (
      /(^|\.)duckduckgo\.com$/i.test(parsed.hostname) &&
      parsed.pathname === "/l/"
    ) {
      const target = parsed.searchParams.get("uddg");
      if (target) return decodeURIComponent(target);
    }

    return parsed.href;
  } catch {
    return "";
  }
}

function parseWebSearchResults(markdown){
  const results = [];
  const seen = new Set();
  const text = String(markdown || "");

  // Jina/Markdown-style links: [Title](https://example.com)
  const linkRegex = /\[([^\]]{2,180})\]\((https?:\/\/[^)\s]+)\)/g;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const rawTitle = match[1].replace(/\s+/g, " ").trim();
    const rawUrl = match[2];

    // Skip Markdown images/favicons accidentally exposed by the reader.
    if (
      /!\s*\[/i.test(rawTitle) ||
      /\bimage\s*\d*\b/i.test(rawTitle) ||
      /external-content\.duckduckgo\.com/i.test(rawUrl)
    ) {
      continue;
    }

    const title = rawTitle
      .replace(/^\*+|\*+$/g, "")
      .replace(/\\([\[\]()])/g, "$1")
      .trim();

    const url = normalizeWebUrl(rawUrl);
    if (!url || !title || seen.has(url)) continue;

    if (/^https?:\/\/html\.duckduckgo\.com\//i.test(url)) continue;
    if (/duckduckgo\.com\/y\.js/i.test(url)) continue;

    seen.add(url);

    const after = text.slice(match.index + match[0].length);
    const lines = after.split("\n").slice(0, 4)
      .map(line => line.replace(/^[-*#>\s]+/, "").trim())
      .filter(Boolean);

    const snippet = lines.find(line =>
      !/^https?:\/\//i.test(line) &&
      !/^\[.*\]\(https?:\/\//.test(line) &&
      line.length > 25
    ) || "";

    results.push({ title, url, snippet });
    if (results.length >= 8) break;
  }

  return results;
}

async function searchWeb(query){
  if (!query) return { results: [], failed: false };

  const target = "https://html.duckduckgo.com/html/?q=" +
    encodeURIComponent(query) + "&kl=us-en";

  const readerUrl = "https://r.jina.ai/" + target;

  try {
    const res = await fetch(readerUrl, {
      headers: { "Accept": "text/plain" }
    });

    if (!res.ok) throw new Error("Web search gateway returned " + res.status);

    const body = await res.text();
    return { results: parseWebSearchResults(body), failed: false };
  } catch (err) {
    console.warn("Nova web search failed:", err);
    return { results: [], failed: true };
  }
}

function getWebFaviconUrl(resultUrl){
  try {
    const parsed = new URL(resultUrl);
    return parsed.origin + "/favicon.ico";
  } catch {
    return "";
  }
}

function novaFallbackFavicon(){
  return "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="12" fill="#0f75a8"/>' +
      '<circle cx="32" cy="32" r="18" fill="none" stroke="white" stroke-width="5"/>' +
      '<path d="M14 32h36M32 14c7 7 7 29 0 36M32 14c-7 7-7 29 0 36" fill="none" stroke="white" stroke-width="3"/>' +
      '</svg>'
    );
}

function renderWebResults(results, query){
  if (!webSearchContainer || !webSearchResults) return;

  webSearchResults.innerHTML = "";

  if (!results.length) {
    webSearchContainer.classList.remove("visible");
    return;
  }

  results.forEach(result => {
    const card = document.createElement("article");
    card.className = "web-result";

    const header = document.createElement("div");
    header.className = "web-result-head";

    const favicon = document.createElement("img");
    favicon.className = "web-result-favicon";
    favicon.alt = "";
    favicon.loading = "lazy";
    favicon.src = getWebFaviconUrl(result.url);
    favicon.onerror = function () {
      favicon.onerror = null;
      favicon.src = novaFallbackFavicon();
    };

    const link = document.createElement("a");
    link.href = result.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = result.title;

    header.appendChild(favicon);
    header.appendChild(link);

    const url = document.createElement("div");
    url.className = "web-result-url";
    try {
      url.textContent = new URL(result.url).hostname;
    } catch {
      url.textContent = result.url;
    }

    const snippet = document.createElement("div");
    snippet.className = "web-result-snippet";
    snippet.textContent = result.snippet || "Open this result to view the website.";

    card.appendChild(header);
    card.appendChild(url);
    card.appendChild(snippet);
    webSearchResults.appendChild(card);
  });

  webSearchContainer.classList.add("visible");
  webSearchResults.setAttribute("data-query", query);
}

async function loadWebResults(query){
  if (!webSearchContainer || !webSearchResults) return;

  webSearchContainer.classList.remove("visible");
  webSearchResults.innerHTML = "<p>Searching the web...</p>";

  const search = await searchWeb(query);

  if (search.results.length) {
    renderWebResults(search.results, query);
  } else {
    const fallbackUrl = search.failed
      ? "https://www.google.com/search?q=" + encodeURIComponent(query)
      : "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query);

    const fallbackName = search.failed ? "Google Search" : "DuckDuckGo";

    webSearchResults.innerHTML =
      '<p>No web results loaded. <a href="' + fallbackUrl +
      '" target="_blank" rel="noopener noreferrer" style="color:#bfeaff">' +
      'Open ' + fallbackName + '</a></p>';

    webSearchContainer.classList.add("visible");
  }
}

// --- Main openWebsite ---
async function openWebsite(){
  const input = urlInput.value.trim();
  stopMatrix();
  suggestionBox.innerHTML = ""; suggestionBox.classList.remove("show");
  resultContainer.classList.remove("visible");
  if (webSearchContainer) webSearchContainer.classList.remove("visible");
  if (webSearchResults) webSearchResults.innerHTML = "";
  dictionaryContainer.style.display = "none";
  timelineContainer.style.display = "none";
  rickrollContainer.style.display = "none";
  imagesSection.innerHTML = ""; videosSection.innerHTML = ""; imagesList = []; currentLightIndex = -1;
  commonsOffset = 0;
  currentQuery = input;

  if (!input) { alert("Please enter something!"); return; }
  if (checkEasterEggs(input)) return;

  // URL direct open
  if (input.includes(".") || input.startsWith("http://") || input.startsWith("https://")){
    window.open(formatURL(input), "_blank");
    return;
  }

  showSpinner();
  const webResultsEnabled = localStorage.getItem("novaWebResults") !== "false";
  const webResultsPromise = webResultsEnabled
    ? loadWebResults(input)
    : Promise.resolve();

  if (!webResultsEnabled && webSearchContainer) {
    webSearchContainer.classList.remove("visible");
    if (webSearchResults) webSearchResults.innerHTML = "";
  }

  try {
    // 1) Wiki summary
    const summary = await getWikiSummary(input);
    await webResultsPromise;
    if (!summary) {
      // Web results can still make this a useful search even without Wikipedia.
      resultContainer.classList.remove("visible");
      dictionaryContainer.style.display = "none";
      timelineContainer.style.display = "none";
      hideSpinner();
      return;
    }
    wikiSummaryEl.innerHTML = `<h2 style="margin-top:0">${escapeHtml(summary.title)}</h2>
      ${summary.thumbnail ? `<img src="${summary.thumbnail}" alt="${escapeHtml(summary.title)}">` : ""}
      <p>${escapeHtml(summary.extract)}</p>
      <p><a href="${summary.fullurl}" target="_blank" rel="noopener" style="color:#a8d0e6">Read more on Wikipedia</a></p>`;

    // 2) Wikimedia images (first batch)
    try {
      await loadMoreImages();
    } catch (err) { console.warn("loadMoreImages error", err); }

    // 3) Videos
    videosSection.innerHTML = "<p style='color:#d6eefb'>Loading videos...</p>";
    try {
      const commonsMedia = await getCommonsMedia(input, 0);
      const peerTube = await fetchPeerTubeVideos(input, 5);
      const dailymotion = await fetchDailymotionVideos(input, 5);

      const allVideos = [
        ...commonsMedia.videos.map(src => ({ embed: src, type: "commons" })),
        ...peerTube.map(v => ({ embed: v.embed, type: "peertube", title: v.title })),
        ...dailymotion.map(v => ({ embed: v.embed, type: "dailymotion", title: v.title }))
      ];

      if (allVideos.length === 0) {
        videosSection.innerHTML = "<p style='color:#d6eefb'>No related videos found.</p>";
      } else {
        videosSection.innerHTML = allVideos.map(v => {
          if(v.type === "commons") return `<video src="${v.embed}" controls></video>`;
          else return `<iframe src="${v.embed}" title="${v.title||''}" frameborder="0" allowfullscreen style="width:160px;height:110px;border-radius:8px;"></iframe>`;
        }).join("");
      }
    } catch(err){
      console.warn("Combined videos fetch error", err);
      videosSection.innerHTML = "<p style='color:#ffd4d4'>Videos unavailable sorry :/ </p>";
    }

    resultContainer.classList.add("visible");

    // 4) Dictionary
    try {
      const dict = await getDictionaryDefinition(input);
      dictionaryResults.innerHTML = "";
      if (!dict) dictionaryResults.innerHTML = `<p class="errorMsg">No dictionary definition found.</p>`;
      else {
        if (dict.phonetics && dict.phonetics.length) dictionaryResults.innerHTML += `<p class="phonetics">Pronunciation: ${escapeHtml(dict.phonetics[0].text||"")}</p>`;
        dict.meanings.forEach(m=>{
          dictionaryResults.innerHTML += `<h4 style="margin-bottom:6px">${escapeHtml(m.partOfSpeech)}</h4>`;
          m.definitions.forEach((d,i)=>{
            dictionaryResults.innerHTML += `<div class="definition"><strong>${i+1}.</strong> ${escapeHtml(d.definition)}${d.example?`<br><em>Example: ${escapeHtml(d.example)}</em>`:''}</div>`;
          });
        });
      }
      dictionaryContainer.style.display = "block";
    } catch (err){ console.warn("dictionary error", err); dictionaryResults.innerHTML = `<p class="errorMsg">Dictionary lookup error.</p>`; dictionaryContainer.style.display="block"; }

    // 5) Timeline
    try {
      const events = extractTimelineFromText(summary.extract || "");
      renderTimeline(events);
    } catch (err) { console.warn("timeline error", err); }

  } catch (err) {
    console.error("openWebsite error:", err);
    alert("Something went wrong fetching info.");
  } finally {
    hideSpinner();
  }
}

// --- loadMoreImages (infinite scroll) ---
async function loadMoreImages(){
  if (!currentQuery) return;
  const { images } = await getCommonsMedia(currentQuery, commonsOffset);
  commonsOffset += 20;
  for (const src of images){
    const img = document.createElement("img");
    img.src = src;
    img.alt = currentQuery;
    img.loading = "lazy";
    img.onclick = () => {
      const idx = imagesList.indexOf(src);
      openLightbox(idx >= 0 ? idx : (imagesList.push(src)-1));
    };
    imagesSection.appendChild(img);
    imagesList.push(src);
  }
}

imagesSection.addEventListener("scroll", async function(){
  if (this.scrollTop + this.clientHeight >= this.scrollHeight - 30){
    try { await loadMoreImages(); } catch (err) { console.warn("infinite scroll failed", err); }
  }
});

// Utility: remove active effects on new search via input change
urlInput.addEventListener("input", ()=> {
  stopMatrix();
  document.body.style.transform = "";
});

// Make input clickable suggestions disappear on outside click
document.addEventListener("click", (e)=>{
  if (!suggestionBox.contains(e.target) && e.target !== urlInput) { suggestionBox.innerHTML=""; suggestionBox.classList.remove("show"); }
});

urlInput.focus();

// ================== HISTORY & SHORTCUTS ==================
function saveToHistory(url) {
    let history = JSON.parse(localStorage.getItem("nova_history")) || [];
    history.push({ url: url, time: new Date().toLocaleString() });
    localStorage.setItem("nova_history", JSON.stringify(history));
}

function showHistory() {
    let history = JSON.parse(localStorage.getItem("nova_history")) || [];
    let popup = document.createElement("div");
    popup.id = "novaHistoryPopup";
    popup.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:60%;height:60%;background:#111;color:white;border:2px solid #555;padding:20px;overflowY:auto;z-index:10000;fontFamily:monospace;";
    let html = "<h2>Your History</h2><hr>";
    history.forEach(entry => { html += `<p><b>${entry.time}</b> — ${entry.url}</p>`; });
    html += `<button id='closeNovaHistory' style='margin-top:15px;padding:8px;'>Close</button>`;
    popup.innerHTML = html;
    document.body.appendChild(popup);
    document.getElementById("closeNovaHistory").onclick = () => popup.remove();
}

document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key.toLowerCase() === "h") { e.preventDefault(); showHistory(); }
    if (e.ctrlKey && e.key.toLowerCase() === "r") { e.preventDefault(); localStorage.clear(); alert("Nova settings have been reset!"); }
});

// ================== CALCULATOR / GRAPH SYSTEM ==================
const calcWrapper = document.createElement("div");
calcWrapper.id = "Clac";
calcWrapper.style.cssText = `width:92%;max-width:780px;margin:14px auto;padding:16px;border-radius:12px;background:rgba(255,255,255,0.95);color:#111;font-family:"Pixelify Sans",monospace;display:none;box-shadow:0 4px 18px rgba(0,0,0,0.2);position:relative;transition:all 0.25s ease;`;

// FIX: Changed .search-container to .search-wrap
document.querySelector(".search-wrap")?.insertAdjacentElement("afterend", calcWrapper);

const calcInput = document.createElement("input");
calcInput.type = "text";
calcInput.placeholder = "Type your calculation (supports x for graph)!";
calcInput.style.cssText = "width:100%;padding:14px 16px;font-size:20px;border-radius:8px;border:1px solid #ccc;margin-bottom:12px;box-sizing:border-box;outline:none;";
calcWrapper.appendChild(calcInput);

const calcResult = document.createElement("div");
calcResult.style.cssText = "width:100%;min-height:48px;padding:12px 14px;background:#f3f3f3;border-radius:8px;font-size:22px;color:#0f75a8;cursor:text;";
calcWrapper.appendChild(calcResult);

const graphCanvas = document.createElement("canvas");
graphCanvas.width = 720;
graphCanvas.height = 360;
graphCanvas.style.cssText = "width:100%;margin-top:16px;background:#0b0b0b;border-radius:10px;display:none;";
calcWrapper.appendChild(graphCanvas);
const gctx = graphCanvas.getContext("2d");

function fixExpression(expr){ return expr.replace(/(\d)(x)/gi, "$1*$2"); }
function isSimple(expr){ return /^[0-9+\-*/().\s]+$/.test(expr); }
function hasVariable(expr){ return /x/i.test(expr); }
function safeEval(expr){ try { return Function(`"use strict"; return (${expr})`)(); } catch { return "Error"; } }

function drawGrid(w, h, scale){
  gctx.strokeStyle = "rgba(255,255,255,0.1)"; gctx.lineWidth = 1;
  for (let x = 0; x <= w; x += scale){ gctx.beginPath(); gctx.moveTo(x, 0); gctx.lineTo(x, h); gctx.stroke(); }
  for (let y = 0; y <= h; y += scale){ gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(w, y); gctx.stroke(); }
}
function drawAxes(w, h, scale){
  gctx.strokeStyle = "rgba(255,255,255,0.8)"; gctx.lineWidth = 2;
  gctx.beginPath(); gctx.moveTo(0, h/2); gctx.lineTo(w, h/2); gctx.stroke();
  gctx.beginPath(); gctx.moveTo(w/2, 0); gctx.lineTo(w/2, h); gctx.stroke();
  gctx.fillStyle = "#fff"; gctx.font = "12px monospace";
  for (let i = -10; i <= 10; i++){
    gctx.fillText(i, w/2 + i * scale + 2, h/2 - 4);
    gctx.fillText(-i, w/2 + 4, h/2 - i * scale + 4);
  }
}
function drawGraph(expr){
  const w = graphCanvas.width, h = graphCanvas.height, scale = w / 20;
  gctx.clearRect(0, 0, w, h); drawGrid(w, h, scale); drawAxes(w, h, scale);
  gctx.strokeStyle = "#00c8ff"; gctx.lineWidth = 2; gctx.beginPath(); let first = true;
  for (let px = 0; px <= w; px++){
    const x = (px - w/2) / scale; let y;
    try { y = safeEval(expr.replace(/x/gi, `(${x})`)); } catch { continue; }
    const py = h/2 - y * scale;
    if (first){ gctx.moveTo(px, py); first = false; } else { gctx.lineTo(px, py); }
  }
  gctx.stroke(); graphCanvas.style.display = "block";
}

function updateCalc(){
  let val = calcInput.value.trim();
  if (!val){ calcResult.textContent = ""; graphCanvas.style.display = "none"; return; }
  val = fixExpression(val);
  if (isSimple(val) && !hasVariable(val)){ calcResult.textContent = `${val} = ${safeEval(val)}`; graphCanvas.style.display = "none"; return; }
  if (hasVariable(val)){ calcResult.textContent = `y = ${val}`; drawGraph(val); return; }
  calcResult.textContent = `= ${safeEval(val)}`;
}
calcInput.addEventListener("input", updateCalc);
calcResult.addEventListener("click", ()=>calcInput.focus());

function checkCalcTrigger(query){
  const q = query.toLowerCase();
  if (q.match(/[0-9+\-*/().x]/) || q.includes("calc")){
    calcWrapper.style.display = "block"; updateCalc(); return true;
  }
  calcWrapper.style.display = "none"; graphCanvas.style.display = "none"; return false;
}

const originalOpen = openWebsite;
openWebsite = async function(){
  const val = urlInput.value;
  const handled = checkCalcTrigger(val);
  // FIX: Added return so it doesn't search Wikipedia for math equations
  if (handled) return; 
  calcWrapper.style.display = "none";
  await originalOpen();
};

// ================== MAP SYSTEM ==================
/*
  Nova Map
  - Uses Leaflet + OpenStreetMap
  - Does not require an API key
  - Handles Leaflet loading failures instead of crashing Nova
  - Supports places, addresses, "near me", and simple POI searches
*/
(async function(){
  const NOMINATIM = "https://nominatim.openstreetmap.org";
  const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  const POI_TYPES = ["coffee","cafe","restaurant","park","museum","hotel","atm","bank","pharmacy","gas station","grocery"];
  const MAP_ZOOM_CITY = 12;
  const MAP_ZOOM_POI = 15;

  async function loadLeaflet(){
    if (window.L) return true;

    if (!document.querySelector('link[data-nova-leaflet="css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.dataset.novaLeaflet = "css";
      document.head.appendChild(link);
    }

    const existing = document.querySelector('script[data-nova-leaflet="js"]');
    if (existing) {
      return new Promise(resolve => {
        if (window.L) return resolve(true);
        existing.addEventListener("load", () => resolve(!!window.L), { once:true });
        existing.addEventListener("error", () => resolve(false), { once:true });
      });
    }

    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.async = true;
      script.dataset.novaLeaflet = "js";
      script.onload = () => resolve(!!window.L);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function isMapIntent(q){
    if (!q) return false;
    const s = q.trim().toLowerCase();

    if (/\b(map|where is|where's|near me|directions|how to get to|location of)\b/.test(s)) return true;
    if (POI_TYPES.some(type => s.includes(type))) return true;

    // Addresses / city-state searches such as "Hampton VA" or "Hampton, VA"
    if (/\b(?:va|virginia|md|maryland|dc|nc|north carolina|ny|new york|ca|california|fl|florida|tx|texas|pa|pennsylvania)\b/i.test(q)) return true;
    if (/\d+\s+[^,]+\s+(?:st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|ln|lane|ct|court|way|hwy|highway)\b/i.test(q)) return true;
    if (/^[A-Za-z .'-]{3,40},\s*[A-Za-z .'-]{2,40}$/.test(q)) return true;

    return false;
  }

  function createMapUI(){
    const old = document.getElementById("novaMapContainer");
    if (old) old.remove();

    const container = document.createElement("aside");
    container.id = "novaMapContainer";
    container.style.cssText = [
      "width:44%",
      "min-width:260px",
      "background:rgba(0,0,0,0.28)",
      "padding:12px",
      "border-radius:12px",
      "box-sizing:border-box",
      "color:white",
      "display:flex",
      "flex-direction:column",
      "gap:10px"
    ].join(";");

    container.innerHTML = `
      <h3 style="margin:0">Map</h3>
      <div id="novaMapWrapper" style="height:360px;width:100%;border-radius:8px;overflow:hidden;background:#0b1220"></div>
      <div id="novaMapResults" style="max-height:180px;overflow:auto;font-size:13px;color:#d6eefb"></div>
    `;

    const resultContainer = document.getElementById("resultContainer");
    if (!resultContainer) {
      document.querySelector("main").appendChild(container);
    } else {
      resultContainer.classList.add("visible");
      resultContainer.appendChild(container);
    }

    return {
      container,
      mapWrapper: document.getElementById("novaMapWrapper"),
      list: document.getElementById("novaMapResults")
    };
  }

  function buildOSMLink(lat, lon){
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=18/${lat}/${lon}`;
  }

  async function geocode(query, limit=8){
    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(query)}&limit=${limit}&accept-language=en`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Nova Map geocoding failed:", err);
      return [];
    }
  }

  async function searchPOIsNear(lat, lon, term, radiusMeters=3000, limit=12){
    const latDelta = radiusMeters / 111000;
    const lonDelta = radiusMeters / (111000 * Math.max(Math.cos(lat * Math.PI / 180), 0.2));
    const viewbox = [
      lon - lonDelta,
      lat + latDelta,
      lon + lonDelta,
      lat - latDelta
    ].join(",");

    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(term)}&limit=${limit}&viewbox=${encodeURIComponent(viewbox)}&bounded=1&accept-language=en`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Nova Map nearby search failed:", err);
      return [];
    }
  }

  function addOSMLayer(map){
    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }
    ).addTo(map);
  }

  function showMapError(list, message){
    list.innerHTML = `<div style="padding:8px">${escapeHtml(message)}</div>`;
  }

  async function showMapForQuery(rawQuery){
    const q = (rawQuery || "").trim();
    if (!isMapIntent(q)) return;

    const { mapWrapper, list } = createMapUI();
    list.innerHTML = "<div>Loading map…</div>";

    const leafletReady = await loadLeaflet();
    if (!leafletReady || !window.L) {
      showMapError(
        list,
        "The map library could not load. Check your internet connection or allow unpkg.com, then try again."
      );
      return;
    }

    if (q.match(/\bnear me\b/i)) {
      if (!navigator.geolocation) {
        showMapError(list, "Your browser does not provide location access.");
        return;
      }

      list.innerHTML = "<div>Requesting your location…</div>";

      navigator.geolocation.getCurrentPosition(async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const map = L.map(mapWrapper).setView([lat, lon], MAP_ZOOM_POI);
        addOSMLayer(map);

        L.marker([lat, lon])
          .addTo(map)
          .bindPopup("You are here")
          .openPopup();

        const foundPOI = POI_TYPES.find(type =>
          q.toLowerCase().includes(type)
        );

        if (!foundPOI) {
          list.innerHTML = "<div>Centered on your location.</div>";
          return;
        }

        list.innerHTML = `<div style="margin-bottom:6px">Searching for <strong>${escapeHtml(foundPOI)}</strong> near you…</div>`;

        const pois = await searchPOIsNear(lat, lon, foundPOI);
        if (!pois.length) {
          list.innerHTML += "<div>No nearby results found.</div>";
          return;
        }

        pois.forEach(p => {
          const pLat = Number(p.lat);
          const pLon = Number(p.lon);
          if (!Number.isFinite(pLat) || !Number.isFinite(pLon)) return;

          const marker = L.marker([pLat, pLon])
            .addTo(map)
            .bindPopup(escapeHtml(p.display_name || "Location"));

          const row = document.createElement("div");
          row.style.cssText = "padding:7px;cursor:pointer;margin-bottom:4px";
          row.innerHTML = `<b>${escapeHtml((p.display_name || "Location").split(",")[0])}</b>`;
          row.onclick = () => {
            map.setView([pLat, pLon], MAP_ZOOM_POI);
            marker.openPopup();
          };
          list.appendChild(row);
        });

        setTimeout(() => map.invalidateSize(), 50);
      }, () => {
        showMapError(list, "Location permission was denied or unavailable.");
      }, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      });

      return;
    }

    const results = await geocode(q);
    if (!results.length) {
      showMapError(list, "No map results found for that search.");
      return;
    }

    const first = results[0];
    const lat = Number(first.lat);
    const lon = Number(first.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      showMapError(list, "The map service returned an invalid location.");
      return;
    }

    const map = L.map(mapWrapper).setView([lat, lon], MAP_ZOOM_CITY);
    addOSMLayer(map);

    list.innerHTML = "";

    results.forEach(r => {
      const rLat = Number(r.lat);
      const rLon = Number(r.lon);
      if (!Number.isFinite(rLat) || !Number.isFinite(rLon)) return;

      const name = r.display_name || "Location";
      const marker = L.marker([rLat, rLon])
        .addTo(map)
        .bindPopup(
          `<strong>${escapeHtml(name)}</strong><br>
           <a href="${buildOSMLink(rLat, rLon)}" target="_blank" rel="noopener">Open in OpenStreetMap</a>`
        );

      const row = document.createElement("div");
      row.style.cssText = "padding:8px;cursor:pointer;border-radius:6px";
      row.innerHTML =
        `<b>${escapeHtml(name.split(",")[0])}</b><br>
         <span style="font-size:12px;color:#9fdff6">${escapeHtml(name.split(",").slice(1).join(","))}</span>`;

      row.onclick = () => {
        map.setView([rLat, rLon], MAP_ZOOM_POI);
        marker.openPopup();
      };

      list.appendChild(row);
    });

    setTimeout(() => map.invalidateSize(), 50);
  }

  if (typeof openWebsite === "function") {
    const originalOpenWebsite = openWebsite;

    openWebsite = async function(){
      try {
        await originalOpenWebsite();
      } catch (err) {
        console.warn("Nova search error:", err);
      }

      try {
        await showMapForQuery(urlInput.value || "");
      } catch (err) {
        console.warn("Nova Map error:", err);
      }

      stopSnow();
    };
  }
})();
