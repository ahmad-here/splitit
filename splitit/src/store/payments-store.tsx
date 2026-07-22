/**
 * Payments (repayments / settle-ups) domain store.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Payment, PaymentDirection } from '@/db/models';
import { paymentsRepo } from '@/db/repositories';
import { makeId } from '@/db/storage';

type PaymentsValue = {
  payments: Payment[];
  addPayment: (friendId: string, amount: number, direction: PaymentDirection, note?: string) => Promise<Payment>;
  reset: () => void;
};

const PaymentsContext = createContext<PaymentsValue | undefined>(undefined);

export function PaymentsProvider({ children }: { children: React.ReactNode }) {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    paymentsRepo.list().then(setPayments);
  }, []);

  const addPayment = useCallback(
    async (friendId: string, amount: number, direction: PaymentDirection, note?: string) => {
      const payment: Payment = {
        id: makeId('pm'),
        friendId,
        amount,
        direction,
        note,
        createdAt: new Date().toISOString(),
      };
      setPayments(await paymentsRepo.upsert(payment));
      return payment;
    },
    [],
  );

  const reset = useCallback(() => setPayments([]), []);

  const value = useMemo<PaymentsValue>(() => ({ payments, addPayment, reset }), [payments, addPayment, reset]);

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
}

export function usePayments(): PaymentsValue {
  const ctx = useContext(PaymentsContext);
  if (!ctx) throw new Error('usePayments must be used within a PaymentsProvider');
  return ctx;
}
