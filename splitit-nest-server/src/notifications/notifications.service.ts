import { Injectable } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { ProfilesService } from '../profiles/profiles.service';
import { PushService } from '../push/push.service';
import type { Notification, NotificationType } from '../core/schema';

type NotifyInput = {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly push: PushService,
    private readonly profiles: ProfilesService,
  ) {}

  private get col() {
    return this.firebase.db.collection('notifications');
  }

  /**
   * Create a notification row AND deliver a push. The single entry point for
   * every cross-user alert (called by splits fan-out and the reminder route).
   */
  async notify(input: NotifyInput): Promise<void> {
    const doc = {
      recipientId: input.recipientId,
      actorId: input.actorId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
      read: false,
      createdAt: new Date().toISOString(),
    };
    await this.col.add(doc);
    await this.push.sendToUser(input.recipientId, { title: input.title, body: input.body, data: doc.data });
  }

  /**
   * The recipient's notifications, newest first. Sorted in memory (not via
   * orderBy) so no Firestore composite index (recipientId + createdAt) is needed.
   */
  async list(uid: string): Promise<Notification[]> {
    const snap = await this.col.where('recipientId', '==', uid).get();
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Notification, 'id'>) }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 100);
  }

  /** Delete all of the recipient's notifications. */
  async clearAll(uid: string): Promise<void> {
    const snap = await this.col.where('recipientId', '==', uid).get();
    const batch = this.firebase.db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  async markRead(uid: string, id: string): Promise<void> {
    const ref = this.col.doc(id);
    const snap = await ref.get();
    if (snap.exists && snap.data()?.recipientId === uid) {
      await ref.set({ read: true }, { merge: true });
    }
  }

  /** Reminder button: nudge a friend about money they owe the sender. */
  async remind(uid: string, friendId: string, amount?: number, note?: string, currency?: string): Promise<void> {
    const me = await this.profiles.ensure(uid);
    const name = [me.firstName, me.lastName].filter(Boolean).join(' ').trim() || 'A friend';
    const cur = currency && currency !== '$' ? `${currency.trim()} ` : currency ?? '';
    const amountText = typeof amount === 'number' ? ` ${cur}${amount}` : ' some money';
    await this.notify({
      recipientId: friendId,
      actorId: uid,
      type: 'reminder',
      title: 'Payment reminder',
      body: note?.trim() ? note.trim() : `⏰ ${name} is reminding you about${amountText} you still owe.`,
      data: { fromId: uid, amount: amount ?? null },
    });
  }
}
