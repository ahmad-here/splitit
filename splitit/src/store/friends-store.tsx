/**
 * Friends (members) domain store — backed by the backend (/api/members), not
 * local storage. Friends are real linked users added by code; the list is held
 * in memory and refreshed from the server. Its own context so member updates
 * don't re-render splits/payments consumers (ISP).
 */

import { collection } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { listMembers, unfriend as unfriendRemote } from '@/api/members-client';
import { db } from '@/db/firestore';
import type { Friend } from '@/db/models';
import { useAuth } from '@/store/auth-store';
import { useRealtimeRefresh } from '@/helpers/use-realtime';

type FriendsValue = {
  friends: Friend[];
  hydrated: boolean;
  refresh: () => Promise<void>;
  removeFriend: (profileId: string) => Promise<void>;
  reset: () => void;
};

const FriendsContext = createContext<FriendsValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { user, emailVerified } = useAuth();
  const active = !!user && emailVerified;
  const uid = user?.uid ?? null;
  const [friends, setFriends] = useState<Friend[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (!active) {
      setFriends([]);
      setHydrated(true);
      return;
    }
    try {
      const members = await listMembers();
      setFriends(
        members.map((m) => ({
          id: m.profileId,
          name: m.name,
          profileId: m.profileId,
          friendCode: m.friendCode,
          createdAt: '',
        })),
      );
    } catch {
      // keep the last-known list on transient failure
    } finally {
      setHydrated(true);
    }
  }, [active]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live updates: when someone links to me (or a friendship changes), re-pull.
  useRealtimeRefresh(
    () => (active && uid ? [collection(db, 'friendships', uid, 'friends')] : null),
    refresh,
    [active, uid],
  );

  const removeFriend = useCallback(async (profileId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== profileId));
    try {
      await unfriendRemote(profileId);
    } catch {
      // optimistic; a later refresh reconciles
    }
  }, []);

  const reset = useCallback(() => setFriends([]), []);

  const value = useMemo<FriendsValue>(
    () => ({ friends, hydrated, refresh, removeFriend, reset }),
    [friends, hydrated, refresh, removeFriend, reset],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends(): FriendsValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within a FriendsProvider');
  return ctx;
}
