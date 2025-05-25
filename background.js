chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === 'summarize' || message.action === 'improve') {
    const endpoint = 'https://lingering-hall-0999.igalk1515.workers.dev';
    const payload = { ...message }; // includes all necessary fields

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (message.action === 'summarize') {
        const summary =
          data.choices?.[0]?.message?.content?.trim() || 'No summary returned.';
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'showSummary',
          summary,
          x: message.x,
          y: message.y,
        });
      } else if (message.action === 'improve') {
        const improved =
          data.choices?.[0]?.message?.content?.trim() || 'No improved text.';
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'improvedText',
          improved,
        });
      }
    } catch (err) {
      console.error('AI Buddy error:', err);
      if (message.action === 'summarize') {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'showSummary',
          summary: 'Failed to summarize. Please try again.',
          x: message.x,
          y: message.y,
        });
      } else if (message.action === 'improve') {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'improvedText',
          improved: 'Failed to improve. Please try again.',
        });
      }
    }
  }
});
