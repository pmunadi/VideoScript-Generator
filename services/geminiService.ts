
import { GoogleGenAI, Type } from "@google/genai";
import { ScriptScene } from "../types";

export const generateVideoScript = async (
  userName: string,
  fileBase64: string,
  mimeType: string
): Promise<ScriptScene[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const langName = 'Bahasa Indonesia';
  const greeting = userName 
    ? `Halo, saya ${userName}. Pada video ini saya akan menjelaskan materi penting berdasarkan dokumen yang Anda pelajari.` 
    : `Halo. Pada video ini saya akan menjelaskan materi penting berdasarkan dokumen yang Anda pelajari.`;

  const systemInstruction = `
    Act as a professor who has mastered the material from the uploaded document.
    Your task is to convert the contents of the document into an educational video script with a duration of about 5 to 6 minutes.
    
    Output Requirements:
    1. Language: ${langName}.
    2. Tone: Communicative, academic, and fluid.
    3. Format: JSON Array containing objects with keys: "scene", "narasi", "kalimatKunci", "visual".
    
    Content Guidelines:
    - Divide the material into several logical scenes.
    - Opening: Use the phrase: "${greeting}"
    - Narasi: Written for voice over, clear, easy to understand, aligned with key sentences.
    - Kalimat Kunci: Extract MULTIPLE important points (at least 2-3 points per scene if the narration is long) from the narration to be used as visual highlights. Make each sentence VERY CONCISE (short and solid) without reducing the essence of the information. Return in the form of a string ARRAY.
    - Visual: English prompt for AI image generator (Educational illustration, professional layout).
    - Closing: Contains a conclusion and a call to action (CTA) to watch other videos.
    
    IMPORTANT: Do not use decorative icons or symbols in the narration. Focus on educational quality.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType
            }
          },
          {
            text: `Generate a full video script in ${langName} based on this document with multiple concise key sentences per scene.`
          }
        ]
      }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.STRING },
            narasi: { type: Type.STRING },
            kalimatKunci: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of concise key points from the narration."
            },
            visual: { type: Type.STRING }
          },
          required: ["scene", "narasi", "kalimatKunci", "visual"]
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Gagal menerima respons dari AI.");
  
  return JSON.parse(text) as ScriptScene[];
};
