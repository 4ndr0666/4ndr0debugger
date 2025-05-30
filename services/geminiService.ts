
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';
// DEFAULT_PROMPT_TEMPLATE and LANGUAGE_TAG_MAP are no longer needed here.

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

// The 'language' parameter is removed as the 'codeToReview' is now the full, pre-formatted prompt.
export const reviewCode = async (codeToReview: string): Promise<string> => {
  if (!ai) {
    return "Error: API Key not configured. Please ensure the API_KEY environment variable is set.";
  }
  // The CodeInput component now ensures that the user's code part is not empty before calling.
  // The codeToReview here is the full template including user's code and instructions.
  // A basic check for overall emptiness might still be useful as a safeguard.
  if (!codeToReview.trim()) { 
    return "Error: Formatted code input for review cannot be empty.";
  }

  // The 'prompt' is now directly the 'codeToReview' argument.
  // No more template replacement needed in this service.

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: codeToReview, // This is the full prompt including instructions and user code
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, 
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error reviewing code with Gemini:", error);
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("permission denied")) {
        return `Error: API Key is invalid or has insufficient permissions. Details: ${error.message}`;
      }
      return `Error during API call: ${error.message}`;
    }
    return "An unknown error occurred while reviewing the code.";
  }
};
