/**
 * Composes the per-domain stores into one provider. Domain data is read via the
 * focused hooks — useFriends / useSplits / usePayments / useNotifications (ISP).
 * All domains are backed by the backend (no local database).
 */

import { FriendsProvider } from '@/store/friends-store';
import { NotificationsProvider } from '@/store/notifications-store';
import { PaymentsProvider } from '@/store/payments-store';
import { SplitsProvider } from '@/store/splits-store';

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <FriendsProvider>
      <SplitsProvider>
        <PaymentsProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </PaymentsProvider>
      </SplitsProvider>
    </FriendsProvider>
  );
}
