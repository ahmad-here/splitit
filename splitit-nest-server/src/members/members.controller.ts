import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RedeemCodeSchema, type Member, type RedeemCode } from '../core/schema';
import { MembersService } from './members.service';

/**
 * /api/members — the signed-in user's friends and friend-code linking.
 * All routes require a valid Firebase ID token (FirebaseAuthGuard).
 */
@UseGuards(FirebaseAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  /** My profile + shareable friend code. */
  @Get('me')
  me(@CurrentUser() uid: string): Promise<Member> {
    return this.members.me(uid);
  }

  /** My linked friends. */
  @Get()
  list(@CurrentUser() uid: string): Promise<Member[]> {
    return this.members.listFriends(uid);
  }

  /** Add a friend by their code. */
  @Post('redeem')
  redeem(
    @CurrentUser() uid: string,
    @Body(new ZodValidationPipe(RedeemCodeSchema)) body: RedeemCode,
  ): Promise<Member> {
    return this.members.redeem(uid, body.code);
  }

  /** Remove a friend (symmetric). */
  @Delete(':friendId')
  async unfriend(@CurrentUser() uid: string, @Param('friendId') friendId: string): Promise<{ ok: true }> {
    await this.members.unfriend(uid, friendId);
    return { ok: true };
  }
}
