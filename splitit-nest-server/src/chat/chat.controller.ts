import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ChatRequestSchema, type ChatRequest } from '../core/schema';
import { FirebaseService } from '../firebase/firebase.service';
import { ChatService, type ChatResult } from './chat.service';

/**
 * POST /api/chat — conversational bill splitting.
 * Optional auth: a valid `Authorization: Bearer <firebase-id-token>` unlocks
 * cross-chat memory and persistence; without it the endpoint stays stateless
 * (backward-compatible with the pre-accounts app).
 */
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly firebase: FirebaseService,
  ) {}

  @Post()
  async chat(
    @Req() req: Request,
    @Body(new ZodValidationPipe(ChatRequestSchema)) body: ChatRequest,
  ): Promise<ChatResult> {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const uid = token ? ((await this.firebase.getUserId(token)) ?? undefined) : undefined;

    return this.chatService.chat(body.messages, body.members, { uid, chatId: body.chatId });
  }
}
