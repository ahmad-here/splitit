/**
 * Client for /api/notifications and /api/push. Requires auth.
 */

import { httpClient } from '@/api/http-client';

export type AppNotification = {
  id: string;
  recipientId: string;
  actorId?: string | null;
  type: 'split_added' | 'reminder';
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export function listNotifications(): Promise<AppNotification[]> {
  return httpClient.getJson<AppNotification[]>('/api/notifications');
}

export function markNotificationRead(id: string): Promise<{ ok: true }> {
  return httpClient.postJson<{ ok: true }>(`/api/notifications/${id}/read`, {});
}

/** Delete all of my notifications. */
export function clearNotifications(): Promise<{ ok: true }> {
  return httpClient.delete<{ ok: true }>('/api/notifications');
}

/** Reminder button on a member card. */
export function remindMember(
  friendId: string,
  amount?: number,
  note?: string,
  currency?: string,
): Promise<{ ok: true }> {
  return httpClient.postJson<{ ok: true }>('/api/notifications/remind', { friendId, amount, note, currency });
}

/** Register this device's Expo push token. */
export function registerPushToken(token: string): Promise<{ ok: true }> {
  return httpClient.postJson<{ ok: true }>('/api/push/register', { token });
}
