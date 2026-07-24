import { Global, Module } from '@nestjs/common';

import { ProfilesService } from './profiles.service';

/** Global: members, splits, and chats all need profile bootstrap. */
@Global()
@Module({
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
