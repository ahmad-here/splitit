import { Module } from '@nestjs/common';

import { ChatsModule } from '../chats/chats.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  // ChatsModule provides MemoryService + ChatStoreService for memory/persistence.
  imports: [ChatsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
