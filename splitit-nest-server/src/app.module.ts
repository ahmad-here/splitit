import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { LlmModule } from './llm/llm.module';
import { SplitModule } from './split/split.module';

@Module({
  imports: [
    // Loads .env.local then .env before any provider reads process.env.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    LlmModule,
    SplitModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}
