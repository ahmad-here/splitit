import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { ProfilesService, type Profile } from '../profiles/profiles.service';
import type { Member } from '../core/schema';

/** Maps a stored profile to the app-facing Member shape. */
function toMember(p: Profile): Member {
  return {
    profileId: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    name: [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || 'Member',
    friendCode: p.friendCode,
  };
}

@Injectable()
export class MembersService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly profiles: ProfilesService,
  ) {}

  private friendsCol(uid: string) {
    return this.firebase.db.collection('friendships').doc(uid).collection('friends');
  }

  /** The signed-in user's own profile (+ shareable friend code). */
  async me(uid: string): Promise<Member> {
    return toMember(await this.profiles.ensure(uid));
  }

  /** The user's linked friends, resolved to Member records. */
  async listFriends(uid: string): Promise<Member[]> {
    await this.profiles.ensure(uid);
    const snap = await this.friendsCol(uid).get();
    const ids = snap.docs.map((d) => d.id);
    const profiles = await Promise.all(ids.map((id) => this.profiles.byId(id)));
    return profiles.filter((p): p is Profile => p !== null).map(toMember);
  }

  /**
   * Redeem a friend code: link both users symmetrically. Returns the newly
   * added friend. Idempotent — re-redeeming the same code is a no-op link.
   */
  async redeem(uid: string, code: string): Promise<Member> {
    await this.profiles.ensure(uid);
    const other = await this.profiles.byCode(code.trim().toUpperCase());
    if (!other) throw new NotFoundException('No member found for that code.');
    if (other.id === uid) throw new BadRequestException('That is your own code.');

    const now = new Date().toISOString();
    const batch = this.firebase.db.batch();
    batch.set(this.friendsCol(uid).doc(other.id), { status: 'active', createdAt: now }, { merge: true });
    batch.set(this.friendsCol(other.id).doc(uid), { status: 'active', createdAt: now }, { merge: true });
    await batch.commit();

    return toMember(other);
  }

  /** Remove a friendship symmetrically (both directions). */
  async unfriend(uid: string, friendId: string): Promise<void> {
    const batch = this.firebase.db.batch();
    batch.delete(this.friendsCol(uid).doc(friendId));
    batch.delete(this.friendsCol(friendId).doc(uid));
    await batch.commit();
  }
}
