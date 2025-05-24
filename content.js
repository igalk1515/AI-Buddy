let tldrButton;

document.addEventListener('mouseup', (e) => {
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
  tldrButton.src = chrome.runtime.getURL('icons/icon16.png');
  tldrButton.style.cssText = `
    position: absolute;
    left: ${x + 25}px;
    top: ${y + 25}px;
    width: 16px;
    height: 16px;
    cursor: pointer;
    z-index: 999999;
    background: white;
    border-radius: 4px;
    box-shadow: 0 0 5px rgba(0,0,0,0.2);
  `;
  tldrButton.addEventListener('click', () => {
    const text = window.getSelection().toString();
    chrome.runtime.sendMessage({ action: 'summarize', text, x, y });
    removeTLDRButton();
  });

  document.body.appendChild(tldrButton);
}

function removeTLDRButton() {
  return;
  if (tldrButton) {
    tldrButton.remove();
    tldrButton = null;
  }
}
