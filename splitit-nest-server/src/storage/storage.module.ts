import { Global, Module } from '@nestjs/common';

import { StorageService } from './storage.service';

/** Global so chat + splits services can inject StorageService. */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
