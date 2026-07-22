import { geminiProvider } from '@/lib/llm/providers/gemini';
import { openaiProvider } from '@/lib/llm/providers/openai';
import type { LLMProvider } from '@/lib/llm/types';

/**
 * THE swap point. Selects the active LLM provider from the LLM_PROVIDER env var
 * (default: gemini). Adding a provider = one entry here + one provider file.
 */
const providers: Record<string, LLMProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
};

export function getProvider(): LLMProvider {
  const key = (process.env.LLM_PROVIDER ?? 'gemini').toLowerCase();
  const provider = providers[key];
  if (!provider) {
    throw new Error(`Unknown LLM_PROVIDER "${key}". Available: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}

export type { LLMProvider };
