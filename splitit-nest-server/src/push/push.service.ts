import { Injectable, Logger } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
};

/**
 * Stores each user's Expo push tokens and delivers notifications through the
 * Expo push service (works with the Firebase JS SDK app + expo-notifications).
 * Kept separate from NotificationsService so the transport can be swapped
 * (e.g. to raw FCM) without touching notification business logic.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly firebase: FirebaseService) {}

  private tokensDoc(uid: string) {
    return this.firebase.db.collection('pushTokens').doc(uid);
  }

  /** Add a device's Expo token to the user (deduplicated). */
  async register(uid: string, token: string): Promise<void> {
    const snap = await this.tokensDoc(uid).get();
    const existing: string[] = snap.exists ? ((snap.data()?.tokens as string[]) ?? []) : [];
    if (existing.includes(token)) return;
    await this.tokensDoc(uid).set({ tokens: [...existing, token] }, { merge: true });
  }

  /** Send a push to every device registered for a user. Best-effort. */
  async sendToUser(uid: string, message: { title: string; body: string; data?: Record<string, unknown> }): Promise<void> {
    const snap = await this.tokensDoc(uid).get();
    const tokens: string[] = snap.exists ? ((snap.data()?.tokens as string[]) ?? []) : [];
    if (tokens.length === 0) return;

    const payload: ExpoMessage[] = tokens.map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: message.data,
      sound: 'default',
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) this.logger.warn(`Expo push responded ${res.status}`);
    } catch (err) {
      // Never let a push failure break the originating request.
      this.logger.warn(`Push send failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
