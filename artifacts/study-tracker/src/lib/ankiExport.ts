export interface AnkiCard {
  front: string;
  back: string;
  tags: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  let apiKey = localStorage.getItem('atlas_gemini_api_key') || "";
  
  const enhancedOptions = {
    ...options,
    headers: {
      ...options?.headers,
      ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
    }
  };

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, enhancedOptions);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (e: any) {
      if (i === maxRetries - 1) throw e;
      if (e.message && e.message.includes("GEMINI_API_KEY")) throw e; // don't retry if it's a key missing error
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff: 1s, 2s...
    }
  }
}

export async function generateAnkiDeck(
  mistakes: any[],
  prompt: string,
  formatType: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ cards: AnkiCard[], failed: number }> {
  const batchSize = 10;
  const totalCards: AnkiCard[] = [];
  let failed = 0;

  for (let i = 0; i < mistakes.length; i += batchSize) {
    const batch = mistakes.slice(i, i + batchSize);
    
    try {
      const data = await fetchWithRetry('/api/anki/generate-anki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mistakes: batch, prompt, formatType }),
      }, 3);

      if (data && data.cards) {
        totalCards.push(...data.cards);
      }
    } catch (e: any) {
      console.error("Failed to generate Anki cards for batch", e);
      if (e.message && e.message.includes("GEMINI_API_KEY")) throw e;
      failed += batch.length;
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, mistakes.length), mistakes.length);
    }
  }

  return { cards: totalCards, failed };
}

export async function generateAnkiPreview(mistake: any, prompt: string, formatType: string): Promise<AnkiCard | null> {
  const data = await fetchWithRetry('/api/anki/generate-anki', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mistakes: [mistake], prompt, formatType }),
  }, 1);

  if (data && data.cards && data.cards.length > 0) {
    return data.cards[0];
  }
  return null;
}

export function downloadAnkiTSV(cards: AnkiCard[], filename: string = "Atlas_AI_Anki_Deck.txt", customTags: string = "", targetDeck: string = "") {
  if (cards.length === 0) return;

  const rows = cards.map(c => {
    const front = (c.front || "").replace(/\n/g, "<br>");
    const back = (c.back || "").replace(/\n/g, "<br>");
    
    if (targetDeck.trim()) {
      return `${front}\t${back}\t${customTags}\t${targetDeck}`;
    } else if (customTags.trim()) {
      return `${front}\t${back}\t${customTags}`;
    } else {
      return `${front}\t${back}`;
    }
  });

  const tsvContent = rows.join("\n");
  const blob = new Blob([tsvContent], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
