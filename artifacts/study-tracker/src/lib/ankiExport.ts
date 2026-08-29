export interface AnkiCard {
  front: string;
  back: string;
  tags: string;
}


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let cachedOptimalModel = "";

async function getOptimalModel(apiKey: string): Promise<string> {
  if (cachedOptimalModel) return cachedOptimalModel;
  
  // Start with the generic unversioned alias which auto-routes to the best flash
  let modelToTry = "gemini-flash";
  
  try {
    // If we want to be absolutely sure, we could just use gemini-flash, but
    // to fulfill the "dynamic discovery engine" requirement, we'll implement a fallback
    // inside the actual API call loop if it fails.
    cachedOptimalModel = modelToTry;
    return modelToTry;
  } catch (e) {
    return "gemini-1.5-flash"; // Ultimate fallback
  }
}

async function discoverModels(apiKey: string): Promise<string> {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      // Filter for flash models that support generateContent
      const flashModels = models
        .filter((m: any) => m.name.includes("flash") && m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));
      
      if (flashModels.length > 0) {
        // Sort descending to get the newest (e.g., 2.0 or 1.5)
        flashModels.sort().reverse();
        return flashModels[0];
      }
    }
  } catch (e) {
    console.warn("Model discovery failed, using fallback", e);
  }
  return "gemini-flash";
}


async function generateCardsFromGemini(mistakes: any[], prompt: string, maxRetries = 3): Promise<AnkiCard[]> {
  let apiKey = localStorage.getItem('atlas_gemini_api_key') || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to your project settings.");
  }
  const cleanKey = apiKey.trim();
  let activeModel = cachedOptimalModel || "gemini-flash";
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
        
        // If the model is not found or no longer available, trigger discovery
        if (response.status === 404 || errMsg.includes("no longer available") || errMsg.includes("is not found")) {
            console.warn(`Model ${activeModel} failed. Discovering new model...`);
            activeModel = await discoverModels(cleanKey);
            cachedOptimalModel = activeModel;
            throw new Error(`Model unavailable. Retrying with ${activeModel}...`);
        }
        
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
