// Inject the CSS once per page
function injectAIBuddyCSS() {
  if (document.getElementById('tldr-buddy-style')) return;
  const link = document.createElement('link');
  link.id = 'tldr-buddy-style';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = chrome.runtime.getURL('tldr-buddy.css');
  document.head.appendChild(link);
}
injectAIBuddyCSS();

let tldrButton;

// --- Highlight to Summarize ---
document.addEventListener('mouseup', (e) => {
  if (
    (tldrButton && e.target === tldrButton) ||
    (e.target.closest && e.target.closest('#tldr-buddy-summary-box'))
  ) {
    return;
  }
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) {
      removeTLDRButton();
      removeLoadingBox();
      removeSummaryBox();
      return;
    }
    showTLDRButton(e.pageX, e.pageY);
  }, 0);
});

document.addEventListener('selectionchange', () => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  const box = document.getElementById('tldr-buddy-summary-box');
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
    removeTLDRButton();
    removeLoadingBox();
    removeSummaryBox();
  }
});

function removeSummaryBox() {
  const box = document.getElementById('tldr-buddy-summary-box');
  if (box) box.remove();
}

function showTLDRButton(x, y) {
  removeTLDRButton();
  tldrButton = document.createElement('img');
  tldrButton.src = chrome.runtime.getURL('icons/icon64.png');
  tldrButton.className = 'tldr-buddy-icon';
  tldrButton.style.left = `${x + 25}px`;
  tldrButton.style.top = `${y + 25}px`;
  tldrButton.addEventListener('mousedown', (event) => {
    event.stopPropagation();
  });
  tldrButton.addEventListener('click', () => {
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
    removeTLDRButton();
  });
  document.body.appendChild(tldrButton);
}

function showLoadingBox(x, y) {
  removeLoadingBox();
  const loadingBox = document.createElement('div');
  loadingBox.id = 'tldr-buddy-loading-box';
  loadingBox.className = 'tldr-buddy-loading-box';
  loadingBox.textContent = 'Summarizing...';
  loadingBox.style.left = `${x}px`;
  loadingBox.style.top = `${y}px`;
  document.body.appendChild(loadingBox);
}

function removeLoadingBox() {
  const box = document.getElementById('tldr-buddy-loading-box');
  if (box) box.remove();
}

function removeTLDRButton() {
  if (tldrButton) {
    tldrButton.remove();
    tldrButton = null;
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
  const oldBox = document.getElementById('tldr-buddy-summary-box');
  if (oldBox) oldBox.remove();
  const box = document.createElement('div');
  box.id = 'tldr-buddy-summary-box';
  box.className = 'tldr-buddy-summary-box';
  box.style.left = `${x}px`;
  box.style.top = `${y + 20}px`;
  box.innerHTML = `
    <div class="tldr-header">
      <span class="tldr-title">AI Buddy</span>
      <button id="tldr-close-btn" class="tldr-close-btn" title="Close">❌</button>
    </div>
    <div id="tldr-summary-content" class="tldr-summary-content" style="direction:${
      /[\u0590-\u05FF]/.test(summary) ? 'rtl' : 'ltr'
    };">${summary.replace(/</g, '&lt;')}</div>
    <button id="tldr-copy-btn" class="tldr-copy-btn">📋 Copy</button>
  `;
  document.body.appendChild(box);

  document.getElementById('tldr-close-btn').onclick = () => box.remove();

  document.getElementById('tldr-copy-btn').onclick = () => {
    const text = document.getElementById('tldr-summary-content').innerText;
    navigator.clipboard.writeText(text);
    document.getElementById('tldr-copy-btn').textContent = '✅ Copied!';
    setTimeout(
      () => (document.getElementById('tldr-copy-btn').textContent = '📋 Copy'),
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
