import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODELS } from './constants.ts';
import { ProjectFile } from './types.ts';

class GeminiService {
  private ai: GoogleGenAI | null;

  constructor() {
    this.ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;
  }

  isConfigured(): boolean {
    return this.ai !== null;
  }
  
  getAiClient(): GoogleGenAI | null {
    return this.ai;
  }

  buildPromptWithProjectFiles(mainPrompt: string, projectFiles: ProjectFile[], options: { textOnly?: boolean } = {}): string | { parts: any[] } {
    if (projectFiles.length === 0) {
      return mainPrompt;
    }

    let combinedText = `The user has provided the following project files for context. Use them to inform your response.\n\n`;
    const imageParts: { inlineData: { mimeType: string; data: string; } }[] = [];

    projectFiles.forEach(file => {
      if (file.mimeType.startsWith('image/') && !options.textOnly) {
        imageParts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.content, // content is base64 for images
          },
        });
        combinedText += `- Image file attached: ${file.name}\n`;
      } else if (!file.mimeType.startsWith('image/')) {
        combinedText += `--- PROJECT FILE: ${file.name} ---\n\`\`\`\n${file.content}\n\`\`\`\n--- END OF FILE: ${file.name} ---\n\n`;
      }
    });

    combinedText += `\n---\n\nHere is the user's primary request:\n\n${mainPrompt}`;

    if (imageParts.length === 0) {
      return combinedText;
    }

    const parts = [{ text: combinedText }, ...imageParts];
    return { parts };
  }

  async streamRequest(
    { contents, systemInstruction, model, abortSignal, onChunk, tools }: 
    { 
        contents: string | { parts: any[] }; 
        systemInstruction: string; 
        model: string; 
        abortSignal: AbortSignal; 
        onChunk: (chunkText: string) => void;
        tools?: any[];
    }
  ): Promise<string> {
    if (!this.ai) {
      throw new Error("API Key not configured.");
    }
    
    const config: any = {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 8192,
    };
    
    if (tools) {
        config.tools = tools;
    }

    const responseStream = await this.ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: config,
    });

    let fullResponse = "";
    let groundingUrls: Set<string> = new Set();

    for await (const chunk of responseStream) {
      if (abortSignal.aborted) {
        console.log("Stream aborted by user.");
        throw new Error("STREAM_ABORTED");
      }
      const chunkText = chunk.text;
      if (chunkText) {
          fullResponse += chunkText;
          onChunk(chunkText);
      }
      
      // Extract grounding metadata to provide sources
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          chunk.candidates[0].groundingMetadata.groundingChunks.forEach((c: any) => {
              if (c.web?.uri) {
                  groundingUrls.add(c.web.uri);
              }
          });
      }
    }
    
    // Append unique sources to the end of the response if found
    if (groundingUrls.size > 0) {
        const sourcesHeader = "\n\n### Sources\n";
        const sourcesList = Array.from(groundingUrls).map(url => `- ${url}`).join('\n');
        const sourcesText = sourcesHeader + sourcesList;
        fullResponse += sourcesText;
        onChunk(sourcesText);
    }

    return fullResponse;
  }
  
  async generateJson(
    { contents, systemInstruction, model, schema }:
    { contents: string | { parts: any[] }; systemInstruction: string; model: string; schema: any }
  ): Promise<any> {
    if (!this.ai) {
      throw new Error("API Key not configured.");
    }
    
    const response = await this.ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });
    
    const rawJson = response.text;
    return JSON.parse(rawJson);
  }

  async generateText(
    { contents, systemInstruction, model }:
    { contents: string | { parts: any[] }; systemInstruction: string; model: string; }
  ): Promise<string> {
    if (!this.ai) {
        throw new Error("API Key not configured.");
    }
    
    const response = await this.ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        }
    });

    return response.text;
  }
}

// Export a singleton instance of the service
export const geminiService = new GeminiService();