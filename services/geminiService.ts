
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION, DEFAULT_PROMPT_TEMPLATE, LANGUAGE_TAG_MAP } from '../constants';
import { SupportedLanguage } from "../types";

// IMPORTANT: This relies on process.env.API_KEY being available in the execution environment.
// In a standard browser SPA, this needs to be injected via build tools (e.g., Vite's import.meta.env.VITE_API_KEY)
// or be globally defined (e.g. by a script in index.html: <script>window.process = { env: { API_KEY: "YOUR_KEY" } }</script>).
// For this exercise, we assume `process.env.API_KEY` is accessible as per the problem statement.
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

export const reviewCode = async (code: string, language: SupportedLanguage): Promise<string> => {
  if (!ai) {
    return "Error: API Key not configured. Please ensure the API_KEY environment variable is set.";
  }
  if (!code.trim()) {
    return "Error: Code input cannot be empty.";
  }

  const languageTag = LANGUAGE_TAG_MAP[language] || '';

  const prompt = DEFAULT_PROMPT_TEMPLATE
    .replace('{language}', language)
    .replace('{language_tag}', languageTag)
    .replace('{code}', code);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Lower temperature for more deterministic and factual reviews
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error reviewing code with Gemini:", error);
    if (error instanceof Error) {
      // Check for common API key related errors (this is a guess, actual error messages might vary)
      if (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("permission denied")) {
        return `Error: API Key is invalid or has insufficient permissions. Details: ${error.message}`;
      }
      return `Error during API call: ${error.message}`;
    }
    return "An unknown error occurred while reviewing the code.";
  }
};
    