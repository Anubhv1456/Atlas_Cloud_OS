import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-gemini-api-key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const apiKey = (req.headers['x-gemini-api-key'] as string) || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      res.status(400).json({ error: "GEMINI_API_KEY environment variable is missing. Please add it to your project settings." });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const { mistakes, prompt, formatType } = req.body;

    if (!mistakes || !Array.isArray(mistakes)) {
      res.status(400).json({ error: "Invalid payload: 'mistakes' array is required." });
      return;
    }

    const systemInstruction = `You are an elite medical educator creating Anki flashcards. You must output strictly valid JSON containing an array of objects with 'front' and 'back' keys. You must wrap medical keywords in HTML <b> tags.`;
    const userPrompt = `Format Instructions:\n${prompt || "Format these as Q&A or cloze deletions for optimal active recall studying."}\nMistakes Data:\n${JSON.stringify(mistakes, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          description: "An array of generated Anki flashcards",
          items: {
            type: "OBJECT",
            properties: {
              front: {
                type: "STRING",
                description: "The front of the Anki card (the question, prompt, or cloze deletion with <b> tags for emphasis)."
              },
              back: {
                type: "STRING",
                description: "The back of the Anki card (the answer, explanation, clinical insight, with <b> tags)."
              },
            },
            required: ["front", "back"]
          }
        },
        temperature: 0.2
      }
    });

    const outputText = response.text;
    if (!outputText) {
       res.status(500).json({ error: "No response from Gemini API" });
       return;
    }

    const cards = JSON.parse(outputText);
    res.status(200).json({ cards });
  } catch (error: any) {
    console.error("Failed to generate Anki cards", error);
    const status = error?.status === 400 || error?.status === 403 ? error.status : 400;
    res.status(status).json({ error: error.message || "Failed to generate cards" });
  }
}
