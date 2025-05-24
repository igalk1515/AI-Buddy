chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === 'summarize') {
    const { text, x, y } = message;

    try {
      const response = await fetch(
        'https://lingering-hall-0999.igalk1515.workers.dev',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        }
      );

      const data = await response.json();
      const summary =
        data.choices?.[0]?.message?.content?.trim() || 'No summary returned.';

      // Inject into page
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: (summary, x, y) => {
          // Remove old box if exists
          const oldBox = document.getElementById('tldr-buddy-summary-box');
          if (oldBox) oldBox.remove();

          // Create box
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

          // Close button
          document.getElementById('tldr-close-btn').onclick = () =>
            box.remove();

          // Copy button
          document.getElementById('tldr-copy-btn').onclick = () => {
            const text = document.getElementById(
              'tldr-summary-content'
            ).innerText;
            navigator.clipboard.writeText(text);
            document.getElementById('tldr-copy-btn').textContent = '✅ Copied!';
            setTimeout(
              () =>
                (document.getElementById('tldr-copy-btn').textContent =
                  '📋 Copy'),
              1200
            );
          };

          // Auto-remove after 30s
          setTimeout(() => {
            box.remove();
          }, 30000);
        },
        args: [summary, x, y],
      });
    } catch (err) {
      console.error('TL;DR Buddy error:', err);
    }
  }
});
