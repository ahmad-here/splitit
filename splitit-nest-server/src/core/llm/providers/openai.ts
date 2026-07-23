import type { LLMProvider } from '../../llm/types';

/**
 * OpenAI provider — STUB / TEMPLATE for the future swap.
 *
 * To activate OpenAI as the LLM:
 *   1. npm install @langchain/openai
 *   2. Uncomment the implementation below.
 *   3. Set LLM_PROVIDER=openai and OPENAI_API_KEY in .env.local
 *
 * No other file needs to change — the LangGraph nodes only depend on getModel().
 */

// import { ChatOpenAI } from '@langchain/openai';

export const openaiProvider: LLMProvider = {
  name: 'openai',
  getModel() {
    throw new Error(
      'OpenAI provider is not enabled. Install @langchain/openai and implement lib/llm/providers/openai.ts.',
    );

    // const apiKey = process.env.OPENAI_API_KEY;
    // if (!apiKey) throw new Error('OPENAI_API_KEY is not set.');
    // return new ChatOpenAI({
    //   apiKey,
    //   model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    //   temperature: 0,
    // });
  },
};
