import { BadRequestException, Injectable } from '@nestjs/common';

import { runChat, type ChatResponse } from '../core/chat/agent';
import type { ChatMember, ChatMessage } from '../core/schema';

@Injectable()
export class ChatService {
  async chat(messages: ChatMessage[], members: ChatMember[]): Promise<ChatResponse> {
    if (messages.length === 0) throw new BadRequestException('No messages provided.');
    return runChat(messages, members);
  }
}
