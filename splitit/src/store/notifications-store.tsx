/**
 * Notifications domain store. Fetches the signed-in user's feed from the
 * backend and tracks unread count for the header bell. Its own context so the
 * bell badge updates without re-rendering unrelated screens (ISP).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { listNotifications, markNotificationRead, type AppNotification } from '@/api/notifications-client';
import { useAuth } from '@/store/auth-store';

type NotificationsValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, emailVerified } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const active = !!user && emailVerified;

  const refresh = useCallback(async () => {
    if (!active) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      setNotifications(await listNotifications());
    } catch {
      // leave the last-known feed on transient failure
    } finally {
      setLoading(false);
    }
  }, [active]);

  // Load whenever the user becomes active (sign-in / verify).
  useEffect(() => {
    refresh();
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      // optimistic update stays; a later refresh reconciles
    }
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<NotificationsValue>(
    () => ({ notifications, unreadCount, loading, refresh, markRead }),
    [notifications, unreadCount, loading, refresh, markRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
