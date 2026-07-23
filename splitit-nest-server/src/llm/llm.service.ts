import { Injectable } from '@nestjs/common';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { getProvider } from '../core/llm';

/**
 * Injectable wrapper over the env-driven provider selector (src/core/llm).
 * Feature services depend on this, so swapping Gemini -> OpenAI stays a one-file
 * change in core/llm and can later be overridden via DI in tests.
 */
@Injectable()
export class LlmService {
  get providerName(): string {
    return getProvider().name;
  }

  getModel(): BaseChatModel {
    return getProvider().getModel();
  }
}
