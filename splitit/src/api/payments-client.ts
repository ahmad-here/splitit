/**
 * Client for /api/payments — the signed-in user's settle-ups. Requires auth.
 */

import { httpClient } from '@/api/http-client';
import type { Payment, PaymentDirection } from '@/db/models';

export function listPaymentsRemote(): Promise<Payment[]> {
  return httpClient.getJson<Payment[]>('/api/payments');
}

export function createPaymentRemote(input: {
  friendId: string;
  amount: number;
  direction: PaymentDirection;
  note?: string;
}): Promise<Payment> {
  return httpClient.postJson<Payment>('/api/payments', input);
}

export function deletePaymentRemote(id: string): Promise<{ ok: true }> {
  return httpClient.delete<{ ok: true }>(`/api/payments/${id}`);
}
