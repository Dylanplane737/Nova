// ================== TIMELINE GRAPH POPUP ==================
const timelineGraphCanvas = document.createElement("canvas");
timelineGraphCanvas.id = "timelineGraphCanvas";
// FIX: Set canvas resolution attributes to match CSS size to prevent blurriness
timelineGraphCanvas.width = 600;
timelineGraphCanvas.height = 300;
timelineGraphCanvas.style.cssText = "position:fixed;bottom:20px;right:20px;width:600px;height:300px;background:rgba(0,0,0,0.25);border-radius:10px;z-index:900;display:none;";
document.body.appendChild(timelineGraphCanvas);

function toggleTimelineGraph() {
  const c = timelineGraphCanvas;
  if (c.style.display === "none" || !c.style.display) {
    c.style.display = "block"; renderTimelineGraph();
  } else { c.style.display = "none"; }
}

function renderTimelineGraph() {
  const events = extractTimelineFromText(wikiSummaryEl.innerText || "");
  const ctx = timelineGraphCanvas.getContext("2d");
  ctx.clearRect(0, 0, timelineGraphCanvas.width, timelineGraphCanvas.height);
  if (!events.length) return;
  const maxY = Math.max(...events.map(e => e.year));
  const minY = Math.min(...events.map(e => e.year));
  const padding = 20;
  const w = timelineGraphCanvas.width - padding * 2;
  const h = timelineGraphCanvas.height - padding * 2;
  events.forEach((ev, i) => {
    const x = padding + i * (w / events.length);
    const y = padding + h * (1 - (ev.year - minY) / (maxY - minY));
    ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fillStyle = "#a8d0e6"; ctx.fill();
    ctx.font = "10px Arial"; ctx.fillText(ev.year, x + 6, y + 4);
  });
}

document.addEventListener("keydown", (e) => {
  if (document.activeElement !== urlInput) {
    if (e.key === "F1") { e.preventDefault(); alert("F1 Help:\n- T = toggle timeline\n- A = focus/play audio\n- R = rerun related searches"); }
    if (e.key === "ArrowUp") window.scrollBy(0, -100);
    if (e.key === "ArrowDown") window.scrollBy(0, 100);
    if (e.key === "T") toggleTimelineGraph();
    if (e.key === "A") { audioPlayer.focus(); audioPlayer.play().catch(() => {}); }
    if (e.key === "R") fetchRelatedSearches(urlInput.value);
  }
});

// Fix Open Button
document.getElementById("openBtn").addEventListener("click", openWebsite);
