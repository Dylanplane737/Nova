/* =========================================================
   NOVA TABS v2
   Keeps Nova's REAL DOM in place so existing JS still works.
   ========================================================= */

(() => {
  const urlInput = document.getElementById("urlInput");
  const novaLogo = document.getElementById("Novalogopng");

  if (!urlInput || !novaLogo) {
    console.error("Nova Tabs: Nova UI not found.");
    return;
  }

  /* =====================================================
     STYLE
     ===================================================== */

  const style = document.createElement("style");

  style.textContent = `
    #novaTabsBar {
      position: sticky;
      top: 0;
      z-index: 999;

      display: flex;
      align-items: center;
      gap: 5px;

      margin: -32px -12px 18px -12px;
      padding: 7px 10px;

      background: rgba(8, 75, 110, 0.96);
      backdrop-filter: blur(10px);

      box-shadow: 0 3px 12px rgba(0,0,0,0.22);

      overflow: visible;

      text-align: left;
    }

    #novaTabsList {
      display: flex;
      align-items: center;
      gap: 5px;

      flex: 1;
      min-width: 0;

      overflow-x: auto;
      scrollbar-width: thin;
    }

    .nova-tab {
      height: 36px;
      min-width: 125px;
      max-width: 210px;

      display: flex;
      align-items: center;
      gap: 7px;

      padding: 0 7px 0 12px;

      border-radius: 9px;
      border: 1px solid rgba(255,255,255,0.12);

      background: rgba(0,0,0,0.16);
      color: rgba(255,255,255,0.80);

      cursor: pointer;
      user-select: none;

      box-sizing: border-box;

      transition:
        background 0.15s ease,
        transform 0.15s ease;
    }

    .nova-tab:hover {
      background: rgba(255,255,255,0.13);
    }

    .nova-tab.active {
      background: #2596be;
      color: white;

      box-shadow: 0 3px 8px rgba(0,0,0,0.20);
    }

    .nova-tab-dot {
      width: 7px;
      height: 7px;

      flex-shrink: 0;

      border-radius: 50%;
      background: #a8d0e6;
    }

    .nova-tab.active .nova-tab-dot {
      background: white;
    }

    .nova-tab-title {
      flex: 1;
      min-width: 0;

      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      font-size: 14px;
    }

    .nova-tab-close {
      width: 22px !important;
      height: 22px !important;

      margin: 0 !important;
      padding: 0 !important;

      display: flex;
      align-items: center;
      justify-content: center;

      border: none;
      border-radius: 5px;

      background: transparent !important;
      color: inherit;

      box-shadow: none !important;

      font-family: Arial, sans-serif;
      font-size: 17px;

      cursor: pointer;
    }

    .nova-tab-close:hover {
      background: rgba(255,255,255,0.18) !important;
      transform: none !important;
    }

    #novaNewTab {
      width: 38px !important;
      height: 36px !important;

      min-width: 38px;

      margin: 0 !important;
      padding: 0 !important;

      border-radius: 9px;

      background: rgba(255,255,255,0.12);
      color: white;

      box-shadow: none;

      font-size: 23px;
      line-height: 1;
    }

    #novaNewTab:hover {
      background: rgba(255,255,255,0.22);
      transform: none;
    }

    @media (max-width: 600px) {
      .nova-tab {
        min-width: 105px;
      }
    }
  `;

  document.head.appendChild(style);


  /* =====================================================
     TAB BAR
     ===================================================== */

  const tabBar = document.createElement("div");
  tabBar.id = "novaTabsBar";

  const tabsList = document.createElement("div");
  tabsList.id = "novaTabsList";

  const newTabButton = document.createElement("button");
  newTabButton.id = "novaNewTab";
  newTabButton.textContent = "+";
  newTabButton.title = "New Tab";
  newTabButton.setAttribute("aria-label", "New Tab");

  const settingsMenu = document.createElement("div");
  settingsMenu.id = "novaSettingsMenu";

  const settingsMenuToggle = document.createElement("button");
  settingsMenuToggle.id = "novaSettingsMenuToggle";
  settingsMenuToggle.type = "button";
  settingsMenuToggle.textContent = "⋮";
  settingsMenuToggle.title = "More";
  settingsMenuToggle.setAttribute("aria-label", "More options");
  settingsMenuToggle.setAttribute("aria-expanded", "false");

  const settingsDropdown = document.createElement("div");
  settingsDropdown.id = "novaSettingsDropdown";
  settingsDropdown.setAttribute("role", "menu");

  const settingsButton = document.createElement("button");
  settingsButton.id = "novaSettingsButton";
  settingsButton.type = "button";
  settingsButton.setAttribute("role", "menuitem");
  settingsButton.innerHTML = "<span style='font-size:17px'>⚙️</span><span>Settings</span>";

  settingsDropdown.appendChild(settingsButton);
  settingsMenu.appendChild(settingsMenuToggle);
  settingsMenu.appendChild(settingsDropdown);

  tabBar.appendChild(tabsList);
  tabBar.appendChild(newTabButton);
  tabBar.appendChild(settingsMenu);

  settingsMenuToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    const open = settingsDropdown.classList.toggle("show");
    settingsMenuToggle.setAttribute("aria-expanded", String(open));
  });

  settingsButton.addEventListener("click", function () {
    settingsDropdown.classList.remove("show");
    settingsMenuToggle.setAttribute("aria-expanded", "false");

    try {
      if (typeof window.openNovaSettings === "function") {
        window.openNovaSettings();
        return;
      }

      const panel = document.getElementById("novaSettingsPanel");
      const content = document.getElementById("novaSettingsContent");

      if (panel && content && typeof window.renderNovaSettings === "function") {
        panel.classList.add("show");
        panel.setAttribute("aria-hidden", "false");
        window.renderNovaSettings(content);
        return;
      }
    } catch (err) {
      console.error("Nova Settings failed to open:", err);
    }

    // Last-resort fallback: show the existing panel instead of doing nothing.
    const panel = document.getElementById("novaSettingsPanel");
    if (panel) {
      panel.classList.add("show");
      panel.setAttribute("aria-hidden", "false");
    }
  });

  document.addEventListener("click", function (event) {
    if (!settingsMenu.contains(event.target)) {
      settingsDropdown.classList.remove("show");
      settingsMenuToggle.setAttribute("aria-expanded", "false");
    }
  });

  /*
     IMPORTANT:
     Put tabs BEFORE EVERYTHING, including the Nova logo.
  */
  document.body.insertBefore(tabBar, document.body.firstChild);


  /* =====================================================
     STATE
     ===================================================== */

  let tabs = [];
  let activeTabIndex = 0;
  let nextTabID = 1;


  function makeTab(name = "New Tab") {
    return {
      id: nextTabID++,
      name,

      input: "",

      nodes: {},

      resultVisible: false,
      dictionaryVisible: false,
      timelineVisible: false,
      rickrollVisible: false,

      audioVisible: false,
      audioSrc: "",

      query: "",
      commonsOffset: 0,
      images: [],
      lightIndex: -1,

      scrollY: 0
    };
  }


  /*
     These elements themselves NEVER get replaced.

     We only move their CHILDREN in and out.

     That means references like:

       const urlInput = ...
       const wikiSummaryEl = ...
       const imagesSection = ...

     remain valid forever.
  */

  const contentIDs = [
    "wikiSummary",
    "imagesSection",
    "videosSection",
    "dictionaryResults",
    "timelineList",
    "relatedSearches"
  ];


  function removeChildren(element) {
    if (!element) return [];

    const children = [];

    while (element.firstChild) {
      children.push(element.removeChild(element.firstChild));
    }

    return children;
  }


  function restoreChildren(element, children) {
    if (!element || !children) return;

    children.forEach(node => {
      element.appendChild(node);
    });
  }


  /* =====================================================
     SAVE CURRENT TAB
     ===================================================== */

  function saveCurrentTab() {
    const tab = tabs[activeTabIndex];

    if (!tab) return;

    tab.input = urlInput.value;

    tab.nodes = {};

    contentIDs.forEach(id => {
      const element = document.getElementById(id);

      if (element) {
        tab.nodes[id] = removeChildren(element);
      }
    });


    /* Result visibility */

    const results = document.getElementById("resultContainer");
    const dictionary = document.getElementById("dictionaryContainer");
    const timeline = document.getElementById("timelineContainer");
    const rickroll = document.getElementById("rickrollContainer");

    tab.resultVisible =
      results &&
      results.classList.contains("visible");

    tab.dictionaryVisible =
      dictionary &&
      dictionary.style.display !== "none" &&
      getComputedStyle(dictionary).display !== "none";

    tab.timelineVisible =
      timeline &&
      timeline.style.display !== "none" &&
      getComputedStyle(timeline).display !== "none";

    tab.rickrollVisible =
      rickroll &&
      rickroll.style.display !== "none";


    /* Audio */

    const audioBox = document.getElementById("audioBox");
    const audioPlayer = document.getElementById("audioPlayer");

    if (audioBox) {
      tab.audioVisible =
        audioBox.style.display !== "none";
    }

    if (audioPlayer) {
      tab.audioSrc =
        audioPlayer.getAttribute("src") || "";
    }


    /*
       Save Nova's existing global search state.
    */

    try {
      tab.query = currentQuery;
    } catch {}

    try {
      tab.commonsOffset = commonsOffset;
    } catch {}

    try {
      tab.images = [...imagesList];
    } catch {}

    try {
      tab.lightIndex = currentLightIndex;
    } catch {}

    tab.scrollY = window.scrollY;
  }


  /* =====================================================
     CLEAR UI
     ===================================================== */

  function clearNovaUI() {

    urlInput.value = "";

    const suggestionBox =
      document.getElementById("suggestionBox");

    if (suggestionBox) {
      suggestionBox.innerHTML = "";
      suggestionBox.classList.remove("show");
    }


    contentIDs.forEach(id => {
      const element = document.getElementById(id);

      if (element) {
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
      }
    });


    const results =
      document.getElementById("resultContainer");

    if (results) {
      results.classList.remove("visible");
    }


    const dictionary =
      document.getElementById("dictionaryContainer");

    if (dictionary) {
      dictionary.style.display = "none";
    }


    const timeline =
      document.getElementById("timelineContainer");

    if (timeline) {
      timeline.style.display = "none";
    }


    const rickroll =
      document.getElementById("rickrollContainer");

    if (rickroll) {
      rickroll.style.display = "none";
    }


    const spinner =
      document.getElementById("loadingSpinner");

    if (spinner) {
      spinner.classList.remove("visible");
    }


    const audioBox =
      document.getElementById("audioBox");

    if (audioBox) {
      audioBox.style.display = "none";
    }


    const audioPlayer =
      document.getElementById("audioPlayer");

    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.removeAttribute("src");
    }


    try {
      currentQuery = "";
    } catch {}

    try {
      commonsOffset = 0;
    } catch {}

    try {
      imagesList = [];
    } catch {}

    try {
      currentLightIndex = -1;
    } catch {}


    /*
       Close things that should not stay open between tabs.
    */

    const lightbox =
      document.getElementById("lightbox");

    if (lightbox) {
      lightbox.classList.remove("show");
    }
  }


  /* =====================================================
     RESTORE TAB
     ===================================================== */

  function restoreTab(index) {
    const tab = tabs[index];

    if (!tab) return;

    clearNovaUI();

    activeTabIndex = index;

    urlInput.value = tab.input || "";


    contentIDs.forEach(id => {
      const element = document.getElementById(id);

      if (element && tab.nodes[id]) {
        restoreChildren(
          element,
          tab.nodes[id]
        );
      }
    });


    const results =
      document.getElementById("resultContainer");

    if (results) {
      results.classList.toggle(
        "visible",
        !!tab.resultVisible
      );
    }


    const dictionary =
      document.getElementById("dictionaryContainer");

    if (dictionary) {
      dictionary.style.display =
        tab.dictionaryVisible
          ? "block"
          : "none";
    }


    const timeline =
      document.getElementById("timelineContainer");

    if (timeline) {
      timeline.style.display =
        tab.timelineVisible
          ? "block"
          : "none";
    }


    const rickroll =
      document.getElementById("rickrollContainer");

    if (rickroll) {
      rickroll.style.display =
        tab.rickrollVisible
          ? "block"
          : "none";
    }


    const audioBox =
      document.getElementById("audioBox");

    const audioPlayer =
      document.getElementById("audioPlayer");

    if (audioBox) {
      audioBox.style.display =
        tab.audioVisible
          ? "block"
          : "none";
    }

    if (audioPlayer && tab.audioSrc) {
      audioPlayer.src = tab.audioSrc;
    }


    try {
      currentQuery = tab.query || "";
    } catch {}

    try {
      commonsOffset = tab.commonsOffset || 0;
    } catch {}

    try {
      imagesList = [...(tab.images || [])];
    } catch {}

    try {
      currentLightIndex =
        tab.lightIndex ?? -1;
    } catch {}


    renderTabs();

    requestAnimationFrame(() => {
      window.scrollTo(0, tab.scrollY || 0);
    });
  }


  /* =====================================================
     NEW TAB
     ===================================================== */

  function createNewTab() {

    /*
       Save old tab.

       saveCurrentTab() removes its result children from
       the permanent Nova containers, leaving us with a
       clean workspace.
    */

    saveCurrentTab();

    clearNovaUI();

    const tab = makeTab();

    tabs.push(tab);

    activeTabIndex =
      tabs.length - 1;

    renderTabs();

    urlInput.focus();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* =====================================================
     SWITCH
     ===================================================== */

  function switchTab(index) {

    if (
      index === activeTabIndex ||
      !tabs[index]
    ) {
      return;
    }

    saveCurrentTab();

    restoreTab(index);

    urlInput.focus();
  }


  /* =====================================================
     CLOSE
     ===================================================== */

  function closeTab(index) {

    if (!tabs[index]) return;


    /*
       If only one tab exists, turn it into a clean tab
       instead of leaving Nova with zero tabs.
    */

    if (tabs.length === 1) {

      saveCurrentTab();

      tabs[0] = makeTab();

      activeTabIndex = 0;

      clearNovaUI();

      renderTabs();

      urlInput.focus();

      return;
    }


    if (index === activeTabIndex) {

      saveCurrentTab();

      tabs.splice(index, 1);

      activeTabIndex =
        Math.min(
          index,
          tabs.length - 1
        );

      restoreTab(activeTabIndex);

    } else {

      tabs.splice(index, 1);

      if (index < activeTabIndex) {
        activeTabIndex--;
      }

      renderTabs();
    }
  }


  /* =====================================================
     TITLES
     ===================================================== */

  function updateCurrentTabTitle() {

    const tab =
      tabs[activeTabIndex];

    if (!tab) return;

    const value =
      urlInput.value.trim();

    if (!value) {
      tab.name = "New Tab";
    } else if (value.length > 25) {
      tab.name =
        value.substring(0, 25) + "…";
    } else {
      tab.name = value;
    }

    renderTabs();
  }


  let titleTimer;

  urlInput.addEventListener("input", () => {

    clearTimeout(titleTimer);

    titleTimer = setTimeout(() => {
      updateCurrentTabTitle();
    }, 300);

  });


  /* =====================================================
     RENDER TAB BAR
     ===================================================== */

  function renderTabs() {

    tabsList.innerHTML = "";

    tabs.forEach((tab, index) => {

      const tabElement =
        document.createElement("div");

      tabElement.className =
        "nova-tab" +
        (
          index === activeTabIndex
            ? " active"
            : ""
        );

      tabElement.title = tab.name;


      const dot =
        document.createElement("span");

      dot.className =
        "nova-tab-dot";


      const title =
        document.createElement("span");

      title.className =
        "nova-tab-title";

      title.textContent =
        tab.name;


      const close =
        document.createElement("button");

      close.className =
        "nova-tab-close";

      close.textContent = "×";

      close.title = "Close tab";


      close.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          closeTab(index);
        }
      );


      tabElement.addEventListener(
        "click",
        () => {
          switchTab(index);
        }
      );


      /*
         Double click = rename.
      */

      tabElement.addEventListener(
        "dblclick",
        event => {

          event.stopPropagation();

          const name = prompt(
            "Rename tab:",
            tab.name
          );

          if (
            name !== null &&
            name.trim()
          ) {
            tab.name = name.trim();

            renderTabs();
          }
        }
      );


      tabElement.appendChild(dot);
      tabElement.appendChild(title);
      tabElement.appendChild(close);

      tabsList.appendChild(tabElement);
    });
  }


  /* =====================================================
     BUTTON
     ===================================================== */

  newTabButton.addEventListener(
    "click",
    createNewTab
  );


  /* =====================================================
     KEYBOARD SHORTCUTS
     ===================================================== */

  document.addEventListener(
    "keydown",
    event => {

      /* Ctrl + T */

      if (
        event.ctrlKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "t"
      ) {
        event.preventDefault();

        createNewTab();

        return;
      }


      /* Ctrl + W */

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "w"
      ) {
        event.preventDefault();

        closeTab(activeTabIndex);

        return;
      }


      /* Ctrl + Tab */

      if (
        event.ctrlKey &&
        !event.shiftKey &&
        event.key === "Tab"
      ) {
        event.preventDefault();

        if (tabs.length > 1) {

          switchTab(
            (activeTabIndex + 1) %
            tabs.length
          );
        }

        return;
      }


      /* Ctrl + Shift + Tab */

      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key === "Tab"
      ) {
        event.preventDefault();

        if (tabs.length > 1) {

          switchTab(
            (
              activeTabIndex -
              1 +
              tabs.length
            ) %
            tabs.length
          );
        }

        return;
      }


      /* Ctrl + 1 through Ctrl + 9 */

      if (
        event.ctrlKey &&
        !event.shiftKey &&
        /^[1-9]$/.test(event.key)
      ) {

        const target =
          Number(event.key) - 1;

        if (tabs[target]) {

          event.preventDefault();

          switchTab(target);
        }
      }

    }
  );


  /* =====================================================
     FIRST TAB
     ===================================================== */

  const firstTab =
    makeTab("New Tab");

  tabs.push(firstTab);

  /*
     IMPORTANT:
     We DO NOT save the first tab here because that would
     remove Nova's existing DOM content immediately.
  */

  renderTabs();


  console.log(
    "%cNova Tabs v2 loaded",
    "color:#2596be;font-weight:bold;font-size:14px;"
  );

})();
