let tldrButton;

document.addEventListener('mouseup', (e) => {
  // If you clicked the icon itself, ignore
  if (e.target && tldrButton && e.target === tldrButton) {
    return;
  }
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText || selectedText.length > 2500) {
    removeTLDRButton();
    return;
  }
  showTLDRButton(e.pageX, e.pageY);
});

function showTLDRButton(x, y) {
  removeTLDRButton();

  tldrButton = document.createElement('img');
  tldrButton.src = chrome.runtime.getURL('icons/icon64.png');
  tldrButton.style.cssText = `
    position: absolute;
    left: ${x + 25}px;
    top: ${y + 25}px;
    width: 64px;
    height: 64px;
    cursor: pointer;
    z-index: 9999999;
    background: white;
    border-radius: 4px;
    box-shadow: 0 0 5px rgba(0,0,0,0.2);
  `;
  tldrButton.addEventListener('mousedown', (event) => {
    event.stopPropagation(); // Prevent mouseup on doc from firing
  });
  tldrButton.addEventListener('click', () => {
    const text = window.getSelection().toString();
    chrome.runtime.sendMessage({ action: 'summarize', text, x, y });
    showLoadingBox(x, y);
    removeTLDRButton();
  });

  document.body.appendChild(tldrButton);
}

function showLoadingBox(x, y) {
  removeLoadingBox();
  const loadingBox = document.createElement('div');
  loadingBox.id = 'tldr-buddy-loading-box';
  loadingBox.textContent = 'Summarizing...';
  loadingBox.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    min-width: 120px;
    padding: 14px 20px;
    background: #fffbe9;
    color: #666;
    border: 1px solid #ffd084;
    border-radius: 8px;
    font-size: 16px;
    font-family: 'Segoe UI', Arial, sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.09);
    z-index: 99999999;
  `;
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
  // Remove old summary if needed
  const oldBox = document.getElementById('tldr-buddy-summary-box');
  if (oldBox) oldBox.remove();

  const box = document.createElement('div');
  box.id = 'tldr-buddy-summary-box';
  box.innerHTML = `
    <div style="
      display: flex; 
      justify-content: space-between; 
      align-items: start;
    ">
      <span style="font-weight:bold;font-size:16px;letter-spacing:1px;">TL;DR Buddy</span>
      <button id="tldr-close-btn" style="
        background:none;
        border:none;
        font-size:16px;
        cursor:pointer;
        color:#aaa;
        margin-left:8px;
      " title="Close">❌</button>
    </div>
    <div id="tldr-summary-content" style="
      margin: 10px 0 6px 0;
      font-size: 14px;
      line-height: 1.6;
      direction: ${/[\u0590-\u05FF]/.test(summary) ? 'rtl' : 'ltr'};
      white-space: pre-wrap;
      word-break: break-word;
    ">${summary.replace(/</g, '&lt;')}</div>
    <button id="tldr-copy-btn" style="
      background: #eee;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 12px;
      padding: 4px 10px;
      cursor: pointer;
      margin-top: 5px;
      float: right;
    ">📋 Copy</button>
  `;
  box.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y + 20}px;
    min-width: 180px;
    max-width: 350px;
    background: #fff;
    border: 1.5px solid #aaa;
    border-radius: 10px;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 24px 4px rgba(0,0,0,0.13);
    z-index: 2147483647;
    padding: 12px 16px 10px 16px;
    transition: box-shadow 0.15s;
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

  setTimeout(() => box.remove(), 30000);
}
