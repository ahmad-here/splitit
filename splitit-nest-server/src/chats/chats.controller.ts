import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import type { ChatSummary, StoredChatMessage } from '../core/schema';
import { ChatStoreService } from './chat-store.service';

/** /api/chats — list past chats and restore a chat's messages. */
@UseGuards(FirebaseAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly store: ChatStoreService) {}

  @Get()
  list(@CurrentUser() uid: string): Promise<ChatSummary[]> {
    return this.store.listChats(uid);
  }

  @Get(':id')
  messages(@CurrentUser() uid: string, @Param('id') id: string): Promise<StoredChatMessage[]> {
    return this.store.getMessages(uid, id);
  }
}
