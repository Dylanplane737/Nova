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

let relatedSearchRequestId = 0;
let audioRequestId = 0;

async function fetchRelatedSearches(query) {
  const requestId = ++relatedSearchRequestId;
  const normalizedQuery = String(query || "").trim();
  relatedSearchContainer.replaceChildren();
  if (!normalizedQuery) return;

  try {
    let suggestions = null;

    // Reuse Nova's cached Wikipedia suggestions when available.
    if (typeof fetchWikiSuggestions === "function") {
      try {
        suggestions = await fetchWikiSuggestions(normalizedQuery);
      } catch (error) {
        // Fall back to a direct request if the autocomplete cache is unavailable.
      }
    }

    if (!Array.isArray(suggestions)) {
      const url = "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=" +
        encodeURIComponent(normalizedQuery);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Wikipedia suggestions returned " + response.status);
      const data = await response.json();
      suggestions = Array.isArray(data[1]) ? data[1] : [];
    }

    if (requestId !== relatedSearchRequestId) return;
    if (!suggestions.length) return;

    const heading = document.createElement("strong");
    heading.textContent = "Related Searches:";
    relatedSearchContainer.appendChild(heading);

    for (const suggestion of suggestions) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = suggestion;
      button.style.cssText =
        "margin:0 8px 0 0;padding:0;border:0;border-radius:0;background:transparent;" +
        "color:inherit;box-shadow:none;cursor:pointer;text-decoration:underline;font:inherit;";
      button.addEventListener("click", () => {
        urlInput.value = suggestion;
        openWebsite();
      });
      relatedSearchContainer.appendChild(button);
    }
  } catch (error) {
    if (requestId === relatedSearchRequestId) relatedSearchContainer.replaceChildren();
  }
}

async function fetchAudioClips(query) {
  const requestId = ++audioRequestId;
  const normalizedQuery = String(query || "").trim();
  const audioEnabled = localStorage.getItem("novaAudioPreview") === "true";

  // Freesound needs authentication. Never put a private API token in public
  // GitHub Pages code; a backend proxy is required to enable this integration.
  const apiKey = "YOUR_API_KEY";
  if (!normalizedQuery || !audioEnabled || !apiKey || apiKey === "YOUR_API_KEY") {
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    audioBox.style.display = "none";
    return;
  }

  const params = new URLSearchParams({
    query: normalizedQuery,
    token: apiKey,
    fields: "name,previews",
    filter: "duration:[0 TO 30]"
  });

  try {
    const response = await fetch("https://freesound.org/apiv2/search/text/?" + params.toString());
    if (!response.ok) throw new Error("Freesound returned " + response.status);
    const data = await response.json();
    if (requestId !== audioRequestId) return;

    const clips = Array.isArray(data.results) ? data.results : [];
    const clip = clips.find(item => item && item.previews && item.previews["preview-hq-mp3"]);
    if (!clip) {
      audioPlayer.pause();
      audioPlayer.removeAttribute("src");
      audioPlayer.load();
      audioBox.style.display = "none";
      return;
    }

    audioPlayer.src = clip.previews["preview-hq-mp3"];
    audioBox.style.display = "block";
    // Autoplay is only attempted when the user explicitly enabled audio previews.
    audioPlayer.play().catch(() => console.warn("Audio playback blocked"));
  } catch (error) {
    if (requestId === audioRequestId) {
      audioPlayer.pause();
      audioPlayer.removeAttribute("src");
      audioPlayer.load();
      audioBox.style.display = "none";
    }
  }
}

// Add-ons run after the main search without delaying its results.
const originalOpenWebsite2 = openWebsite;
openWebsite = async function () {
  const query = String(urlInput.value || "").trim();
  await originalOpenWebsite2();

  // Don't run extra lookups for blank searches, direct URLs, or Easter eggs.
  if (urlInput.value.trim() !== query) return;
  const lowerQuery = query.toLowerCase();
  const directURL = query.includes(".") || /^https?:\/\//i.test(query);
  const isEasterEgg = typeof NOVA_EASTER_EGG_QUERIES !== "undefined" &&
    NOVA_EASTER_EGG_QUERIES.has(lowerQuery);

  if (!query || directURL || isEasterEgg) {
    relatedSearchRequestId++;
    relatedSearchContainer.replaceChildren();
    void fetchAudioClips("");
    return;
  }

  void fetchAudioClips(query);
  void fetchRelatedSearches(query);
};
