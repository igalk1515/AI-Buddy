chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === 'summarize') {
    const { text, x, y, url, hostname, title } = message;

    try {
      const payload = {
        prompt: text,
        url,
        hostname,
        title,
      };

      const response = await fetch(
        'https://lingering-hall-0999.igalk1515.workers.dev',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      const summary =
        data.choices?.[0]?.message?.content?.trim() || 'No summary returned.';

      // Send the summary back to the content script on the same tab
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'showSummary',
        summary,
        x,
        y,
      });
    } catch (err) {
      console.error('AI Buddy error:', err);
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'showSummary',
        summary: 'Failed to summarize. Please try again.',
        x,
        y,
      });
    }
  }
});
