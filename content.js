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

let aiButton;

// --- Highlight to Summarize ---
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
  aiBuddyInputIcon.style.left = `${rect.right - 32}px`;
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
  // Remove previous window
  const old = document.getElementById('ai-buddy-improve-window');
  if (old) old.remove();
  const rect = iconEl.getBoundingClientRect();
  const win = document.createElement('div');
  win.id = 'ai-buddy-improve-window';
  win.className = 'ai-buddy-improve-window';
  win.style.left = `${rect.left - 10}px`;
  win.style.top = `${rect.top - 60}px`;
  win.innerHTML = `
    <div class="ai-buddy-title">AI Buddy</div>
    <button id="ai-buddy-improve-btn" class="ai-buddy-improve-btn">✍️ Improve my writing</button>
    <button id="ai-buddy-close-btn" class="ai-buddy-close-btn">❌</button>
  `;
  document.body.appendChild(win);

  win.querySelector('#ai-buddy-improve-btn').onclick = () => {
    const text = inputEl.value || inputEl.innerText || '';
    alert('Would send for improvement:\n\n' + text);
    // Replace alert with actual backend logic if needed
  };
  win.querySelector('#ai-buddy-close-btn').onclick = () => win.remove();
}
