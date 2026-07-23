import { Body, Controller, Post } from '@nestjs/common';

import { ChatService } from './chat.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ChatRequestSchema } from '../core/schema';
import type { ChatResponse } from '../core/chat/agent';
import type { z } from 'zod';

type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * POST /api/chat — conversational bill splitting.
 * Body: { messages: ChatMessage[], members: ChatMember[] }
 * Returns: { reply, result, title }
 */
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Body(new ZodValidationPipe(ChatRequestSchema)) body: ChatRequest,
  ): Promise<ChatResponse> {
    return this.chatService.chat(body.messages, body.members);
  }
}
