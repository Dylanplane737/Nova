/* Nova Research Mode — DylaOS 9 */
(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const input=$("#urlInput"),web=$("#webSearchContainer"),webResults=$("#webSearchResults"),legacy=$("#resultContainer"),dict=$("#dictionaryContainer"),timeline=$("#timelineContainer");
if(!input||!web||!webResults)return;
const citeKey="novaResearchCitations",prefsKey="novaResearchPreferences",modes=["web","research","images","videos","academic","tools"];
let mode="web",requestId=0;
const defaultPrefs={strict:false,selected:{government:true,university:true,academic:true,reference:true,news:true,nonprofit:true}};
let prefs=loadPrefs();

const css=document.createElement("style");css.id="nova-research-styles";css.textContent=`
#novaSearchModes{display:flex;justify-content:center;gap:7px;flex-wrap:wrap;max-width:900px;margin:10px auto 16px;padding:0 8px}
.nova-mode-button{margin:0;padding:9px 15px;border:1px solid #ffffff42;border-radius:999px;background:#08374d47;color:white;box-shadow:none;font:600 14px system-ui,sans-serif;cursor:pointer}
.nova-mode-button::after,.nova-r-btn::after,.nova-cite-btn::after{display:none}
.nova-mode-button[aria-pressed="true"]{background:#164d68;border-color:#d5f3ff;box-shadow:0 0 0 2px #ffffff19}
#novaResearchResults{display:none;width:92%;max-width:1100px;margin:22px auto 0;padding:16px;box-sizing:border-box;border-radius:12px;background:#0000003d;text-align:left;color:white}
.nova-research-view{display:none}
.nova-video-search-shortcuts{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0 14px;padding:10px;border:1px solid #ffffff29;border-radius:10px;background:#0002}
.nova-video-search-label{font:12px system-ui,sans-serif;color:#d9f1fb}
.nova-video-search-link{display:inline-flex;align-items:center;gap:5px;margin:0;padding:7px 11px;border:1px solid #ffffff38;border-radius:8px;background:#2596be3d;color:#fff;text-decoration:none;font:600 12px system-ui,sans-serif}
.nova-video-search-link:hover{background:#2596be7d;text-decoration:none}.nova-research-view h2{font-size:20px;margin:0 0 8px}
.nova-research-desc,.nova-research-status{color:#d9f1fb;font:13px/1.5 system-ui,sans-serif;margin:0 0 12px}
.nova-research-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:12px}
.nova-research-card{min-width:0;background:#0003;border:1px solid #ffffff24;border-radius:10px;padding:10px;overflow-wrap:anywhere}
.nova-research-card a{color:#c9efff;text-decoration:none;font-weight:700}.nova-research-card a:hover{text-decoration:underline}
.nova-research-card img{display:block;width:100%;height:130px;object-fit:cover;border-radius:7px;margin-bottom:8px;background:#ffffff0f}
.nova-research-card p,.nova-research-meta{font:12px/1.45 system-ui,sans-serif;color:#d3eaf4;margin:7px 0}
.nova-r-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
.nova-r-btn,.nova-cite-btn{margin:0;padding:6px 10px;border:1px solid #ffffff38;border-radius:8px;background:#2596be3d;color:white;box-shadow:none;font:600 12px system-ui,sans-serif}
.nova-r-btn:disabled{opacity:.4;cursor:not-allowed}
.nova-page-row,.nova-web-pagination{display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;margin:18px 0 4px;padding-top:12px;border-top:1px solid #ffffff1f}
.nova-page-label{font:13px system-ui,sans-serif;color:#d9eff8}
#novaResearchSourceControls{display:none;margin:0 0 14px;padding:12px;border:1px solid #ffffff29;border-radius:10px;background:#0002}
.nova-filter-heading{font:600 14px system-ui,sans-serif;margin-bottom:8px}
.nova-filter-grid{display:flex;gap:8px 14px;flex-wrap:wrap}
.nova-filter-grid label,.nova-strict-filter{display:inline-flex;align-items:center;gap:6px;font:12px system-ui,sans-serif;color:#e8f8ff;cursor:pointer}
.nova-filter-grid input,.nova-strict-filter input{accent-color:#2596be}.nova-strict-row{margin-top:10px;padding-top:8px;border-top:1px solid #ffffff22}
.web-result-actions{display:flex;justify-content:flex-end;margin-top:8px}.nova-cite-btn{margin-left:auto}
.nova-empty{color:#e4f5fc;font:14px/1.5 system-ui,sans-serif}
.nova-shelf-list{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.nova-shelf-item{padding:12px;border:1px solid #ffffff29;border-radius:9px;background:#0003}
.nova-shelf-title{font-weight:700;color:white;overflow-wrap:anywhere}.nova-shelf-citation{font:13px/1.5 system-ui,sans-serif;color:#dff4fc;margin-top:6px;overflow-wrap:anywhere}
#novaCitationOverlay{position:fixed;inset:0;z-index:2147483600;display:none;align-items:center;justify-content:center;padding:16px;background:#020c14c7;backdrop-filter:blur(5px)}
#novaCitationOverlay.show{display:flex}
#novaCitationDialog{width:min(740px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:20px;border:1px solid #74bad3;border-radius:16px;background:#f4f8fb;color:#152a35;text-align:left;box-shadow:0 22px 70px #0007;font-family:system-ui,sans-serif}
#novaCitationDialog h2{margin:0 34px 5px 0;font-size:22px;color:#15394d}.nova-cite-help{font-size:12px;line-height:1.5;color:#536d7a;margin:0 0 14px}
#novaCitationClose{float:right;margin:0;padding:5px 10px;border-radius:8px;background:#e3edf2;color:#213d4b;box-shadow:none;font-size:20px}
.nova-cite-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.nova-cite-field{display:flex;flex-direction:column;gap:5px;min-width:0;font-size:12px;font-weight:700;color:#315163}.nova-cite-field.full{grid-column:1/-1}
.nova-cite-field input{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #c9dce5;border-radius:8px;background:white;color:#132c39;font:13px system-ui,sans-serif}
#novaCitePreview{padding:12px;margin-top:14px;border:1px solid #d5e3e9;border-radius:9px;background:white;font:14px/1.6 Georgia,serif;color:#172a34;overflow-wrap:anywhere}
.nova-cite-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.nova-cite-actions button{margin:0;padding:9px 13px;border-radius:8px;font:600 13px system-ui,sans-serif}
.nova-cite-primary{background:#176283}.nova-cite-secondary{background:#dceaf0;color:#17384a;box-shadow:none}
#novaCiteFeedback{min-height:18px;margin-top:8px;font-size:12px;color:#315163}
@media(max-width:560px){.nova-mode-button{padding:8px 12px;font-size:13px}#novaResearchResults{padding:12px}.nova-cite-fields{grid-template-columns:1fr}.nova-cite-field.full{grid-column:auto}#novaCitationDialog{padding:15px}}
`;document.head.appendChild(css);

const nav=document.createElement("nav");nav.id="novaSearchModes";nav.setAttribute("aria-label","Search modes");
[["web","Web"],["research","Research"],["images","Images"],["videos","Videos"],["academic","Academic"],["tools","Tools"]].forEach(([key,label])=>{
 const b=document.createElement("button");b.type="button";b.className="nova-mode-button";b.dataset.mode=key;b.textContent=label;b.setAttribute("aria-pressed","false");
 b.onclick=()=>{setMode(key);if(key==="tools")renderShelf();else if(input.value.trim())runSearch(key);};nav.appendChild(b);
});(input.closest(".search-wrap")||input.parentElement).insertAdjacentElement("afterend",nav);

const extra=document.createElement("section");extra.id="novaResearchResults";extra.setAttribute("aria-live","polite");
extra.innerHTML=`
<section class="nova-research-view" id="novaResearchImagesView"><h2>Images</h2><p class="nova-research-desc">Image results from Wikimedia Commons. Open an image to enlarge it or visit its source page.</p><div class="nova-research-status" id="novaResearchImagesStatus">Search for a topic to find images.</div><div class="nova-research-grid" id="novaResearchImagesResults"></div></section>
<section class="nova-research-view" id="novaResearchVideosView"><h2>Videos</h2><p class="nova-research-desc">Browse video results from PeerTube and Dailymotion, or open YouTube and Bing Videos searches in a new tab.</p><div class="nova-video-search-shortcuts" id="novaVideoSearchShortcuts"><span class="nova-video-search-label">Search other video sites:</span><a class="nova-video-search-link" id="novaYouTubeSearchLink" href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a class="nova-video-search-link" id="novaBingVideoSearchLink" href="https://www.bing.com/videos" target="_blank" rel="noopener noreferrer">Bing Videos ↗</a></div><div class="nova-research-status" id="novaResearchVideosStatus">Search for a topic to find videos.</div><div class="nova-research-grid" id="novaResearchVideosResults"></div></section>
<section class="nova-research-view" id="novaResearchAcademicView"><h2>Academic Publications</h2><p class="nova-research-desc">Scholarly records supplied by Crossref. A record is not a guarantee that the full paper is freely available or that its findings are correct.</p><div class="nova-research-status" id="novaResearchAcademicStatus">Search for a topic to find scholarly publications.</div><div id="novaResearchAcademicResults"></div></section>
<section class="nova-research-view" id="novaResearchToolsView"><h2>Research Tools</h2><p class="nova-research-desc">Create MLA citations, save them locally, and export a Works Cited list. Saved entries stay in this browser unless you export them.</p><div class="nova-r-actions"><button class="nova-r-btn" type="button" id="novaManualCitation">Create citation manually</button><button class="nova-r-btn" type="button" id="novaExportCitations">Export Works Cited (.txt)</button><button class="nova-r-btn" type="button" id="novaExportHTML">Export formatted (.html)</button><button class="nova-r-btn" type="button" id="novaCopyCitations">Copy all formatted</button><button class="nova-r-btn" type="button" id="novaClearCitations">Clear shelf</button></div><div class="nova-research-status" id="novaResearchShelfStatus"></div><div class="nova-shelf-list" id="novaResearchShelfList"></div></section>`;
web.insertAdjacentElement("afterend",extra);
const controls=document.createElement("div");controls.id="novaResearchSourceControls";
controls.innerHTML=`<div class="nova-filter-heading">Research source preferences</div><p class="nova-research-desc">Prioritize selected source types. Strict filtering is optional; a domain label is not proof that a page is reliable.</p><div class="nova-filter-grid" id="novaResearchSourceOptions">
<label><input type="checkbox" data-source="government"> Government (.gov)</label><label><input type="checkbox" data-source="university"> Universities (.edu)</label><label><input type="checkbox" data-source="academic"> Scholarly publishers / repositories</label><label><input type="checkbox" data-source="reference"> Reference works</label><label><input type="checkbox" data-source="news"> News / fact-checking</label><label><input type="checkbox" data-source="nonprofit"> Other .org sites</label></div><div class="nova-strict-row"><label class="nova-strict-filter"><input type="checkbox" id="novaResearchStrict"> Only show selected source types</label></div>`;
$(".web-search-title",web).insertAdjacentElement("afterend",controls);syncControls();

$("#novaManualCitation").onclick=()=>openCitation({sourceType:"web",title:"",url:""});
$("#novaExportCitations").onclick=exportCitations;$("#novaExportHTML").onclick=exportCitationsHTML;$("#novaCopyCitations").onclick=copyAllCitations;
$("#novaClearCitations").onclick=()=>{if(!loadCitations().length){$("#novaResearchShelfStatus").textContent="The shelf is already empty.";return;}if(!confirm("Clear all saved MLA citations from this browser? Export them first if you need a backup."))return;localStorage.removeItem(citeKey);renderShelf();};
$$("#novaResearchSourceOptions input").forEach(box=>box.addEventListener("change",()=>{prefs.selected[box.dataset.source]=box.checked;savePrefs();rerunResearchPage();}));
$("#novaResearchStrict").onchange=e=>{prefs.strict=e.target.checked;savePrefs();rerunResearchPage();};

function loadPrefs(){try{const saved=JSON.parse(localStorage.getItem(prefsKey)||"null");if(!saved)return JSON.parse(JSON.stringify(defaultPrefs));return{strict:!!saved.strict,selected:Object.assign({},defaultPrefs.selected,saved.selected||{})};}catch{return JSON.parse(JSON.stringify(defaultPrefs));}}
function savePrefs(){try{localStorage.setItem(prefsKey,JSON.stringify(prefs));}catch(e){console.warn(e);}}
function syncControls(){if(!$("#novaResearchSourceOptions"))return;$$("#novaResearchSourceOptions input").forEach(b=>b.checked=!!prefs.selected[b.dataset.source]);$("#novaResearchStrict").checked=!!prefs.strict;}
function host(url){try{return new URL(url).hostname.toLowerCase().replace(/^www\./,"");}catch{return "";}}
function sourceType(url){const h=host(url);if(h.endsWith(".gov")||h.endsWith(".mil"))return"government";if(h.endsWith(".edu"))return"university";
if(/(pubmed\.ncbi\.nlm\.nih\.gov|pmc\.ncbi\.nlm\.nih\.gov|arxiv\.org|doi\.org|jstor\.org|nature\.com|science\.org|sciencedirect\.com|springer\.com|wiley\.com|frontiersin\.org|plos\.org|tandfonline\.com|academic\.oup\.com|journals\.sagepub\.com|cell\.com|nejm\.org)$/.test(h))return"academic";
if(/(wikipedia\.org|britannica\.com|encyclopedia\.com|history\.com|nationalgeographic\.com|smithsonianmag\.com)$/.test(h))return"reference";
if(/(reuters\.com|apnews\.com|bbc\.(com|co\.uk)|npr\.org|pbs\.org|nytimes\.com|washingtonpost\.com|theguardian\.com|factcheck\.org|politifact\.com|snopes\.com|usatoday\.com|cbsnews\.com|nbcnews\.com|abcnews\.go\.com)$/.test(h))return"news";
if(h.endsWith(".org"))return"nonprofit";return"other";}
window.NovaResearchPrepareWebResults=results=>{if(mode!=="research")return results;const rank={government:6,university:5,academic:5,reference:4,news:3,nonprofit:2,other:0};if(prefs.strict)return results.filter(x=>!!prefs.selected[sourceType(x.url)]);return results.slice().sort((a,b)=>(prefs.selected[sourceType(b.url)]?rank[sourceType(b.url)]||0:0)-(prefs.selected[sourceType(a.url)]?rank[sourceType(a.url)]||0:0));};
function rerunResearchPage(){if(mode==="research"&&input.value.trim()&&window.NovaReloadWebResults)window.NovaReloadWebResults(input.value.trim(),Number.parseInt(webResults.getAttribute("data-page")||"1",10)||1);}
function setMode(next,options={}){if(!modes.includes(next))next="web";mode=next;if(options.persist!==false&&window.NovaTabsState&&window.NovaTabsState.setActiveSearchMode)window.NovaTabsState.setActiveSearchMode(mode);
$$(".nova-mode-button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.mode===mode)));
const normal=mode==="web"||mode==="research";web.style.display=normal?"":"none";extra.style.display=normal?"none":"block";controls.style.display=mode==="research"?"block":"none";
const views={images:"novaResearchImagesView",videos:"novaResearchVideosView",academic:"novaResearchAcademicView",tools:"novaResearchToolsView"};Object.entries(views).forEach(([k,id])=>$("#"+id).style.display=k===mode?"block":"none");
if(legacy)legacy.style.display=mode==="web"?"":"none";if(mode!=="web"){if(dict)dict.style.display="none";if(timeline)timeline.style.display="none";const r=$("#rickrollContainer");if(r)r.style.display="none";}
if(mode==="tools")renderShelf();if(options.runSearch===false&&input.value.trim()&&["images","videos","academic"].includes(mode)){const id={images:"novaResearchImagesStatus",videos:"novaResearchVideosStatus",academic:"novaResearchAcademicStatus"}[mode];if(/searching|loading/i.test($("#"+id).textContent))queueMicrotask(()=>runSearch(mode));}}
window.NovaResearchState={getActiveMode:()=>mode};window.NovaResearchSetMode=(m,o)=>setMode(m,o||{});

function tabId(){return window.NovaTabsState&&window.NovaTabsState.getActiveTabId?window.NovaTabsState.getActiveTabId():null;}
function isCurrent(m,q,t,id){return t===requestId&&mode===m&&input.value.trim()===q&&(id===null||tabId()===id);}
function hideOld(){web.style.display="none";if(legacy)legacy.style.display="none";if(dict)dict.style.display="none";if(timeline)timeline.style.display="none";const r=$("#rickrollContainer");if(r)r.style.display="none";}
function updateVideoSearchLinks(query){const youtube=$("#novaYouTubeSearchLink"),bing=$("#novaBingVideoSearchLink");const q=String(query||"").trim();if(youtube)youtube.href=q?"https://www.youtube.com/results?search_query="+encodeURIComponent(q):"https://www.youtube.com/";if(bing)bing.href=q?"https://www.bing.com/videos/search?q="+encodeURIComponent(q):"https://www.bing.com/videos";}
async function runSearch(which){setMode(which);const q=input.value.trim();if(which==="tools"){renderShelf();return;}if(which==="videos")updateVideoSearchLinks(q);
if(!q){const ids={images:"novaResearchImagesStatus",videos:"novaResearchVideosStatus",academic:"novaResearchAcademicStatus"};if(ids[which])$("#"+ids[which]).textContent="Enter a topic in Nova's search box, then choose "+which+".";return;}
if(which==="web"||which==="research"){hideOld();web.style.display="";if(window.openWebsite){await window.openWebsite();if(mode==="research"&&input.value.trim()===q){if(legacy)legacy.style.display="none";if(dict)dict.style.display="none";if(timeline)timeline.style.display="none";}}return;}
hideOld();extra.style.display="block";const t=++requestId,id=tabId();
if(which==="images"){ $("#novaResearchImagesStatus").textContent="Searching Wikimedia Commons…";$("#novaResearchImagesResults").innerHTML="";try{const d=await searchImages(q,1);if(isCurrent(which,q,t,id))renderImages(d.items,1,d.hasNext,q);}catch(e){if(isCurrent(which,q,t,id))$("#novaResearchImagesStatus").textContent="Image search failed. Try again or check your connection.";console.warn(e);}}
if(which==="videos"){ $("#novaResearchVideosStatus").textContent="Searching video services…";$("#novaResearchVideosResults").innerHTML="";try{const d=await searchVideos(q,1);if(isCurrent(which,q,t,id))renderVideos(d.items,1,d.hasNext,q);}catch(e){if(isCurrent(which,q,t,id))$("#novaResearchVideosStatus").textContent="Video search failed. Try again or check your connection.";console.warn(e);}}
if(which==="academic"){ $("#novaResearchAcademicStatus").textContent="Searching scholarly records…";$("#novaResearchAcademicResults").innerHTML="";try{const d=await searchAcademic(q,1);if(isCurrent(which,q,t,id))renderAcademic(d.items,1,d.hasNext,q,d.total);}catch(e){if(isCurrent(which,q,t,id))$("#novaResearchAcademicStatus").textContent="Academic search failed. Try again or check your connection.";console.warn(e);}}}

async function searchImages(q,p){const lim=20,off=(p-1)*lim,url="https://commons.wikimedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrsearch="+encodeURIComponent(q)+"&gsrlimit="+lim+"&gsroffset="+off+"&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=420";const r=await fetch(url);if(!r.ok)throw Error("Wikimedia HTTP "+r.status);const d=await r.json(),pages=d.query&&d.query.pages?Object.values(d.query.pages):[];const items=pages.map(x=>{const i=x.imageinfo&&x.imageinfo[0]?x.imageinfo[0]:{};return{title:String(x.title||"Untitled image").replace(/^File:/,""),url:i.descriptionurl||"https://commons.wikimedia.org/wiki/"+encodeURIComponent(x.title||""),image:i.thumburl||i.url||"",mime:i.mime||""};}).filter(x=>x.image&&(!x.mime||x.mime.startsWith("image/")));return{items,hasNext:!!(d.continue&&items.length)};}
function pager(target,p,more,load){const row=document.createElement("nav");row.className="nova-page-row";row.setAttribute("aria-label","Result pages");const prev=action("← Previous");prev.disabled=p<=1;prev.onclick=()=>{if(p>1)load(p-1);};const label=document.createElement("span");label.className="nova-page-label";label.textContent="Page "+p;const next=action("Next →");next.disabled=!more;next.onclick=()=>{if(more)load(p+1);};row.append(prev,label,next);target.appendChild(row);}
function action(text){const b=document.createElement("button");b.type="button";b.className="nova-r-btn";b.textContent=text;return b;}
async function loadImages(q,p){if(mode!=="images"||input.value.trim()!==q)return;const t=++requestId,id=tabId();$("#novaResearchImagesStatus").textContent="Loading page "+p+"…";try{const d=await searchImages(q,p);if(isCurrent("images",q,t,id))renderImages(d.items,p,d.hasNext,q);}catch(e){if(isCurrent("images",q,t,id))$("#novaResearchImagesStatus").textContent="Could not load that page.";}}
function renderImages(items,p,more,q){const target=$("#novaResearchImagesResults");target.innerHTML="";if(!items.length){$("#novaResearchImagesStatus").textContent="No more image results were found.";pager(target,p,false,n=>loadImages(q,n));return;}$("#novaResearchImagesStatus").textContent="Images for “"+q+"” · page "+p+". Check the source page for creator and license details.";const urls=items.map(x=>x.image);items.forEach((x,i)=>{const c=document.createElement("article");c.className="nova-research-card";const img=document.createElement("img");img.src=x.image;img.alt=x.title;img.loading="lazy";img.onclick=()=>{if(window.NovaOpenImageLightbox)window.NovaOpenImageLightbox(urls,i);};const a=document.createElement("a");a.href=x.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=x.title;const acts=document.createElement("div");acts.className="nova-r-actions";const cite=action("Cite");cite.onclick=()=>openCitation({sourceType:"web",title:x.title,url:x.url,site:"Wikimedia Commons"});const open=action("Source page");open.onclick=()=>window.open(x.url,"_blank","noopener,noreferrer");acts.append(cite,open);c.append(img,a,acts);target.appendChild(c);});pager(target,p,more,n=>loadImages(q,n));}

async function searchVideos(q,p){const lim=10,start=(p-1)*lim,urls=["https://framatube.org/api/v1/videos/search?search="+encodeURIComponent(q)+"&count="+lim+"&start="+start,"https://api.dailymotion.com/videos?search="+encodeURIComponent(q)+"&page="+p+"&limit="+lim+"&fields=title,id,thumbnail_url,url"];const rs=await Promise.allSettled(urls.map(u=>fetch(u)));let peer=[],daily=[];
if(rs[0].status==="fulfilled"&&rs[0].value.ok)try{const d=await rs[0].value.json();peer=Array.isArray(d.data)?d.data.map(v=>({title:v.name||"Untitled video",url:v.url||"https://framatube.org/videos/watch/"+v.uuid,image:v.thumbnailPath?"https://framatube.org"+v.thumbnailPath:(v.thumbnailUrl||""),provider:"PeerTube"})):[];}catch{}
if(rs[1].status==="fulfilled"&&rs[1].value.ok)try{const d=await rs[1].value.json();daily=Array.isArray(d.list)?d.list.map(v=>({title:v.title||"Untitled video",url:v.url||"https://www.dailymotion.com/video/"+v.id,image:v.thumbnail_url||"",provider:"Dailymotion"})):[];}catch{}
const seen=new Set(),items=peer.concat(daily).filter(v=>v.url&&!seen.has(v.url)&&seen.add(v.url));return{items,hasNext:peer.length>=lim||daily.length>=lim};}
async function loadVideos(q,p){if(mode!=="videos"||input.value.trim()!==q)return;const t=++requestId,id=tabId();$("#novaResearchVideosStatus").textContent="Loading page "+p+"…";try{const d=await searchVideos(q,p);if(isCurrent("videos",q,t,id))renderVideos(d.items,p,d.hasNext,q);}catch(e){if(isCurrent("videos",q,t,id))$("#novaResearchVideosStatus").textContent="Could not load that page.";}}
function renderVideos(items,p,more,q){const target=$("#novaResearchVideosResults");target.innerHTML="";if(!items.length){$("#novaResearchVideosStatus").textContent="No videos returned on this page. Try another term.";pager(target,p,false,n=>loadVideos(q,n));return;}$("#novaResearchVideosStatus").textContent="Videos for “"+q+"” · page "+p+".";items.forEach(x=>{const c=document.createElement("article");c.className="nova-research-card";if(x.image){const img=document.createElement("img");img.src=x.image;img.alt="";img.loading="lazy";c.appendChild(img);}const a=document.createElement("a");a.href=x.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=x.title;const meta=document.createElement("div");meta.className="nova-research-meta";meta.textContent=x.provider;const acts=document.createElement("div");acts.className="nova-r-actions";const cite=action("Cite");cite.onclick=()=>openCitation({sourceType:"web",title:x.title,url:x.url,site:x.provider});const go=action("Watch");go.onclick=()=>window.open(x.url,"_blank","noopener,noreferrer");acts.append(cite,go);c.append(a,meta,acts);target.appendChild(c);});pager(target,p,more,n=>loadVideos(q,n));}

async function searchAcademic(q,p){const rows=10,off=(p-1)*rows,url="https://api.crossref.org/works?rows="+rows+"&offset="+off+"&select=DOI,title,author,published,issued,container-title,publisher,volume,issue,page,URL,type&query.bibliographic="+encodeURIComponent(q);const r=await fetch(url,{headers:{Accept:"application/json"}});if(!r.ok)throw Error("Crossref HTTP "+r.status);const d=await r.json(),m=d.message||{},total=Number(m["total-results"]||0);const items=(m.items||[]).map(x=>{const dp=(x.published&&x.published["date-parts"])||(x.issued&&x.issued["date-parts"])||[],doi=x.DOI||"";return{title:Array.isArray(x.title)?x.title[0]:(x.title||"Untitled scholarly work"),url:doi?"https://doi.org/"+doi:(x.URL||""),doi,author:formatAuthors(x.author||[]),site:Array.isArray(x["container-title"])?(x["container-title"][0]||""):(x["container-title"]||x.publisher||""),publisher:x.publisher||"",date:formatDate(dp[0]||[]),volume:x.volume||"",issue:x.issue||"",pages:x.page||""};}).filter(x=>x.url);return{items,total,hasNext:off+rows<total};}
function formatDate(p){if(!p.length)return"";const m=["","Jan.","Feb.","Mar.","Apr.","May","June","July","Aug.","Sept.","Oct.","Nov.","Dec."];if(p.length===1)return String(p[0]);if(p.length===2)return(m[p[1]]||"")+" "+p[0];return p[2]+" "+(m[p[1]]||"")+" "+p[0];}
function formatAuthors(a){if(!a.length)return"";const one=x=>[x.family,x.given].filter(Boolean).join(", ");if(a.length===1)return one(a[0]);if(a.length===2)return one(a[0])+", and "+[a[1].given,a[1].family].filter(Boolean).join(" ");return one(a[0])+", et al.";}
async function loadAcademic(q,p){if(mode!=="academic"||input.value.trim()!==q)return;const t=++requestId,id=tabId();$("#novaResearchAcademicStatus").textContent="Loading page "+p+"…";try{const d=await searchAcademic(q,p);if(isCurrent("academic",q,t,id))renderAcademic(d.items,p,d.hasNext,q,d.total);}catch(e){if(isCurrent("academic",q,t,id))$("#novaResearchAcademicStatus").textContent="Could not load that page.";}}
function renderAcademic(items,p,more,q,total){const target=$("#novaResearchAcademicResults");target.innerHTML="";if(!items.length){$("#novaResearchAcademicStatus").textContent="No scholarly records on this page. Try broader terms.";pager(target,p,false,n=>loadAcademic(q,n));return;}$("#novaResearchAcademicStatus").textContent="Showing records "+((p-1)*10+1)+"–"+((p-1)*10+items.length)+(total?" of about "+total.toLocaleString():"")+".";
items.forEach(x=>{const c=document.createElement("article");c.className="nova-research-card";const a=document.createElement("a");a.href=x.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=x.title;const meta=document.createElement("p");meta.textContent=[x.author,x.site,x.date].filter(Boolean).join(" · ");const doi=document.createElement("div");doi.className="nova-research-meta";doi.textContent=x.doi?"DOI: "+x.doi:"Publication record";const acts=document.createElement("div");acts.className="nova-r-actions";const cite=action("Cite in MLA");cite.onclick=()=>openCitation({sourceType:"academic",title:x.title,author:x.author,site:x.site,publisher:x.publisher,date:x.date,url:x.url,doi:x.doi,volume:x.volume,issue:x.issue,pages:x.pages});acts.append(cite);c.append(a,meta,doi,acts);target.appendChild(c);});pager(target,p,more,n=>loadAcademic(q,n));}

function sortCitations(list){return list.slice().sort((a,b)=>String(a.sortKey||a.title||"").localeCompare(String(b.sortKey||b.title||""),undefined,{sensitivity:"base"}));}
function siteFromURL(url){const h=host(url),known={"nasa.gov":"NASA","noaa.gov":"National Oceanic and Atmospheric Administration","cdc.gov":"Centers for Disease Control and Prevention","nih.gov":"National Institutes of Health","loc.gov":"Library of Congress","nps.gov":"National Park Service","britannica.com":"Encyclopaedia Britannica","wikipedia.org":"Wikipedia","reuters.com":"Reuters","apnews.com":"Associated Press","bbc.com":"BBC News","commons.wikimedia.org":"Wikimedia Commons","framatube.org":"PeerTube","dailymotion.com":"Dailymotion"};for(const k of Object.keys(known))if(h===k||h.endsWith("."+k))return known[k];const a=h.split("."),n=a.length>2?a[a.length-3]:a[0];return n?n.split(/[-_]/).map(w=>w?w[0].toUpperCase()+w.slice(1):"").join(" "):"";}
function accessDate(){const d=new Date(),m=["Jan.","Feb.","Mar.","Apr.","May","June","July","Aug.","Sept.","Oct.","Nov.","Dec."];return d.getDate()+" "+m[d.getMonth()]+" "+d.getFullYear();}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function createCitationModal(){const overlay=document.createElement("div");overlay.id="novaCitationOverlay";overlay.innerHTML=`
<div id="novaCitationDialog" role="dialog" aria-modal="true" aria-labelledby="novaCitationTitle"><button type="button" id="novaCitationClose" aria-label="Close">×</button><h2 id="novaCitationTitle">MLA Citation Generator</h2>
<p class="nova-cite-help">Nova fills in what it can find. Check the source page for the author, title, date, and website/journal details before handing this in. Missing information is left blank instead of invented.</p><div class="nova-cite-actions"><button type="button" class="nova-cite-secondary" id="novaCiteFetch">Try to fetch page details</button></div><p class="nova-cite-help">Fetching details sends this source URL to Jina Reader to retrieve public page metadata. Nothing is fetched until you click the button.</p>
<div class="nova-cite-fields">
<label class="nova-cite-field">Author(s)<input id="novaCiteAuthor" placeholder="Leave blank if none is listed"></label><label class="nova-cite-field">Page / article title<input id="novaCiteTitle"></label>
<label class="nova-cite-field">Website / journal title<input id="novaCiteSite"></label><label class="nova-cite-field">Publisher (if listed)<input id="novaCitePublisher"></label>
<label class="nova-cite-field">Publication date<input id="novaCiteDate" placeholder="e.g. 11 Oct. 2026 or 2026"></label><label class="nova-cite-field">Date accessed<input id="novaCiteAccessed"></label>
<label class="nova-cite-field">Volume<input id="novaCiteVolume"></label><label class="nova-cite-field">Issue<input id="novaCiteIssue"></label><label class="nova-cite-field">Page range<input id="novaCitePages"></label><label class="nova-cite-field">DOI<input id="novaCiteDOI" placeholder="10.xxxx/xxxx"></label>
<label class="nova-cite-field full">Source URL<input id="novaCiteURL"></label></div><div id="novaCitePreview" aria-live="polite"></div>
<div class="nova-cite-actions"><button type="button" class="nova-cite-primary" id="novaCiteCopy">Copy MLA citation</button><button type="button" class="nova-cite-secondary" id="novaCiteSave">Save to Works Cited</button><button type="button" class="nova-cite-secondary" id="novaCiteCancel">Close</button></div><div id="novaCiteFeedback" role="status"></div></div>`;document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)closeCitation();};$("#novaCitationClose").onclick=closeCitation;$("#novaCiteCancel").onclick=closeCitation;["Author","Title","Site","Publisher","Date","Accessed","Volume","Issue","Pages","DOI","URL"].forEach(n=>$("#novaCite"+n).addEventListener("input",updateCitation));$("#novaCiteCopy").onclick=copyCitation;$("#novaCiteSave").onclick=saveCitation;$("#novaCiteFetch").onclick=fetchCitationDetails;document.addEventListener("keydown",e=>{if(e.key==="Escape"&&overlay.classList.contains("show"))closeCitation();});}
function fields(){const v=id=>($("#novaCite"+id).value||"").trim();return{type:$("#novaCitationOverlay").dataset.type||"web",author:v("Author"),title:v("Title"),site:v("Site"),publisher:v("Publisher"),date:v("Date"),accessed:v("Accessed"),volume:v("Volume"),issue:v("Issue"),pages:v("Pages"),doi:v("DOI").replace(/^https?:\/\/doi\.org\//i,""),url:v("URL")};}
function makeCitation(f){if(!String(f.title||"").trim())return{html:"Fill in a title to preview the citation.",text:""};let h="",t="";if(f.author){h+=esc(f.author)+". ";t+=f.author+". ";}if(f.title){const x="“"+f.title.replace(/[.“”]+$/g,"")+".”";h+=esc(x);t+=x;}if(f.site){h+=(h?" ":"")+"<em>"+esc(f.site)+"</em>";t+=(t?" ":"")+f.site;}if(f.publisher&&f.type!=="academic"&&f.publisher.toLowerCase()!==(f.site||"").toLowerCase()){h+=(h?", ":"")+esc(f.publisher);t+=(t?", ":"")+f.publisher;}if(f.type==="academic"){const m=[];if(f.volume)m.push("vol. "+f.volume);if(f.issue)m.push("no. "+f.issue);if(f.pages)m.push("pp. "+f.pages);if(m.length){h+=(h?", ":"")+esc(m.join(", "));t+=(t?", ":"")+m.join(", ");}}if(f.date){h+=(h?", ":"")+esc(f.date);t+=(t?", ":"")+f.date;}const rawURL=f.doi?"https://doi.org/"+f.doi:f.url;const u=rawURL&&!f.doi?rawURL.replace(/^https?:\/\//i,""):rawURL;if(u){h+=(h?", ":"")+esc(u);t+=(t?", ":"")+u;}if(f.accessed){h+=(h?". ":"")+"Accessed "+esc(f.accessed)+".";t+=(t?". ":"")+"Accessed "+f.accessed+".";}else if(t&&!/[.!?]$/.test(t)){h+=".";t+=".";}return{html:h||"Fill in a title to preview the citation.",text:t};}
function updateCitation(){const c=makeCitation(fields());$("#novaCitePreview").innerHTML=c.html;$("#novaCitationOverlay").dataset.plain=c.text;$("#novaCitationOverlay").dataset.html=c.html;}
function openCitation(item){if(!$("#novaCitationOverlay"))createCitationModal();item=item||{};const set=(id,v)=>$("#novaCite"+id).value=v||"";$("#novaCitationOverlay").dataset.type=item.sourceType==="academic"?"academic":"web";set("Author",item.author);set("Title",item.title);set("Site",item.site||siteFromURL(item.url));set("Publisher",item.publisher);set("Date",item.date);set("Accessed",item.sourceType==="academic"?"":accessDate());set("Volume",item.volume);set("Issue",item.issue);set("Pages",item.pages);set("DOI",item.doi);set("URL",item.url);$("#novaCiteFeedback").textContent="";updateCitation();$("#novaCitationOverlay").classList.add("show");setTimeout(()=>$("#novaCiteTitle").focus(),20);}
async function fetchCitationDetails(){
  const f = fields();
  if (!/^https?:\/\//i.test(f.url)) {
    $("#novaCiteFeedback").textContent = "Enter a full source URL before fetching details.";
    return;
  }
  const button = $("#novaCiteFetch");
  button.disabled = true;
  $("#novaCiteFeedback").textContent = "Fetching public page metadata…";
  try {
    const endpoint = "https://r.jina.ai/" + f.url;
    const response = await fetch(endpoint, {
      headers: { "Accept": "text/plain", "X-Respond-With": "html" }
    });
    if (!response.ok) throw new Error("Metadata service returned " + response.status);
    const markup = await response.text();
    const doc = new DOMParser().parseFromString(markup, "text/html");
    const meta = names => {
      for (const name of names) {
        const node = doc.querySelector('meta[name="' + name + '"],meta[property="' + name + '"],meta[itemprop="' + name + '"]');
        if (node && node.content && node.content.trim()) return node.content.trim();
      }
      return "";
    };

    let author = meta(["author", "article:author", "dc.creator", "DC.Creator", "parsely-author", "byl"]);
    let title = meta(["og:title", "twitter:title", "citation_title", "dc.title"]) || (doc.title || "").trim();
    let site = meta(["og:site_name", "application-name", "publisher"]);
    let publisher = meta(["dc.publisher", "DC.Publisher", "citation_publisher"]);
    let date = meta(["article:published_time", "datePublished", "dateCreated", "pubdate", "publish-date", "date", "dc.date.issued", "DC.Date.Issued", "citation_publication_date"]);

    // Prefer Schema.org structured data when publishers provide it.
    const inspect = value => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) { value.forEach(inspect); return; }
      if (!author && value.author) {
        const authors = Array.isArray(value.author) ? value.author : [value.author];
        author = authors.map(item => typeof item === "string" ? item : [item.familyName, item.givenName].filter(Boolean).join(", ") || item.name || "").filter(Boolean).join(authors.length > 1 ? ", " : "");
        if (authors.length > 2 && author) author = author.split(", ").slice(0, 2).join(", ") + ", et al.";
      }
      if (!title) title = value.headline || value.name || "";
      if (!date) date = value.datePublished || value.dateCreated || "";
      if (!publisher && value.publisher) publisher = typeof value.publisher === "string" ? value.publisher : value.publisher.name || "";
      if (!site && value.isPartOf && value.isPartOf.name) site = value.isPartOf.name;
      Object.values(value).forEach(child => {
        if (child && typeof child === "object") inspect(child);
      });
    };
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try { inspect(JSON.parse(script.textContent || "")); } catch {}
    });

    const setIfBlank = (id, value) => {
      const field = $("#novaCite" + id);
      if (field && !field.value.trim() && value) field.value = String(value).trim();
    };
    setIfBlank("Author", author);
    setIfBlank("Title", title);
    if (site) $("#novaCiteSite").value = site;
    setIfBlank("Publisher", publisher);
    setIfBlank("Date", date);
    updateCitation();
    const found = [author, title, site, publisher, date].filter(Boolean).length;
    $("#novaCiteFeedback").textContent = found
      ? "Filled available page metadata. Check every field; pages may publish incomplete or incorrect metadata."
      : "No useful citation metadata was found. Fill in the missing fields manually.";
  } catch (error) {
    console.warn("Nova citation metadata fetch failed:", error);
    $("#novaCiteFeedback").textContent = "Could not fetch metadata from this page. Fill in the missing details manually.";
  } finally {
    button.disabled = false;
  }
}
function closeCitation(){if($("#novaCitationOverlay"))$("#novaCitationOverlay").classList.remove("show");}
async function copyCitation(){const o=$("#novaCitationOverlay"),t=o.dataset.plain||"",h=o.dataset.html||"";if(!t){$("#novaCiteFeedback").textContent="Add a title before copying.";return;}try{if(navigator.clipboard&&window.ClipboardItem&&window.isSecureContext)await navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([h],{type:"text/html"}),"text/plain":new Blob([t],{type:"text/plain"})})]);else if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(t);else throw Error("Clipboard unavailable");$("#novaCiteFeedback").textContent="Citation copied. Double-check the source details before using it.";}catch(e){$("#novaCiteFeedback").textContent="Browser blocked clipboard access. Select the citation preview and copy it manually.";}}
function loadCitations(){try{const a=JSON.parse(localStorage.getItem(citeKey)||"[]");return Array.isArray(a)?a:[];}catch{return[];}}
function saveCitation(){const f=fields(),c=makeCitation(f);if(!c.text){$("#novaCiteFeedback").textContent="Add a title before saving.";return;}const a=loadCitations();if(a.some(x=>x.url===f.url&&x.text===c.text)){$("#novaCiteFeedback").textContent="This citation is already saved.";return;}const sortTitle=String(f.author||f.title||f.url||"Untitled source").replace(/^(the|a|an)\s+/i,"").trim();a.unshift({id:String(Date.now())+"-"+a.length,title:f.title||f.url||"Untitled source",sortKey:sortTitle,url:f.url,html:c.html,text:c.text});try{localStorage.setItem(citeKey,JSON.stringify(a.slice(0,500)));$("#novaCiteFeedback").textContent="Saved to your local Works Cited shelf.";renderShelf();}catch(e){$("#novaCiteFeedback").textContent="Could not save; browser storage may be full.";}}
function renderShelf(){const target=$("#novaResearchShelfList"),status=$("#novaResearchShelfStatus");if(!target||!status)return;target.innerHTML="";const a=sortCitations(loadCitations());status.textContent=a.length?a.length+" saved citation(s), stored in this browser.":"Shelf empty. Use Cite on a result or create a citation manually.";a.forEach(x=>{const row=document.createElement("article");row.className="nova-shelf-item";const title=document.createElement("div");title.className="nova-shelf-title";title.textContent=x.title;const cite=document.createElement("div");cite.className="nova-shelf-citation";cite.innerHTML=x.html||esc(x.text);const acts=document.createElement("div");acts.className="nova-r-actions";const copy=action("Copy");copy.onclick=async()=>{try{await navigator.clipboard.writeText(x.text);status.textContent="Citation copied.";}catch{status.textContent="Clipboard blocked; select the citation text to copy it."}};const del=action("Remove");del.onclick=()=>{localStorage.setItem(citeKey,JSON.stringify(loadCitations().filter(y=>y.id!==x.id)));renderShelf();};acts.append(copy,del);row.append(title,cite,acts);target.appendChild(row);});}
function downloadResearchFile(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportCitations(){const a=sortCitations(loadCitations());if(!a.length){$("#novaResearchShelfStatus").textContent="No citations to export yet.";return;}downloadResearchFile("Nova-Works-Cited.txt",a.map(x=>x.text).join("\n\n")+"\n","text/plain;charset=utf-8");$("#novaResearchShelfStatus").textContent="Alphabetized Works Cited exported as text. Use formatted export to preserve italics.";}
function exportCitationsHTML(){const a=sortCitations(loadCitations());if(!a.length){$("#novaResearchShelfStatus").textContent="No citations to export yet.";return;}const rows=a.map(x=>'<p class="citation">'+(x.html||esc(x.text))+'</p>').join("\n");const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Works Cited</title><style>body{font-family:"Times New Roman",serif;font-size:12pt;line-height:2;margin:1in;color:#000}h1{text-align:center;font-size:12pt;font-weight:normal;margin:0 0 1em}.citation{margin:0 0 0 0;padding-left:.5in;text-indent:-.5in}</style></head><body><h1>Works Cited</h1>'+rows+'</body></html>';downloadResearchFile("Nova-Works-Cited.html",html,"text/html;charset=utf-8");$("#novaResearchShelfStatus").textContent="Formatted, alphabetized Works Cited exported as HTML with italics and hanging indents.";}
async function copyAllCitations(){const a=sortCitations(loadCitations());if(!a.length){$("#novaResearchShelfStatus").textContent="No citations to copy yet.";return;}const plain=a.map(x=>x.text).join("\n\n");const html='<div>'+a.map(x=>'<p style="margin:0 0 1em 0;padding-left:.5in;text-indent:-.5in">'+(x.html||esc(x.text))+'</p>').join("")+'</div>';try{if(navigator.clipboard&&window.ClipboardItem&&window.isSecureContext)await navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([html],{type:"text/html"}),"text/plain":new Blob([plain],{type:"text/plain"})})]);else await navigator.clipboard.writeText(plain);$("#novaResearchShelfStatus").textContent="Alphabetized citations copied. Rich-text paste preserves italics where supported.";}catch{$("#novaResearchShelfStatus").textContent="Clipboard blocked. Use formatted HTML export instead.";}}
window.NovaResearchOpenCitation=openCitation;

document.addEventListener("keydown",e=>{if(e.target!==input||e.key!=="Enter"||mode==="web")return;const s=$("#suggestionBox");if(s&&s.classList.contains("show")&&$(".highlighted",s))return;e.preventDefault();e.stopImmediatePropagation();runSearch(mode);},true);
setMode(window.NovaTabsState&&window.NovaTabsState.getActiveSearchMode?window.NovaTabsState.getActiveSearchMode():"web",{persist:false,runSearch:false});renderShelf();
console.log("%cNova Research ready","color:#2596be;font-weight:bold");
})();