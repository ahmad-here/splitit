import { Injectable } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';

/**
 * Owns the `userMemory` collection — the durable, cross-chat facts about a user.
 * Storage only; the actual fact extraction lives in core (extractMemory).
 */
@Injectable()
export class MemoryService {
  constructor(private readonly firebase: FirebaseService) {}

  private doc(uid: string) {
    return this.firebase.db.collection('userMemory').doc(uid);
  }

  async getFacts(uid: string): Promise<string[]> {
    const snap = await this.doc(uid).get();
    return snap.exists ? ((snap.data()?.facts as string[]) ?? []) : [];
  }

  async setFacts(uid: string, facts: string[]): Promise<void> {
    await this.doc(uid).set({ facts, updatedAt: new Date().toISOString() }, { merge: true });
  }
}
