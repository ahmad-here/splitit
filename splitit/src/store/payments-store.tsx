/**
 * Payments (settle-ups) domain store — backed by the backend (/api/payments),
 * not local storage. Held in memory and refreshed from the server.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createPaymentRemote, listPaymentsRemote } from '@/api/payments-client';
import type { Payment, PaymentDirection } from '@/db/models';
import { useAuth } from '@/store/auth-store';

type PaymentsValue = {
  payments: Payment[];
  hydrated: boolean;
  addPayment: (friendId: string, amount: number, direction: PaymentDirection, note?: string) => Promise<Payment>;
  refresh: () => Promise<void>;
  reset: () => void;
};

const PaymentsContext = createContext<PaymentsValue | undefined>(undefined);

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const { user, emailVerified } = useAuth();
  const active = !!user && emailVerified;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (!active) {
      setPayments([]);
      setHydrated(true);
      return;
    }
    try {
      setPayments(await listPaymentsRemote());
    } catch {
      // keep last-known on transient failure
    } finally {
      setHydrated(true);
    }
  }, [active]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPayment = useCallback(
    async (friendId: string, amount: number, direction: PaymentDirection, note?: string) => {
      const payment = await createPaymentRemote({ friendId, amount, direction, note });
      setPayments((prev) => [payment, ...prev]);
      return payment;
    },
    [],
  );

  const reset = useCallback(() => setPayments([]), []);

  const value = useMemo<PaymentsValue>(
    () => ({ payments, hydrated, addPayment, refresh, reset }),
    [payments, hydrated, addPayment, refresh, reset],
  );

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments(): PaymentsValue {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error('usePayments must be used within a PaymentsProvider');
  return ctx;
}
