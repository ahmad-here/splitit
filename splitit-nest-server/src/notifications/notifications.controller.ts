import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RemindSchema, type Notification, type Remind } from '../core/schema';
import { NotificationsService } from './notifications.service';

@UseGuards(FirebaseAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** My notification feed, newest first. */
  @Get()
  list(@CurrentUser() uid: string): Promise<Notification[]> {
    return this.notifications.list(uid);
  }

  /** Mark one of my notifications as read. */
  @Post(':id/read')
  async markRead(@CurrentUser() uid: string, @Param('id') id: string): Promise<{ ok: true }> {
    await this.notifications.markRead(uid, id);
    return { ok: true };
  }

  /** Remind a friend about pending money (reminder button on a member card). */
  @Post('remind')
  async remind(
    @CurrentUser() uid: string,
    @Body(new ZodValidationPipe(RemindSchema)) body: Remind,
  ): Promise<{ ok: true }> {
    await this.notifications.remind(uid, body.friendId, body.amount, body.note);
    return { ok: true };
  }
}
