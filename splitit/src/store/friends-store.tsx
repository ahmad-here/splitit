/**
 * Friends (members) domain store — backed by the backend (/api/members), not
 * local storage. Friends are real linked users added by code; the list is held
 * in memory and refreshed from the server. Its own context so member updates
 * don't re-render splits/payments consumers (ISP).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { listMembers, unfriend as unfriendRemote } from '@/api/members-client';
import type { Friend } from '@/db/models';
import { useAuth } from '@/store/auth-store';

type FriendsValue = {
  friends: Friend[];
  refresh: () => Promise<void>;
  removeFriend: (profileId: string) => Promise<void>;
  reset: () => void;
};

const FriendsContext = createContext<FriendsValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { user, emailVerified } = useAuth();
  const active = !!user && emailVerified;
  const [friends, setFriends] = useState<Friend[]>([]);

  const refresh = useCallback(async () => {
    if (!active) {
      setFriends([]);
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
    }
  }, [active]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
    () => ({ friends, refresh, removeFriend, reset }),
    [friends, refresh, removeFriend, reset],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends(): FriendsValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within a FriendsProvider');
  return ctx;
}
