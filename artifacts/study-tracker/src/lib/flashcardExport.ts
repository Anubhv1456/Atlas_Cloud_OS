export interface Flashcard {
  front: string;
  back: string;
  tags: string;
}


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getPreferredModel(): string {
  try {
    const preferredModel = localStorage.getItem('atlas_ai_preferred_model');
    if (preferredModel && preferredModel.trim()) return preferredModel.trim();
  } catch {
    // ignore
  }
  return 'gemini-2.5-flash';
}


function repairClozeBraces(text: string): string {
  // Automatically balance unclosed cloze deletions (e.g. {{c1::Term without }})
  const openCount = (text.match(/\{\{c\d+::/g) || []).length;
  const closeCount = (text.match(/\}\}/g) || []).length;
  if (openCount > closeCount) {
    return text + '}}'.repeat(openCount - closeCount);
  }
  return text;
}

function cleanAndParseJsonCards(text: string): Flashcard[] {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error('API did not return a JSON array of flashcards');
  }

  return parsed
    .filter(c => c && (c.front || c.question) && (c.back || c.answer))
    .map(c => ({
      front: repairClozeBraces(String(c.front || c.question || '').trim()),
      back: repairClozeBraces(String(c.back || c.answer || '').trim()),
      tags: String(c.tags || '').trim()
    }));
}

const sanitizeMistakeForPrompt = (m: any) => {
  const rawQ = typeof m.question === 'string' ? m.question : (m.title || '');
  const rawA = typeof m.correctAnswer === 'string' ? m.correctAnswer : (m.answer || '');
  const rawC = typeof m.concept === 'string' ? m.concept : (m.subject || '');

  const q = rawQ.replace(/data:image\/[^;]+;base64,[^"\s)]+/g, '[Attached Diagram]').slice(0, 1500);
  const a = rawA.replace(/data:image\/[^;]+;base64,[^"\s)]+/g, '[Attached Diagram]').slice(0, 1000);
  const c = rawC.slice(0, 200);

  return { question: q, answer: a, concept: c };
};

async function generateCardsFromGemini(
  mistakes: any[], 
  prompt: string, 
  maxRetries = 3,
  parentSignal?: AbortSignal
): Promise<Flashcard[]> {
  let apiKey = localStorage.getItem('atlas_gemini_api_key') || "";
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to your project settings.");
  }
  const cleanKey = apiKey.trim();
  let activeModel = getPreferredModel();
  let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;

  const systemInstruction = `You are an elite medical educator creating smart flashcards. You must wrap medical keywords in HTML <b> tags.`;
  const userPrompt = `Format Instructions:\n${prompt || "Format these as Q&A or cloze deletions for optimal active recall studying."}\n\nMistakes Data:\n${JSON.stringify(mistakes.map(sanitizeMistakeForPrompt))}`;

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { 
      response_mime_type: 'application/json',
      response_schema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { front: { type: 'STRING' }, back: { type: 'STRING' }, tags: { type: 'STRING' } }, required: ['front', 'back'] } },
      temperature: 0.2
    }
  };

  for (let i = 0; i < maxRetries; i++) {
    if (parentSignal?.aborted) {
      throw new Error('Flashcard generation cancelled by user.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const abortHandler = () => controller.abort();
    if (parentSignal) {
      parentSignal.addEventListener('abort', abortHandler, { once: true });
    }

    try {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (parentSignal) parentSignal.removeEventListener('abort', abortHandler);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `API error: ${response.statusText}`;
        

        
        throw new Error(errMsg);
      }
      const data = await response.json();
      const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!outputText) throw new Error("No response from Gemini API");
      
      return cleanAndParseJsonCards(outputText);
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (parentSignal) parentSignal.removeEventListener('abort', abortHandler);

      if (e.name === 'AbortError' || parentSignal?.aborted) {
        throw new Error('Flashcard generation timed out or was cancelled. Please check your network connection.');
      }

      if (i === maxRetries - 1) throw e;
      if (e.message && e.message.includes("GEMINI_API_KEY")) throw e;
      await sleep(1000 * Math.pow(2, i));
    }
  }
  return [];
}

export async function generateFlashcardDeck(
  mistakes: any[],
  prompt: string,
  formatType: string,
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<{ cards: Flashcard[], failed: number }> {
  const batchSize = 10;
  const totalCards: Flashcard[] = [];
  let failed = 0;

  for (let i = 0; i < mistakes.length; i += batchSize) {
    if (signal?.aborted) break;
    const batch = mistakes.slice(i, i + batchSize);
    
    try {
      const cards = await generateCardsFromGemini(batch, prompt, 3, signal);
      if (cards && cards.length > 0) {
        totalCards.push(...cards);
      }
    } catch (e: any) {
      console.error("Failed to generate flashcards for batch", e);
      if (signal?.aborted) throw e;
      // If quota or API key error occurs mid-batch, retain cards collected so far
      if (e.message && (e.message.includes("GEMINI_API_KEY") || e.message.includes("API key") || e.message.includes("429") || e.message.includes("RESOURCE_EXHAUSTED"))) {
        if (totalCards.length > 0) {
          console.warn("[Flashcard Batch] API key or quota issue mid-stream. Yielding cards generated so far.");
          return { cards: totalCards, failed: failed + (mistakes.length - i) };
        }
        throw e;
      }
      failed += batch.length;
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, mistakes.length), mistakes.length);
    }
  }

  return { cards: totalCards, failed };
}

export async function generateFlashcardPreview(
  mistake: any, 
  prompt: string, 
  formatType: string,
  signal?: AbortSignal
): Promise<Flashcard | null> {
  try {
    const cards = await generateCardsFromGemini([mistake], prompt, 1, signal);
    if (cards && cards.length > 0) {
      return cards[0];
    }
  } catch (e: any) {
    console.error("Failed to generate flashcard preview", e);
    throw e;
  }
  return null;
}

export function downloadFlashcardTSV(cards: Flashcard[], filename: string = "Atlas_Smart_Deck.txt", customTags: string = "", targetDeck: string = "") {
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
