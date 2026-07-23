import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * Provider abstraction. The LangGraph nodes only ever touch `getModel()`, so
 * they stay provider-agnostic. Swapping Gemini -> OpenAI means implementing this
 * interface in a new provider file and flipping the selector in ./index.ts.
 */
export interface LLMProvider {
  readonly name: string;
  /** A chat model capable of multimodal (image) input. */
  getModel(): BaseChatModel;
}
