import { Global, Module } from '@nestjs/common';

import { FirebaseService } from './firebase.service';

/** Global so any feature module can inject FirebaseService. Mirrors LlmModule. */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
