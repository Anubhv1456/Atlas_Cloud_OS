import sys

path = 'artifacts/study-tracker/src/lib/ankiExport.ts'
with open(path, 'r') as f:
    content = f.read()

target = """async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
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
}"""

replacement = """async function generateCardsFromGemini(mistakes: any[], prompt: string, maxRetries = 3): Promise<AnkiCard[]> {
  let apiKey = localStorage.getItem('atlas_gemini_api_key') || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to your project settings.");
  }
  const cleanKey = apiKey.trim();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`;

  const systemInstruction = `You are an elite medical educator creating Anki flashcards. You must output strictly valid JSON containing an array of objects with 'front' and 'back' keys. You must wrap medical keywords in HTML <b> tags.`;
  const userPrompt = `Format Instructions:\\n${prompt || "Format these as Q&A or cloze deletions for optimal active recall studying."}\\n\\nMistakes Data:\\n${JSON.stringify(mistakes, null, 2)}`;

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { 
      response_mime_type: 'application/json',
      temperature: 0.2
    }
  };

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
      }
      const data = await response.json();
      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!outputText) throw new Error("No response from Gemini API");
      
      const cards = JSON.parse(outputText);
      if (!Array.isArray(cards)) throw new Error("API did not return an array");
      return cards;
    } catch (e: any) {
      if (i === maxRetries - 1) throw e;
      if (e.message && e.message.includes("GEMINI_API_KEY")) throw e;
      await sleep(1000 * Math.pow(2, i));
    }
  }
  return [];
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
      const cards = await generateCardsFromGemini(batch, prompt, 3);
      if (cards && cards.length > 0) {
        totalCards.push(...cards);
      }
    } catch (e: any) {
      console.error("Failed to generate Anki cards for batch", e);
      if (e.message && (e.message.includes("GEMINI_API_KEY") || e.message.includes("API key"))) throw e;
      failed += batch.length;
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, mistakes.length), mistakes.length);
    }
  }

  return { cards: totalCards, failed };
}

export async function generateAnkiPreview(mistake: any, prompt: string, formatType: string): Promise<AnkiCard | null> {
  try {
    const cards = await generateCardsFromGemini([mistake], prompt, 1);
    if (cards && cards.length > 0) {
      return cards[0];
    }
  } catch (e: any) {
    console.error("Failed to generate Anki preview", e);
    throw e;
  }
  return null;
}"""

if target in content:
    with open(path, 'w') as f:
        f.write(content.replace(target, replacement))
    print('SUCCESS')
else:
    print('TARGET NOT FOUND')
