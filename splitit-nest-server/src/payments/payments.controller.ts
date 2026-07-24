import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreatePaymentSchema, type CreatePayment, type Payment } from '../core/schema';
import { PaymentsService } from './payments.service';

/** /api/payments — the owner's settle-ups. */
@UseGuards(FirebaseAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@CurrentUser() uid: string): Promise<Payment[]> {
    return this.payments.list(uid);
  }

  @Post()
  create(
    @CurrentUser() uid: string,
    @Body(new ZodValidationPipe(CreatePaymentSchema)) body: CreatePayment,
  ): Promise<Payment> {
    return this.payments.create(uid, body);
  }

  @Delete(':id')
  async remove(@CurrentUser() uid: string, @Param('id') id: string): Promise<{ ok: true }> {
    await this.payments.remove(uid, id);
    return { ok: true };
  }
}
