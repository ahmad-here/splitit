import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { LlmModule } from './llm/llm.module';
import { SplitModule } from './split/split.module';
import { FirebaseModule } from './firebase/firebase.module';
import { StorageModule } from './storage/storage.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PushModule } from './push/push.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MembersModule } from './members/members.module';
import { SplitsModule } from './splits/splits.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    // Loads .env.local then .env before any provider reads process.env.
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    // Infrastructure (global): available to every feature module.
    FirebaseModule,
    StorageModule,
    ProfilesModule,
    PushModule,
    NotificationsModule,
    LlmModule,
    // AI endpoints (existing).
    SplitModule,
    ChatModule,
    HealthModule,
    // Multi-user features (v2).
    MembersModule,
    SplitsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
