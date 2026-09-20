// ================== AUDIO & RELATED SEARCHES ==================
const audioBox = document.createElement("div");
audioBox.id = "audioBox";
audioBox.style.cssText = "max-width:560px;margin:12px auto;padding:10px;background:rgba(0,0,0,0.35);border-radius:12px;color:white;text-align:left;display:none;";
audioBox.innerHTML = `<strong>Audio Player:</strong> <audio id="audioPlayer" controls style="width:100%;margin-top:6px;"></audio>`;
document.querySelector(".search-wrap").appendChild(audioBox);
const audioPlayer = document.getElementById("audioPlayer");

const relatedSearchContainer = document.createElement("div");
relatedSearchContainer.id = "relatedSearches";
relatedSearchContainer.style.cssText = "max-width:560px;margin:10px auto;color:#d6eefb;text-align:left;";
document.querySelector(".search-wrap").appendChild(relatedSearchContainer);

async function fetchRelatedSearches(query){
  if (!query) { relatedSearchContainer.innerHTML=""; return; }
  try {
    const res = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(query)}`);
    const j = await res.json();
    const suggestions = j[1] || [];
    if (!suggestions.length){ relatedSearchContainer.innerHTML=""; return; }
    relatedSearchContainer.innerHTML = "<strong>Related Searches:</strong> " + suggestions.map(r => 
      `<span style="cursor:pointer;text-decoration:underline;margin-right:8px;" onclick="urlInput.value='${r}'; openWebsite();">${r}</span>`).join("");
  } catch(err){ relatedSearchContainer.innerHTML=""; }
}

async function fetchAudioClips(query) {
  // NOTE: You must put a real Freesound API key here for this to work
  const apiKey = 'YOUR_API_KEY'; 
  const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&token=${apiKey}&fields=results&filter=duration:[0+TO+30]`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const audioClips = data.results || [];
    if (audioClips.length > 0) {
      audioPlayer.src = audioClips[0].previews['preview-hq-mp3'];
      audioBox.style.display = "block";
      audioPlayer.play().catch(() => console.warn("Audio playback blocked"));
    } else { audioBox.style.display = "none"; }
  } catch (error) { audioBox.style.display = "none"; }
}

// Hook into search chain
const originalOpenWebsite2 = openWebsite;
openWebsite = async function () {
  await originalOpenWebsite2();
  fetchAudioClips(urlInput.value);
  fetchRelatedSearches(urlInput.value);
};
