import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({});
const prompt = "Please respond with JSON";
ai.models.generateContent({
  model: 'gemini-flash-latest',
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    responseSchema: { type: Type.OBJECT, properties: { strategicInsights: { type: Type.ARRAY, items: { type: Type.STRING } } } }
  }
}).then(res => console.log("Success:", res.text)).catch(e => console.error("Error:", e));
