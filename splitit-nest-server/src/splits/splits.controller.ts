import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SaveSplitSchema, type SaveSplit } from '../core/schema';
import { SplitsService, type AppSplitRecord } from './splits.service';

/**
 * /api/splits — persist a computed split and fan out notifications to linked
 * participants. (The AI extraction endpoint remains /api/split, singular.)
 */
@UseGuards(FirebaseAuthGuard)
@Controller('splits')
export class SplitsController {
  constructor(private readonly splits: SplitsService) {}

  /** My split history (owned or participating), newest first. */
  @Get()
  list(@CurrentUser() uid: string): Promise<AppSplitRecord[]> {
    return this.splits.list(uid);
  }

  @Post()
  save(
    @CurrentUser() uid: string,
    @Body(new ZodValidationPipe(SaveSplitSchema)) body: SaveSplit,
  ): Promise<{ id: string; invoiceImageUrl?: string }> {
    return this.splits.save(uid, body);
  }

  @Delete(':id')
  async remove(@CurrentUser() uid: string, @Param('id') id: string): Promise<{ ok: true }> {
    await this.splits.remove(uid, id);
    return { ok: true };
  }
}
