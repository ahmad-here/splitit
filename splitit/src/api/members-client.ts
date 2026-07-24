/**
 * Client for /api/members — the signed-in user's friends and friend-code linking.
 * Requires auth; the Authorization header is attached by http-client.
 */

import { httpClient } from '@/api/http-client';

export type Member = {
  profileId: string;
  firstName: string;
  lastName: string;
  name: string;
  friendCode: string;
};

/** My profile + shareable friend code. */
export function getMyProfile(): Promise<Member> {
  return httpClient.getJson<Member>('/api/members/me');
}

/** My linked friends. */
export function listMembers(): Promise<Member[]> {
  return httpClient.getJson<Member[]>('/api/members');
}

/** Add a friend by their code. */
export function redeemCode(code: string): Promise<Member> {
  return httpClient.postJson<Member>('/api/members/redeem', { code });
}

/** Remove a friend (symmetric). */
export function unfriend(profileId: string): Promise<{ ok: true }> {
  return httpClient.delete<{ ok: true }>(`/api/members/${profileId}`);
}
