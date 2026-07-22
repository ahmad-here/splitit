/**
 * Friends (members) domain store. Its own context so members-related updates
 * don't re-render splits/payments consumers (ISP + performance).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Friend } from '@/db/models';
import { friendsRepo } from '@/db/repositories';
import { makeId } from '@/db/storage';

type FriendsValue = {
  friends: Friend[];
  addFriend: (name: string) => Promise<Friend>;
  removeFriend: (id: string) => Promise<void>;
  reset: () => void;
};

const FriendsContext = createContext<FriendsValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    friendsRepo.list().then(setFriends);
  }, []);

  const addFriend = useCallback(async (name: string) => {
    const friend: Friend = { id: makeId('fr'), name: name.trim(), createdAt: new Date().toISOString() };
    setFriends(await friendsRepo.upsert(friend));
    return friend;
  }, []);

  const removeFriend = useCallback(async (id: string) => {
    setFriends(await friendsRepo.remove(id));
  }, []);

  const reset = useCallback(() => setFriends([]), []);

  const value = useMemo<FriendsValue>(
    () => ({ friends, addFriend, removeFriend, reset }),
    [friends, addFriend, removeFriend, reset],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends(): FriendsValue {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within a FriendsProvider');
  return ctx;
}
