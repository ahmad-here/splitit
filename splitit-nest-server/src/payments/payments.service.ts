import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { ProfilesService } from '../profiles/profiles.service';
import type { CreatePayment, Payment } from '../core/schema';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly profiles: ProfilesService,
  ) {}

  private get col() {
    return this.firebase.db.collection('payments');
  }

  /** The owner's settlements, newest first (sorted in memory — no index needed). */
  async list(uid: string): Promise<Payment[]> {
    await this.profiles.ensure(uid);
    const snap = await this.col.where('ownerId', '==', uid).get();
    return snap.docs
      .map((d) => {
        const x = d.data();
        return {
          id: d.id,
          friendId: String(x.friendId ?? ''),
          amount: Number(x.amount ?? 0),
          direction: x.direction === 'given' ? 'given' : 'received',
          note: x.note ?? undefined,
          createdAt: String(x.createdAt ?? ''),
        } as Payment;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async create(uid: string, input: CreatePayment): Promise<Payment> {
    await this.profiles.ensure(uid);
    const payment = {
      ownerId: uid,
      friendId: input.friendId,
      amount: input.amount,
      direction: input.direction,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
    };
    const ref = await this.col.add(payment);
    return {
      id: ref.id,
      friendId: payment.friendId,
      amount: payment.amount,
      direction: payment.direction,
      note: input.note,
      createdAt: payment.createdAt,
    };
  }

  async remove(uid: string, id: string): Promise<void> {
    const ref = this.col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Payment not found.');
    if (snap.data()?.ownerId !== uid) throw new ForbiddenException('Not your payment.');
    await ref.delete();
  }
}
