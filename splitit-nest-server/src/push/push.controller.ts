import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RegisterPushSchema, type RegisterPush } from '../core/schema';
import { PushService } from './push.service';

@UseGuards(FirebaseAuthGuard)
@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  /** Register this device's Expo push token for the signed-in user. */
  @Post('register')
  async register(
    @CurrentUser() uid: string,
    @Body(new ZodValidationPipe(RegisterPushSchema)) body: RegisterPush,
  ): Promise<{ ok: true }> {
    await this.push.register(uid, body.token);
    return { ok: true };
  }
}
