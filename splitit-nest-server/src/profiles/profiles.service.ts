import { Injectable } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';

export type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  friendCode: string;
  createdAt: string;
};

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const CODE_LENGTH = 6;

/**
 * Owns the `profiles` collection. Idempotently ensures a profile document exists
 * for an authenticated user (creating a unique friend code on first sight), and
 * resolves a friend code back to a profile. Injected by members/splits/chats so
 * profile bootstrap lives in exactly one place (SRP + reuse).
 */
@Injectable()
export class ProfilesService {
  constructor(private readonly firebase: FirebaseService) {}

  private get col() {
    return this.firebase.db.collection('profiles');
  }

  /** Get the profile, creating it from the Firebase Auth record if missing. */
  async ensure(uid: string): Promise<Profile> {
    const ref = this.col.doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data() as Profile;
      // Backfill a friend code for older profiles that predate code generation.
      if (!existing.friendCode) {
        existing.friendCode = await this.uniqueCode();
        await ref.set({ friendCode: existing.friendCode }, { merge: true });
      }
      return existing;
    }

    // Pull name/email from the auth record; app may also update names later.
    let email = '';
    let firstName = '';
    let lastName = '';
    try {
      const user = await this.firebase.auth.getUser(uid);
      email = user.email ?? '';
      const parts = (user.displayName ?? '').trim().split(/\s+/).filter(Boolean);
      firstName = parts[0] ?? '';
      lastName = parts.slice(1).join(' ');
    } catch {
      // no auth record detail — profile still gets created with blanks
    }

    const profile: Profile = {
      id: uid,
      firstName,
      lastName,
      email,
      friendCode: await this.uniqueCode(),
      createdAt: new Date().toISOString(),
    };
    await ref.set(profile, { merge: true });
    return profile;
  }

  /** Overwrite the user's name (used right after signup when the app knows it). */
  async updateName(uid: string, firstName: string, lastName: string): Promise<Profile> {
    const profile = await this.ensure(uid);
    const next = { ...profile, firstName, lastName };
    await this.col.doc(uid).set({ firstName, lastName }, { merge: true });
    return next;
  }

  async byId(uid: string): Promise<Profile | null> {
    const snap = await this.col.doc(uid).get();
    return snap.exists ? (snap.data() as Profile) : null;
  }

  async byCode(code: string): Promise<Profile | null> {
    const q = await this.col.where('friendCode', '==', code.toUpperCase()).limit(1).get();
    return q.empty ? null : (q.docs[0].data() as Profile);
  }

  private async uniqueCode(): Promise<string> {
    // Collisions are astronomically unlikely; still verify a few times.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.randomCode();
      const existing = await this.byCode(code);
      if (!existing) return code;
    }
    return this.randomCode();
  }

  private randomCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return code;
  }
}
