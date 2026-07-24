import { readFileSync } from 'node:fs';
import { Injectable } from '@nestjs/common';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

/**
 * Wraps the Firebase Admin SDK (service-account credentials). Admin access
 * bypasses Firestore security rules, so it is used ONLY on the server for
 * cross-user writes (e.g. notifying a friend about a new split) and for
 * verifying client ID tokens. Never expose the service account to the app.
 *
 * Credentials (either one):
 *   - FIREBASE_SERVICE_ACCOUNT_PATH — path to the downloaded service-account
 *     JSON file (recommended; avoids escaping a 1700-char key in .env).
 *   - FIREBASE_SERVICE_ACCOUNT — the same JSON as a single-line string.
 *
 * Initialised lazily on first use, so the server still boots and the AI
 * endpoints keep working when Firebase is not yet configured.
 */
@Injectable()
export class FirebaseService {
  private app: App | null = null;

  private get instance(): App {
    if (this.app) return this.app;
    if (getApps().length) {
      this.app = getApps()[0];
      return this.app;
    }

    const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT;

    let raw: string;
    if (filePath) {
      try {
        raw = readFileSync(filePath, 'utf8');
      } catch {
        throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH points to an unreadable file: ${filePath}`);
      }
    } else if (inline) {
      raw = inline;
    } else {
      throw new Error(
        'Set FIREBASE_SERVICE_ACCOUNT_PATH (path to the JSON file) or FIREBASE_SERVICE_ACCOUNT ' +
          '(single-line JSON) in splitit-nest-server/.env.local.',
      );
    }

    let parsed: { project_id?: string; client_email?: string; private_key?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Firebase service account is not valid JSON.');
    }
    // Private keys copied into .env often have literal "\n" — normalise them.
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');

    this.app = initializeApp({ credential: cert(parsed as never) });
    return this.app;
  }

  get auth(): Auth {
    return getAuth(this.instance);
  }

  get db(): Firestore {
    return getFirestore(this.instance);
  }

  get messaging(): Messaging {
    return getMessaging(this.instance);
  }

  /** Verify a client Firebase ID token and return the uid, or null if invalid. */
  async getUserId(idToken: string): Promise<string | null> {
    try {
      const decoded = await this.auth.verifyIdToken(idToken);
      return decoded.uid;
    } catch {
      return null;
    }
  }
}
