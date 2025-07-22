
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

export const generateContent = async (prompt: string, systemInstruction: string): Promise<string> => {
  if (!ai) {
    return "Error: API Key not configured. Please ensure the API_KEY environment variable is set.";
  }
  if (!prompt.trim()) { 
    return "Error: Formatted prompt for generation cannot be empty.";
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, 
      }
    });
    return response.text ?? "";
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("permission denied")) {
        return `Error: API Key is invalid or has insufficient permissions. Details: ${error.message}`;
      }
      return `Error during API call: ${error.message}`;
    }
    return "An unknown error occurred while generating content.";
  }
};
