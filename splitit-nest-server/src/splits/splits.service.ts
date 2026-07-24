import { ForbiddenException, Injectable } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProfilesService } from '../profiles/profiles.service';
import { StorageService } from '../storage/storage.service';
import type { SaveSplit, SplitParticipant } from '../core/schema';

@Injectable()
export class SplitsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly notifications: NotificationsService,
    private readonly profiles: ProfilesService,
    private readonly storage: StorageService,
  ) {}

  private get col() {
    return this.firebase.db.collection('splits');
  }

  /**
   * Persist a split for the owner, then notify every linked participant (a real
   * friend, not an ad-hoc name, and not the owner) that they were added to a
   * bill. This is the single place the cross-user "money added" rule lives.
   */
  async save(uid: string, input: SaveSplit): Promise<{ id: string; invoiceImageUrl?: string }> {
    const owner = await this.profiles.ensure(uid);

    // Offload the receipt photo to Storage; keep only the URL on the doc.
    const invoiceImageUrl = await this.storage.uploadDataUrl(uid, input.invoiceImage).catch(() => undefined);

    // Build participant rows, linking names to friend profileIds where provided.
    const participants: SplitParticipant[] = input.perPerson.map((p) => ({
      name: p.name,
      amount: p.amount,
      profileId: input.participantLinks[p.name] ?? null,
    }));
    const participantIds = participants
      .map((p) => p.profileId)
      .filter((id): id is string => !!id && id !== uid);

    const doc = {
      ownerId: uid,
      title: input.title,
      description: input.description ?? null,
      currency: input.currency,
      paidBy: input.paidBy ?? null,
      subtotal: input.subtotal,
      tax: input.tax,
      tip: input.tip,
      total: input.total,
      needsReview: input.needsReview,
      items: input.items,
      assignments: input.assignments,
      participants,
      participantIds,
      invoiceImageUrl: invoiceImageUrl ?? null,
      createdAt: new Date().toISOString(),
    };

    const ref = input.id ? this.col.doc(input.id) : this.col.doc();
    await ref.set(doc, { merge: true });

    // Fan out notifications (best-effort; never blocks the save).
    const ownerName = [owner.firstName, owner.lastName].filter(Boolean).join(' ') || 'Someone';
    await Promise.all(
      participants
        .filter((p) => p.profileId && p.profileId !== uid)
        .map((p) =>
          this.notifications.notify({
            recipientId: p.profileId as string,
            actorId: uid,
            type: 'split_added',
            title: 'Added to a split',
            body: `${ownerName} added you to "${input.title || 'a bill'}" — your share is ${p.amount}.`,
            data: { splitId: ref.id, amount: p.amount },
          }),
        ),
    );

    return { id: ref.id, invoiceImageUrl };
  }

  /**
   * List the splits the user owns or is a linked participant in, newest first.
   * Shaped to the app's SplitRecord (perPerson + participant names), so the
   * store can drop it straight in with no local persistence.
   */
  async list(uid: string): Promise<AppSplitRecord[]> {
    const [owned, shared] = await Promise.all([
      this.col.where('ownerId', '==', uid).get(),
      this.col.where('participantIds', 'array-contains', uid).get(),
    ]);

    const byId = new Map<string, AppSplitRecord>();
    for (const d of [...owned.docs, ...shared.docs]) {
      if (byId.has(d.id)) continue;
      byId.set(d.id, toAppRecord(d.id, d.data()));
    }
    return [...byId.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  /** Delete a split the user owns. */
  async remove(uid: string, id: string): Promise<void> {
    const ref = this.col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return;
    if (snap.data()?.ownerId !== uid) throw new ForbiddenException('Not your split.');
    await ref.delete();
  }
}

/** The app-facing split record shape (mirror of splitit/src/db/models SplitRecord). */
export type AppSplitRecord = {
  id: string;
  title: string;
  description?: string;
  items: unknown[];
  assignments: unknown[];
  perPerson: { name: string; amount: number }[];
  participants: string[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  needsReview: boolean;
  paidBy?: string;
  invoiceImageUri?: string;
  createdAt: string;
};

function toAppRecord(id: string, data: FirebaseFirestore.DocumentData): AppSplitRecord {
  const participants = (data.participants ?? []) as { name: string; amount: number }[];
  return {
    id,
    title: String(data.title ?? ''),
    description: data.description ?? undefined,
    items: data.items ?? [],
    assignments: data.assignments ?? [],
    perPerson: participants.map((p) => ({ name: p.name, amount: p.amount })),
    participants: participants.map((p) => p.name),
    subtotal: Number(data.subtotal ?? 0),
    tax: Number(data.tax ?? 0),
    tip: Number(data.tip ?? 0),
    total: Number(data.total ?? 0),
    needsReview: Boolean(data.needsReview),
    paidBy: data.paidBy ?? undefined,
    invoiceImageUri: data.invoiceImageUrl ?? undefined,
    createdAt: String(data.createdAt ?? ''),
  };
}
