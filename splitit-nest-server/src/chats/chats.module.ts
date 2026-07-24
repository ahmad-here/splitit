import { Module } from '@nestjs/common';

import { ChatStoreService } from './chat-store.service';
import { ChatsController } from './chats.controller';
import { MemoryService } from './memory.service';

/**
 * Persistence for conversational chats + cross-chat memory. Exports the two
 * stores so the AI chat flow (ChatModule) can inject them.
 */
@Module({
  controllers: [ChatsController],
  providers: [ChatStoreService, MemoryService],
  exports: [ChatStoreService, MemoryService],
})
export class ChatsModule {}
