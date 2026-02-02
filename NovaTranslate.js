(function () {
  // create helper
  const $ = (sel, root = document) => root.querySelector(sel);
  const create = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v);
    });
    children.forEach(c => el.appendChild(c));
    return el;
  };

  // create the main container
  function createNovaTranslateUI(container) {
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.padding = '12px';
    container.style.fontFamily = 'sans-serif';
    container.style.background = '#0b0f14';
    container.style.color = '#e6e6e6';
    container.style.width = '100%';
    container.style.maxWidth = '600px';
    container.style.margin = 'auto';

    // Language selection row
    const langRow = create('div', { style: 'display:flex;gap:8px;' });
    const fromLang = create('select', { id: 'fromLang', style:'flex:1;padding:6px;border-radius:6px;background:#1a1f28;color:#e6e6e6;border:none;' });
    ['Auto','English','Spanish','French','German','Portuguese'].forEach(l => fromLang.add(new Option(l, l.slice(0,2).toLowerCase())));
    const toLang = create('select', { id: 'toLang', style:'flex:1;padding:6px;border-radius:6px;background:#1a1f28;color:#e6e6e6;border:none;' });
    ['English','Spanish','French','German','Portuguese'].forEach(l => toLang.add(new Option(l, l.slice(0,2).toLowerCase())));
    langRow.appendChild(fromLang);
    langRow.appendChild(toLang);
    container.appendChild(langRow);

    // Input textarea
    const inputText = create('textarea', {
      id:'inputText',
      placeholder:'Type text to translate...',
      style:'width:100%;min-height:100px;padding:8px;border-radius:8px;background:#1a1f28;color:#e6e6e6;border:none;resize:vertical;'
    });
    container.appendChild(inputText);

    // Translate button
    const translateBtn = create('button', {
      id:'translateBtn',
      text:'Translate',
      style:'padding:8px 14px;border:none;border-radius:8px;background:#2596be;color:#fff;font-weight:700;cursor:pointer;transition:all 0.2s;'
    });
    translateBtn.onmouseover = () => translateBtn.style.background = '#0f75a8';
    translateBtn.onmouseout = () => translateBtn.style.background = '#2596be';
    container.appendChild(translateBtn);

    // Output textarea
    const outputText = create('textarea', {
      id:'outputText',
      placeholder:'Translation appears here...',
      readonly:true,
      style:'width:100%;min-height:100px;padding:8px;border-radius:8px;background:#1a1f28;color:#e6e6e6;border:none;resize:none;'
    });
    container.appendChild(outputText);

    // Status
    const status = create('div', { id:'status', text:'Ready', style:'font-size:12px;color:#a8d0e6;margin-top:4px;' });
    container.appendChild(status);

    // --- translation logic ---
    translateBtn.addEventListener('click', async () => {
      const input = inputText.value.trim();
      if(!input) return;
      const from = fromLang.value;
      const to = toLang.value;
      status.textContent = 'Translating…';
      outputText.value = '';

      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;

      try {
        const res = await fetch(url);
        if(!res.ok){ status.textContent = 'Network error'; return; }
        const data = await res.json();
        if(data?.responseData?.translatedText){
          outputText.value = data.responseData.translatedText;
          status.textContent = 'Translated';
        } else {
          status.textContent = 'Translation error';
        }
      } catch(err){
        console.error(err);
        status.textContent = 'Network/API error';
      }
    });
  }

  // expose globally for testing
  window.createNovaTranslateUI = createNovaTranslateUI;

})();
