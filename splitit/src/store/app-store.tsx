/**
 * Composes the per-domain stores into one provider and exposes the single
 * cross-domain operation (wipe everything). Domain data is read via the focused
 * hooks — useFriends / useSplits / usePayments (ISP).
 */

import { useCallback } from 'react';

import { clearAllData as clearAllStorage } from '@/db/repositories';
import { FriendsProvider, useFriends } from '@/store/friends-store';
import { PaymentsProvider, usePayments } from '@/store/payments-store';
import { SplitsProvider, useSplits } from '@/store/splits-store';

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <FriendsProvider>
      <SplitsProvider>
        <PaymentsProvider>{children}</PaymentsProvider>
      </SplitsProvider>
    </FriendsProvider>
  );
}

/** Wipe all local data and reset every domain store in memory. */
export function useClearAllData(): () => Promise<void> {
  const { reset: resetFriends } = useFriends();
  const { reset: resetSplits } = useSplits();
  const { reset: resetPayments } = usePayments();

  return useCallback(async () => {
    await clearAllStorage();
    resetFriends();
    resetSplits();
    resetPayments();
  }, [resetFriends, resetSplits, resetPayments]);
}
