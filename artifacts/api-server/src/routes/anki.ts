import { Router, type Request, type Response } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

router.post("/generate-anki", async (req: Request, res: Response): Promise<void> => {
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
    const userPrompt = `
Format Instructions:
${prompt || "Format these as Q&A or cloze deletions for optimal active recall studying."}

Mistakes Data:
${JSON.stringify(mistakes, null, 2)}
`;

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
    res.json({ cards });
  } catch (error: any) {
    req.log.error(error, "Failed to generate Anki cards");
    const status = error?.status === 400 || error?.status === 403 ? error.status : 400;
    res.status(status).json({ error: error.message || "Failed to generate cards" });
  }
});

export default router;
