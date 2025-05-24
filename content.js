// Inject the CSS once per page
function injectAIBuddyCSS() {
  if (document.getElementById('ai-buddy-style')) return;
  const link = document.createElement('link');
  link.id = 'ai-buddy-style';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = chrome.runtime.getURL('ai-buddy.css');
  document.head.appendChild(link);
}
injectAIBuddyCSS();

// --- Highlight to Summarize ---
let aiButton;

document.addEventListener('mouseup', (e) => {
  if (
    (aiButton && e.target === aiButton) ||
    (e.target.closest && e.target.closest('#ai-buddy-summary-box'))
  ) {
    return;
  }
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
      removeAIButton();
      removeLoadingBox();
      removeSummaryBox();
      return;
    }
    showAIButton(e.pageX, e.pageY);
  }, 0);
});

document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  const box = document.getElementById('ai-buddy-summary-box');
  function isNodeInBox(node, box) {
    while (node) {
      if (node === box) return true;
      node = node.parentNode;
    }
    return false;
  }
  if (
    !selectedText &&
    (!selection.anchorNode || !box || !isNodeInBox(selection.anchorNode, box))
  ) {
    removeAIButton();
    removeLoadingBox();
    removeSummaryBox();
  }
});

function removeSummaryBox() {
  const box = document.getElementById('ai-buddy-summary-box');
  if (box) box.remove();
}

function showAIButton(x, y) {
  removeAIButton();
  aiButton = document.createElement('img');
  aiButton.src = chrome.runtime.getURL('icons/icon64.png');
  aiButton.className = 'ai-buddy-icon';
  aiButton.style.left = `${x + 25}px`;
  aiButton.style.top = `${y + 25}px`;
  aiButton.addEventListener('mousedown', (event) => {
    event.stopPropagation();
  });
  aiButton.addEventListener('click', () => {
    const text = window.getSelection().toString();
    chrome.runtime.sendMessage({
      action: 'summarize',
      text,
      x,
      y,
      url: window.location.href,
      hostname: window.location.hostname,
      title: document.title,
    });
    showLoadingBox(x, y);
    removeAIButton();
  });
  document.body.appendChild(aiButton);
}

function showLoadingBox(x, y) {
  removeLoadingBox();
  const loadingBox = document.createElement('div');
  loadingBox.id = 'ai-buddy-loading-box';
  loadingBox.className = 'ai-buddy-loading-box';
  loadingBox.textContent = 'Summarizing...';
  loadingBox.style.left = `${x}px`;
  loadingBox.style.top = `${y}px`;
  document.body.appendChild(loadingBox);
}

function removeLoadingBox() {
  const box = document.getElementById('ai-buddy-loading-box');
  if (box) box.remove();
}

function removeAIButton() {
  if (aiButton) {
    aiButton.remove();
    aiButton = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showSummary') {
    removeLoadingBox();
    showSummaryBox(message.summary, message.x, message.y);
  }
});

function showSummaryBox(summary, x, y) {
  summary = summary.trim();
  const oldBox = document.getElementById('ai-buddy-summary-box');
  if (oldBox) oldBox.remove();
  const box = document.createElement('div');
  box.id = 'ai-buddy-summary-box';
  box.className = 'ai-buddy-summary-box';
  box.style.left = `${x}px`;
  box.style.top = `${y + 20}px`;
  box.innerHTML = `
    <div class="ai-header">
      <span class="ai-title">AI Buddy</span>
      <button id="ai-close-btn" class="ai-close-btn" title="Close">❌</button>
    </div>
    <div id="ai-summary-content" class="ai-summary-content" style="direction:${
      /[\u0590-\u05FF]/.test(summary) ? 'rtl' : 'ltr'
    };">${summary.replace(/</g, '&lt;')}</div>
    <button id="ai-copy-btn" class="ai-copy-btn">📋 Copy</button>
  `;
  document.body.appendChild(box);

  document.getElementById('ai-close-btn').onclick = () => box.remove();

  document.getElementById('ai-copy-btn').onclick = () => {
    const text = document.getElementById('ai-summary-content').innerText;
    navigator.clipboard.writeText(text);
    document.getElementById('ai-copy-btn').textContent = '✅ Copied!';
    setTimeout(
      () => (document.getElementById('ai-copy-btn').textContent = '📋 Copy'),
      1200
    );
  };
}

// --- AI Buddy for Writing Improvement in Text Fields ---
let aiBuddyInputIcon = null;
let lastInputElement = null;

document.addEventListener('focusin', (e) => {
  const el = e.target;
  if (
    el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && el.type === 'text') ||
    el.isContentEditable
  ) {
    showAIBuddyInputIcon(el);
  } else {
    removeAIBuddyInputIcon();
  }
});

document.addEventListener('mousedown', (e) => {
  if (
    aiBuddyInputIcon &&
    !aiBuddyInputIcon.contains(e.target) &&
    lastInputElement &&
    e.target !== lastInputElement
  ) {
    removeAIBuddyInputIcon();
  }
});

function showAIBuddyInputIcon(inputEl) {
  removeAIBuddyInputIcon();
  lastInputElement = inputEl;
  const rect = inputEl.getBoundingClientRect();
  aiBuddyInputIcon = document.createElement('img');
  aiBuddyInputIcon.src = chrome.runtime.getURL('icons/icon64.png');
  aiBuddyInputIcon.alt = 'AI Buddy';
  aiBuddyInputIcon.title = 'Improve my writing';
  aiBuddyInputIcon.className = 'ai-buddy-input-icon';
  aiBuddyInputIcon.style.left = `${rect.left - 32}px`;
  aiBuddyInputIcon.style.top = `${rect.bottom - 32}px`;

  aiBuddyInputIcon.onclick = (ev) => {
    ev.stopPropagation();
    showAIBuddyImproveWindow(inputEl, aiBuddyInputIcon);
  };

  document.body.appendChild(aiBuddyInputIcon);
}

function removeAIBuddyInputIcon() {
  if (aiBuddyInputIcon) {
    aiBuddyInputIcon.remove();
    aiBuddyInputIcon = null;
  }
  lastInputElement = null;
}

function showAIBuddyImproveWindow(inputEl, iconEl) {
  const old = document.getElementById('ai-buddy-improve-window');
  if (old) old.remove();

  const rect = iconEl.getBoundingClientRect();
  const origText = inputEl.value || inputEl.innerText || '';

  // Create window offscreen for measurement
  const win = document.createElement('div');
  win.id = 'ai-buddy-improve-window';
  win.className = 'ai-buddy-improve-window';
  win.style.position = 'fixed';
  win.style.left = '-1000px';
  win.style.top = '-1000px';

  win.innerHTML = `
    <div class="ai-buddy-title" style="cursor: move;">AI Buddy</div>
    <textarea class="ai-buddy-original-text" rows="5" style="width:99%;">${origText}</textarea>
    <label for="ai-buddy-tone" style="display:block;margin-top:6px;">Tone:</label>
    <select id="ai-buddy-tone" class="ai-buddy-tone" style="margin-bottom:8px;">
      <option value="default">📝 Default</option>
      <option value="formal">🎩 Formal</option>
      <option value="friendly">😊 Friendly</option>
      <option value="concise">✂️ Concise</option>
      <option value="detailed">📚 Detailed</option>
    </select>
    <div style="margin-top:10px;">
      <button id="ai-buddy-improve-btn">✍️ Improve</button>
      <button id="ai-buddy-close-btn">❌ Cancel</button>
    </div>
  `;

  document.body.appendChild(win);

  // --- Now get real width/height for positioning ---
  const winRect = win.getBoundingClientRect();
  let left = rect.right + 12;
  let top = rect.top;

  if (left + winRect.width > window.innerWidth)
    left = window.innerWidth - winRect.width - 8;
  if (top + winRect.height > window.innerHeight)
    top = window.innerHeight - winRect.height - 8;
  if (left < 0) left = 8;
  if (top < 0) top = 8;

  win.style.left = `${left}px`;
  win.style.top = `${top}px`;

  // --- Draggable window logic ---
  let isDragging = false,
    dragOffsetX = 0,
    dragOffsetY = 0;
  const header = win.querySelector('.ai-buddy-title');
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragOffsetX = e.clientX - win.offsetLeft;
    dragOffsetY = e.clientY - win.offsetTop;
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('mouseup', dragEnd);

  function dragMove(e) {
    if (!isDragging) return;
    let nx = e.clientX - dragOffsetX;
    let ny = e.clientY - dragOffsetY;
    // Clamp to viewport
    if (nx < 0) nx = 0;
    if (ny < 0) ny = 0;
    if (nx + win.offsetWidth > window.innerWidth)
      nx = window.innerWidth - win.offsetWidth;
    if (ny + win.offsetHeight > window.innerHeight)
      ny = window.innerHeight - win.offsetHeight;
    win.style.left = `${nx}px`;
    win.style.top = `${ny}px`;
  }
  function dragEnd() {
    isDragging = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
  }

  // --- Click outside to close ---
  function handleClickOutside(event) {
    if (!win.contains(event.target) && event.target !== iconEl) {
      win.remove();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }
  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside);
  }, 0);

  // --- Button logic ---
  win.querySelector('#ai-buddy-improve-btn').onclick = () => {
    const text = win.querySelector('.ai-buddy-original-text').value;
    const tone = win.querySelector('.ai-buddy-tone').value;
    alert(
      JSON.stringify(
        {
          action: 'improve',
          text,
          tone,
          url: window.location.href,
          hostname: window.location.hostname,
          title: document.title,
        },
        null,
        2
      )
    );
    win.remove();
    document.removeEventListener('mousedown', handleClickOutside);
  };
  win.querySelector('#ai-buddy-close-btn').onclick = () => {
    win.remove();
    document.removeEventListener('mousedown', handleClickOutside);
  };
}
