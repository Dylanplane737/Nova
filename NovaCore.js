// Placeholder for future easter eggs
function stopSnow() {}

// State
let highlightedIndex = -1;
let debounceTimer;
let commonsOffset = 0;
let currentQuery = "";
let webSearchRequestCounter = 0;
const webSearchPageCache = new Map();
const WEB_PROVIDER_PAGE_SIZE = 10;
const WEB_UI_PAGE_SIZE = 10;
let imagesList = [];
let currentLightIndex = -1;
let matrixState = { running: false, intervalId: null, escapeHandler: null };

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
const timelineContainer = document.getElementById("timelineContainer");
const timelineList = document.getElementById("timelineList");
const rickrollContainer = document.getElementById("rickrollContainer");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeLightbox = document.getElementById("closeLightbox");
const lightPrev = document.getElementById("lightPrev");
const lightNext = document.getElementById("lightNext");
const matrixCanvas = document.getElementById("matrixCanvas");

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

  if (e.key === "ArrowDown" && items.length) {
    e.preventDefault();
    highlightedIndex = (highlightedIndex + 1) % items.length;
    updateHighlight(items);
  } else if (e.key === "ArrowUp" && items.length) {
    e.preventDefault();
    highlightedIndex = (highlightedIndex - 1 + items.length) % items.length;
    updateHighlight(items);
  } else if (e.key === "Enter") {
    // Enter must submit the search even when autocomplete has no suggestions.
    // If a suggestion is highlighted, select it first; Enter again runs that search.
    if (
      suggestionBox.classList.contains("show") &&
      highlightedIndex >= 0 &&
      items[highlightedIndex]
    ) {
      e.preventDefault();
      urlInput.value = items[highlightedIndex].textContent;
      suggestionBox.innerHTML = "";
      suggestionBox.classList.remove("show");
      highlightedIndex = -1;
      return;
    }

    e.preventDefault();
    if (typeof openWebsite === "function") openWebsite();
  } else if (e.key === "Escape") {
    suggestionBox.innerHTML = "";
    suggestionBox.classList.remove("show");
    highlightedIndex = -1;
  }
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

  // Wikipedia lead paragraphs can repeat dates and include awkward line breaks.
  const normalized = String(text)
    .replace(/\r/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
  if (!normalized) return [];

  const sentences = normalized.split(/(?<=[.!?;])\s+|\n+/);
  const yearRegex = /\b(1[0-9]{3}|20[0-9]{2})\b/g;
  const events = [];
  const seen = new Set();

  for (const sentence of sentences) {
    const clean = sentence.replace(/\s+/g, " ").trim();
    if (!clean) continue;

    const yearMatch = clean.match(yearRegex);
    if (!yearMatch) continue;

    const year = Number(yearMatch[0]);
    const description = clean.length > 420 ? clean.slice(0, 417).trimEnd() + "…" : clean;
    const key = year + "||" + description.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;

    seen.add(key);
    events.push({ year, text: description });
  }

  // Keep the timeline readable and avoid turning long text into an enormous list.
  events.sort((a, b) => a.year - b.year || a.text.localeCompare(b.text));
  return events.slice(0, 30);
}

function renderTimeline(events){
  timelineList.innerHTML = "";
  const previousCount = timelineContainer.querySelector(".timeline-count");
  if (previousCount) previousCount.remove();

  if (!events.length) {
    timelineContainer.style.display = "none";
    return;
  }

  const count = document.createElement("p");
  count.className = "timeline-count";
  count.textContent = "Chronological highlights · " + events.length + (events.length === 1 ? " dated detail" : " dated details");
  timelineList.insertAdjacentElement("beforebegin", count);

  for (const ev of events) {
    const item = document.createElement("article");
    item.className = "timeline-item";

    const year = document.createElement("span");
    year.className = "timeline-year";
    year.textContent = String(ev.year);

    const description = document.createElement("span");
    description.className = "timeline-description";
    description.textContent = ev.text;

    item.append(year, description);
    timelineList.appendChild(item);
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
  matrixState.escapeHandler = function escStop(e) {
    if (e.key === "Escape") stopMatrix();
  };
  document.addEventListener("keydown", matrixState.escapeHandler);
}
function stopMatrix(){
  if (matrixState.intervalId) clearInterval(matrixState.intervalId);
  matrixState.intervalId = null;
  matrixState.running = false;
  if (matrixState.escapeHandler) {
    document.removeEventListener("keydown", matrixState.escapeHandler);
    matrixState.escapeHandler = null;
  }
  matrixCanvas.style.display = "none";
  const ctx = matrixCanvas.getContext && matrixCanvas.getContext("2d");
  if (ctx) ctx.clearRect(0,0,matrixCanvas.width,matrixCanvas.height);
}

const NOVA_EASTER_EGG_QUERIES = new Set([
  "67", "rickroll", "matrix", "pong", "nyancat", "flip", "doge", "credits"
]);

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
  if (lower === "67" || lower === "rickroll"){ rickrollContainer.style.display = "block"; window.scrollTo({top:0,behavior:"smooth"}); return true; }
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

function parseWebSearchResults(markdown, limit = WEB_PROVIDER_PAGE_SIZE){
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
    if (results.length >= limit) break;
  }

  return results;
}

function parseWebSearchHTML(html){
  const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
  const results = [];
  const seen = new Set();
  const candidates = doc.querySelectorAll(".result, .web-result, .result__body");
  candidates.forEach(card => {
    const link = card.querySelector("a.result__a, .result__title a, h2 a");
    if (!link) return;
    const title = (link.textContent || "").replace(/\s+/g, " ").trim();
    const url = normalizeWebUrl(link.getAttribute("href") || "");
    if (!title || !url || seen.has(url) || /duckduckgo\.com/i.test(new URL(url).hostname)) return;
    seen.add(url);
    const snippetNode = card.querySelector(".result__snippet, .result__body, .result__snippet");
    const snippet = snippetNode ? (snippetNode.textContent || "").replace(/\s+/g, " ").trim() : "";
    results.push({ title, url, snippet });
  });
  return results;
}

function getWebSearchBucket(query){
  if (!webSearchPageCache.has(query)) webSearchPageCache.set(query, { vqd: "", batches: new Map() });
  const value = webSearchPageCache.get(query);
  webSearchPageCache.delete(query);
  webSearchPageCache.set(query, value);
  while (webSearchPageCache.size > 8) webSearchPageCache.delete(webSearchPageCache.keys().next().value);
  return value;
}

async function searchWebBatch(query, batchIndex){
  const bucket = getWebSearchBucket(query);
  if (bucket.batches.has(batchIndex)) return bucket.batches.get(batchIndex);

  // Fetch a fresh provider page for each Nova page instead of assuming
  // DuckDuckGo returns 30 results in one HTML response.
  const offset = batchIndex * WEB_PROVIDER_PAGE_SIZE;
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("kl", "us-en");
  if (offset > 0) params.set("s", String(offset));

  const target = "https://html.duckduckgo.com/html/?" + params.toString();
  const readerUrl = "https://r.jina.ai/" + target;
  let body = "";
  let results = [];

  try {
    const response = await fetch(readerUrl, {
      headers: { "Accept": "text/plain", "X-Respond-With": "html" }
    });
    if (!response.ok) throw new Error("Web search gateway returned " + response.status);
    body = await response.text();
    results = parseWebSearchHTML(body);
    if (!results.length) results = parseWebSearchResults(body, WEB_PROVIDER_PAGE_SIZE);

    // Retry in Markdown mode if the HTML response could not be parsed.
    if (!results.length) {
      const markdownResponse = await fetch(readerUrl, {
        headers: { "Accept": "text/plain" }
      });
      if (!markdownResponse.ok) throw new Error("Web search gateway returned " + markdownResponse.status);
      body = await markdownResponse.text();
      results = parseWebSearchResults(body, WEB_PROVIDER_PAGE_SIZE);
    }
  } catch (error) {
    console.warn("Nova web search HTML fetch failed; trying Markdown:", error);
    try {
      const fallback = await fetch(readerUrl, {
        headers: { "Accept": "text/plain" }
      });
      if (!fallback.ok) throw new Error("Web search gateway returned " + fallback.status);
      body = await fallback.text();
      results = parseWebSearchResults(body, WEB_PROVIDER_PAGE_SIZE);
    } catch (fallbackError) {
      console.warn("Nova web search failed:", fallbackError);
      throw fallbackError;
    }
  }

  const unique = [];
  const seen = new Set();
  results.forEach(item => {
    if (!item || !item.url || seen.has(item.url)) return;
    seen.add(item.url);
    unique.push(item);
  });

  bucket.batches.set(batchIndex, unique);
  return unique;
}

async function searchWeb(query, page = 1){
  if (!query) return { results: [], failed: false, hasNext: false };

  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  try {
    // Each Nova page maps to its own provider offset (0, 10, 20, ...).
    // Source filtering/ranking is applied once, when the page is rendered.
    const results = await searchWebBatch(query, safePage - 1);
    const hasNext = results.length >= WEB_PROVIDER_PAGE_SIZE;
    return { results, failed: false, hasNext };
  } catch (err) {
    console.warn("Nova web search failed:", err);
    return { results: [], failed: true, hasNext: false };
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

function appendWebPagination(page, hasNext, query){
  const pager = document.createElement("nav");
  pager.className = "nova-web-pagination";
  pager.setAttribute("aria-label", "Web result pages");

  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "nova-page-button";
  previous.textContent = "← Previous";
  previous.disabled = page <= 1;
  previous.addEventListener("click", () => {
    if (page > 1) loadWebResults(query, page - 1);
  });

  const current = document.createElement("span");
  current.className = "nova-page-current";
  current.textContent = "Page " + page;

  const next = document.createElement("button");
  next.type = "button";
  next.className = "nova-page-button";
  next.textContent = "Next →";
  next.disabled = !hasNext;
  next.addEventListener("click", () => {
    if (hasNext) loadWebResults(query, page + 1);
  });

  pager.append(previous, current, next);
  webSearchResults.appendChild(pager);
}

function renderWebResults(results, query, page = 1, hasNext = results.length >= 10){
  if (!webSearchContainer || !webSearchResults) return;

  const fetchedCount = results.length;
  if (window.NovaResearchPrepareWebResults && typeof window.NovaResearchPrepareWebResults === "function") {
    results = window.NovaResearchPrepareWebResults(results) || results;
  }

  webSearchResults.innerHTML = "";

  if (!results.length) {
    const empty = document.createElement("p");
    empty.className = "nova-empty-results";
    empty.textContent = window.NovaResearchState &&
      window.NovaResearchState.getActiveMode() === "research"
      ? "No results on this page match your selected source filters. Try another page or loosen the filters."
      : (page > 1 ? "No more web results were found on this page." : "No matching web results were found.");
    webSearchResults.appendChild(empty);
    appendWebPagination(page, hasNext, query);
    webSearchContainer.classList.add("visible");
    webSearchResults.setAttribute("data-query", query);
    webSearchResults.setAttribute("data-page", String(page));
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

    header.append(favicon, link);

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

    const actions = document.createElement("div");
    actions.className = "web-result-actions";

    const menuToggle = document.createElement("button");
    menuToggle.type = "button";
    menuToggle.className = "nova-result-menu-toggle";
    menuToggle.textContent = "⋮";
    menuToggle.title = "More result actions";
    menuToggle.setAttribute("aria-label", "More result actions");
    menuToggle.setAttribute("aria-haspopup", "menu");
    menuToggle.setAttribute("aria-expanded", "false");

    const actionMenu = document.createElement("div");
    actionMenu.className = "web-result-actions-menu";
    actionMenu.setAttribute("role", "menu");

    const cite = document.createElement("button");
    cite.type = "button";
    cite.className = "nova-cite-button nova-result-menu-item";
    cite.setAttribute("role", "menuitem");
    cite.textContent = "Cite";
    cite.addEventListener("click", () => {
      if (typeof window.NovaResearchOpenCitation === "function") {
        window.NovaResearchOpenCitation({
          sourceType: "web",
          title: result.title,
          url: result.url
        });
      }
    });

    actionMenu.appendChild(cite);
    actions.append(menuToggle, actionMenu);

    card.append(header, url, snippet, actions);
    webSearchResults.appendChild(card);
  });

  appendWebPagination(page, hasNext, query);
  webSearchContainer.classList.add("visible");
  webSearchResults.setAttribute("data-query", query);
  webSearchResults.setAttribute("data-page", String(page));
}

function closeWebResultMenus(exceptMenu = null) {
  document.querySelectorAll(".web-result-actions-menu.show").forEach(menu => {
    if (menu === exceptMenu) return;
    menu.classList.remove("show");
    const toggle = menu.parentElement && menu.parentElement.querySelector(".nova-result-menu-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  });
}

document.addEventListener("click", event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const toggle = target.closest(".nova-result-menu-toggle");
  if (toggle) {
    const actions = toggle.closest(".web-result-actions");
    const menu = actions && actions.querySelector(".web-result-actions-menu");
    if (!menu) return;

    const shouldOpen = !menu.classList.contains("show");
    closeWebResultMenus(menu);
    menu.classList.toggle("show", shouldOpen);
    toggle.setAttribute("aria-expanded", String(shouldOpen));
    event.preventDefault();
    return;
  }

  if (target.closest(".web-result-actions-menu")) {
    closeWebResultMenus();
    return;
  }

  closeWebResultMenus();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeWebResultMenus();
});

async function loadWebResults(query, page = 1){
  if (!webSearchContainer || !webSearchResults) return;

  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const requestToken = ++webSearchRequestCounter;
  const tabState = window.NovaTabsState;
  const originTabId = tabState && typeof tabState.getActiveTabId === "function"
    ? tabState.getActiveTabId()
    : null;
  const requestIsCurrent = () => {
    if (requestToken !== webSearchRequestCounter) return false;
    if (urlInput.value.trim() !== query) return false;
    if (
      originTabId !== null &&
      window.NovaTabsState &&
      typeof window.NovaTabsState.getActiveTabId === "function" &&
      window.NovaTabsState.getActiveTabId() !== originTabId
    ) return false;
    return true;
  };

  webSearchContainer.classList.remove("visible");
  webSearchResults.innerHTML = "<p>Searching the web...</p>";
  webSearchResults.setAttribute("data-query", query);
  webSearchResults.setAttribute("data-page", String(safePage));

  const search = await searchWeb(query, safePage);
  if (!requestIsCurrent()) return;

  if (search.results.length) {
    renderWebResults(search.results, query, safePage, !!search.hasNext);
  } else if (safePage > 1 && !search.failed) {
    webSearchResults.innerHTML = "";
    const empty = document.createElement("p");
    empty.className = "nova-empty-results";
    empty.textContent = "No more web results were found. Go back to the previous page or try a different search.";
    webSearchResults.appendChild(empty);
    appendWebPagination(safePage, false, query);
    webSearchContainer.classList.add("visible");
    webSearchResults.setAttribute("data-query", query);
    webSearchResults.setAttribute("data-page", String(safePage));
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
    webSearchResults.setAttribute("data-query", query);
    webSearchResults.setAttribute("data-page", String(safePage));
  }
}

// Allow the tab switcher to retry a web search that was interrupted by
// switching tabs while its result request was still in flight.
window.NovaReloadWebResults = function (query, page = 1) {
  return loadWebResults(query, page);
};

window.NovaOpenImageLightbox = function (urls, index) {
  imagesList = Array.isArray(urls) ? urls.slice() : [];
  currentLightIndex = -1;
  openLightbox(index);
};

// --- Main openWebsite ---
async function openWebsite(){
  const input = urlInput.value.trim();
  stopMatrix();
  suggestionBox.innerHTML = ""; suggestionBox.classList.remove("show");
  resultContainer.classList.remove("visible");
  if (webSearchContainer) webSearchContainer.classList.remove("visible");
  if (webSearchResults) {
    webSearchResults.innerHTML = "";
    webSearchResults.removeAttribute("data-query");
  }
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

  // Record actual searches (not blank submits, Easter eggs, or direct URLs).
  // Settings can disable history; storage errors must never block a search.
  if (localStorage.getItem("novaSaveHistory") !== "false") saveToHistory(input);

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

    // Research Mode focuses on source lists instead of the legacy
    // summary/media stack; normal Web mode keeps its existing behavior.
    if (
      window.NovaResearchState &&
      typeof window.NovaResearchState.getActiveMode === "function" &&
      window.NovaResearchState.getActiveMode() === "research"
    ) {
      hideSpinner();
      return;
    }

    if (!summary) {
      // Web results can still make this a useful search even without Wikipedia.
      resultContainer.classList.remove("visible");
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
function saveToHistory(query) {
  const value = String(query || "").trim();
  if (!value || localStorage.getItem("novaSaveHistory") === "false") return;

  try {
    const stored = JSON.parse(localStorage.getItem("nova_history") || "[]");
    const history = Array.isArray(stored) ? stored : [];
    const normalized = value.toLowerCase();

    // Keep only the latest occurrence of each query and cap storage growth.
    const recent = history.filter(entry =>
      String(entry && (entry.url || entry.query) || "").trim().toLowerCase() !== normalized
    );
    recent.push({ url: value, time: new Date().toLocaleString(), timestamp: Date.now() });
    localStorage.setItem("nova_history", JSON.stringify(recent.slice(-100)));
  } catch (error) {
    console.warn("Nova could not save search history:", error);
  }
}

function showHistory() {
  if (document.getElementById("novaHistoryPopup")) return;

  let stored = [];
  try {
    const parsed = JSON.parse(localStorage.getItem("nova_history") || "[]");
    if (Array.isArray(parsed)) stored = parsed;
  } catch (error) {
    console.warn("Nova could not read search history:", error);
  }

  const popup = document.createElement("div");
  popup.id = "novaHistoryPopup";
  popup.setAttribute("role", "presentation");
  popup.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(0,0,0,.58);z-index:10000;";

  const panel = document.createElement("section");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Search history");
  panel.style.cssText = "width:100%;max-width:680px;max-height:82vh;overflow:auto;box-sizing:border-box;background:var(--ns-bg,#101820);color:var(--ns-text,#fff);border:1px solid var(--ns-border,rgba(255,255,255,.28));border-radius:16px;padding:20px;box-shadow:0 18px 60px rgba(0,0,0,.4);font-family:system-ui,sans-serif;text-align:left;";

  const header = document.createElement("div");
  header.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;";
  const heading = document.createElement("h2");
  heading.textContent = "Search History";
  heading.style.cssText = "margin:0;font-size:22px;";
  const close = document.createElement("button");
  close.id = "closeNovaHistory";
  close.type = "button";
  close.textContent = "×";
  close.setAttribute("aria-label", "Close search history");
  close.style.cssText = "margin:0;padding:4px 11px;border-radius:8px;font-size:22px;";
  header.append(heading, close);

  const list = document.createElement("div");
  list.style.cssText = "display:flex;flex-direction:column;gap:7px;";
  const entries = stored.slice().reverse();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.textContent = localStorage.getItem("novaSaveHistory") === "false"
      ? "No saved searches. Turn on “Save search history” in Settings to record future searches."
      : "No searches saved yet. Search for something, then open this panel again with Ctrl+H.";
    list.appendChild(empty);
  } else {
    entries.forEach(entry => {
      const query = String(entry && (entry.url || entry.query) || "").trim();
      if (!query) return;
      const row = document.createElement("button");
      row.type = "button";
      row.style.cssText = "display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;padding:11px 13px;margin:0;border:1px solid var(--ns-border,rgba(255,255,255,.2));border-radius:9px;background:rgba(255,255,255,.06);color:inherit;text-align:left;white-space:normal;overflow-wrap:anywhere;";
      const queryLabel = document.createElement("strong");
      queryLabel.textContent = query;
      const timeLabel = document.createElement("span");
      timeLabel.textContent = String(entry.time || (entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ""));
      timeLabel.style.cssText = "font-size:11px;opacity:.72;";
      row.append(queryLabel, timeLabel);
      row.addEventListener("click", () => {
        urlInput.value = query;
        closePopup();
        if (typeof openWebsite === "function") openWebsite();
      });
      list.appendChild(row);
    });
  }

  panel.append(header, list);
  popup.appendChild(panel);
  document.body.appendChild(popup);

  function closePopup() {
    popup.remove();
    document.removeEventListener("keydown", handleHistoryKey);
  }
  function handleHistoryKey(event) {
    if (event.key === "Escape") closePopup();
  }
  close.addEventListener("click", closePopup);
  popup.addEventListener("click", event => {
    if (event.target === popup) closePopup();
  });
  document.addEventListener("keydown", handleHistoryKey);
}

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key.toLowerCase() === "h") {
    event.preventDefault();
    showHistory();
  }
  // Keep Ctrl+R available for the browser; it must not wipe Nova's settings or history.
});

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
        const activeQuery = String(urlInput.value || "").trim().toLowerCase();
        if (!NOVA_EASTER_EGG_QUERIES.has(activeQuery)) {
          await showMapForQuery(urlInput.value || "");
        }
      } catch (err) {
        console.warn("Nova Map error:", err);
      }

      stopSnow();
    };
  }
})();
