/**
 * Notifications domain store. Fetches the signed-in user's feed from the
 * backend and tracks unread count for the header bell. Its own context so the
 * bell badge updates without re-rendering unrelated screens (ISP).
 */

import { collection, query, where } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  clearNotifications,
  listNotifications,
  markNotificationRead,
  type AppNotification,
} from '@/api/notifications-client';
import { db } from '@/db/firestore';
import { useAuth } from '@/store/auth-store';
import { useRealtimeRefresh } from '@/helpers/use-realtime';

type NotificationsValue = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, emailVerified } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const active = !!user && emailVerified;
  const uid = user?.uid ?? null;

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

  // Live feed: new notifications (split added, reminders) stream in instantly.
  useRealtimeRefresh(
    () => (active && uid ? [query(collection(db, 'notifications'), where('recipientId', '==', uid))] : null),
    refresh,
    [active, uid],
  );

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      // optimistic update stays; a later refresh reconciles
    }
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await clearNotifications();
    } catch {
      // optimistic; a later refresh reconciles if it failed
    }
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<NotificationsValue>(
    () => ({ notifications, unreadCount, loading, refresh, markRead, clearAll }),
    [notifications, unreadCount, loading, refresh, markRead, clearAll],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
