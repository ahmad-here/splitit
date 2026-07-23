import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { SplitController } from './split.controller';
import { SplitService } from './split.service';

@Module({
  // Memory storage: the image is turned straight into a base64 data URL.
  imports: [MulterModule.register({ limits: { fileSize: 25 * 1024 * 1024 } })],
  controllers: [SplitController],
  providers: [SplitService],
})
export class SplitModule {}
