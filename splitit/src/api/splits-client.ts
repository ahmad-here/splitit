/**
 * Client for /api/splits — persist a computed split to the backend so linked
 * participants are notified. (The AI extraction endpoint stays /api/split.)
 * Requires auth.
 */

import { httpClient } from '@/api/http-client';
import type { SplitRecord, SplitResult } from '@/db/models';

export type SaveSplitInput = SplitResult & {
  id?: string;
  title: string;
  description?: string;
  currency?: string;
  paidBy?: string;
  /** Map of participant name -> linked friend profileId (for notifications). */
  participantLinks?: Record<string, string>;
  /** Receipt photo as a data URL; the server offloads it to Storage. */
  invoiceImage?: string;
};

export type SaveSplitResult = { id: string; invoiceImageUrl?: string };

export function saveSplitRemote(input: SaveSplitInput): Promise<SaveSplitResult> {
  return httpClient.postJson<SaveSplitResult>('/api/splits', input);
}

/** List the signed-in user's split history (owned or participating). */
export function listSplitsRemote(): Promise<SplitRecord[]> {
  return httpClient.getJson<SplitRecord[]>('/api/splits');
}

/** Delete one of the user's splits. */
export function deleteSplitRemote(id: string): Promise<{ ok: true }> {
  return httpClient.delete<{ ok: true }>(`/api/splits/${id}`);
}
