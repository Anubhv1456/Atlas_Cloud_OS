export interface AnkiCard {
  front: string;
  back: string;
  tags: string;
}


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getPreferredModel(): string {
  const preferredModel = localStorage.getItem('atlas_ai_preferred_model');
  if (preferredModel) return preferredModel;
  throw new Error("No AI model selected. Please visit Settings to select an active model.");
}


async function generateCardsFromGemini(mistakes: any[], prompt: string, maxRetries = 3): Promise<AnkiCard[]> {
  let apiKey = localStorage.getItem('atlas_gemini_api_key') || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to your project settings.");
  }
  const cleanKey = apiKey.trim();
  let activeModel = getPreferredModel();
  let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;

  const systemInstruction = `You are an elite medical educator creating Anki flashcards. You must output strictly valid JSON containing an array of objects with 'front' and 'back' keys. You must wrap medical keywords in HTML <b> tags.`;
  const userPrompt = `Format Instructions:\n${prompt || "Format these as Q&A or cloze deletions for optimal active recall studying."}\n\nMistakes Data:\n${JSON.stringify(mistakes, null, 2)}`;

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
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `API error: ${response.statusText}`;
        

        
        throw new Error(errMsg);
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
