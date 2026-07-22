import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

import type { LLMProvider } from '@/lib/llm/types';

/**
 * Google Gemini provider (active). Requires GEMINI_API_KEY in the environment.
 * The model must be vision-capable to read invoice photos.
 */
export const geminiProvider: LLMProvider = {
  name: 'gemini',
  getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to splitit-server/.env.local');
    }
    return new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash',
      temperature: 0,
    });
  },
};
