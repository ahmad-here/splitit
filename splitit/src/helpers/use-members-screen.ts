/**
 * All Members-screen logic: data wiring, search/sort/filter state, add/delete
 * (with confirmation) and the settle-up flow. The screen consumes this hook and
 * only renders.
 */

import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { balanceForFriend } from '@/db/balances';
import type { Friend } from '@/db/models';
import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  filterAndSortMembers,
  type FilterValue,
  type SortValue,
} from '@/helpers/members-filter';
import { useFriends } from '@/store/friends-store';
import { usePayments } from '@/store/payments-store';
import { useSplits } from '@/store/splits-store';
import { toast } from '@/utils/toast';

export function useMembersScreen() {
  const { friends, addFriend, removeFriend } = useFriends();
  const { splits } = useSplits();
  const { payments, addPayment } = usePayments();

  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortValue>(DEFAULT_SORT);
  const [filter, setFilter] = useState<FilterValue>(DEFAULT_FILTER);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [settleFriend, setSettleFriend] = useState<Friend | null>(null);
  const [received, setReceived] = useState(''); // member paid you back
  const [given, setGiven] = useState(''); // you paid the member

  const balances = useMemo(
    () => new Map(friends.map((f) => [f.id, balanceForFriend(splits, f, payments)])),
    [friends, splits, payments],
  );

  const visible = useMemo(
    () => filterAndSortMembers(friends, balances, { query, filter, sort }),
    [friends, balances, query, filter, sort],
  );

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (friends.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.info('Already added', `${trimmed} is already a member.`);
      setName('');
      return;
    }
    await addFriend(trimmed);
    toast.success('Member added', trimmed);
    setName('');
  }

  function confirmDelete(friend: Friend) {
    Alert.alert('Delete member', `Are you sure you want to delete ${friend.name}? This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeFriend(friend.id);
          toast.success('Member deleted', friend.name);
        },
      },
    ]);
  }

  function openSettle(friend: Friend) {
    setSettleFriend(friend);
    setReceived('');
    setGiven('');
  }

  function closeSettle() {
    setSettleFriend(null);
    setReceived('');
    setGiven('');
  }

  async function saveSettle() {
    if (!settleFriend) return;

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const recAmt = parseFloat(received);
    const givAmt = parseFloat(given);
    const hasReceived = Number.isFinite(recAmt) && recAmt > 0;
    const hasGiven = Number.isFinite(givAmt) && givAmt > 0;

    if (!hasReceived && !hasGiven) {
      toast.error('Enter an amount', 'Fill in received or given.');
      return;
    }

    if (hasReceived) await addPayment(settleFriend.id, round2(recAmt), 'received');
    if (hasGiven) await addPayment(settleFriend.id, round2(givAmt), 'given');

    toast.success('Balance updated', settleFriend.name);
    closeSettle();
  }

  return {
    // data
    friends,
    visible,
    balances,
    // add
    name,
    setName,
    add,
    // search / sort / filter
    query,
    setQuery,
    sort,
    setSort,
    filter,
    setFilter,
    sheetOpen,
    setSheetOpen,
    filtersActive: sort !== DEFAULT_SORT || filter !== DEFAULT_FILTER,
    // delete
    confirmDelete,
    // settle
    settleFriend,
    received,
    setReceived,
    given,
    setGiven,
    openSettle,
    saveSettle,
    closeSettle,
  };
}
