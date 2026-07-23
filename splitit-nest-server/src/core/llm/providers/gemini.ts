import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

import type { LLMProvider } from '../../llm/types';

/**
 * Default model. gemini-3.5-flash is frequently overloaded (503 / multi-minute
 * hangs) and its extended thinking is wasted on structured extraction, so the
 * lite tier is the default. Override with GEMINI_MODEL.
 */
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

const DEFAULT_MAX_RETRIES = 2;

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Google Gemini provider (active). Requires GEMINI_API_KEY in the environment.
 * The model must be vision-capable to read invoice photos.
 */
export const geminiProvider: LLMProvider = {
  name: 'gemini',
  getModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to splitit-nest-server/.env.local');
    }
    return new ChatGoogleGenerativeAI({
      apiKey,
      model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
      temperature: 0,
      // Reading a receipt and mapping items to people needs no long reasoning
      // chain; LOW keeps latency down. Set GEMINI_THINKING to MEDIUM/HIGH if a
      // future model needs more.
      thinkingConfig: {
        thinkingLevel: (process.env.GEMINI_THINKING ?? 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
      },
      maxRetries: intFromEnv('GEMINI_MAX_RETRIES', DEFAULT_MAX_RETRIES),
    });
  },
};
