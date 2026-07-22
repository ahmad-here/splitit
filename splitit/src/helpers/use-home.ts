/**
 * Home-screen derived data: the balance summary (with a plain-language label)
 * and the recent splits.
 */

import { formatAmount } from '@/components/ui/amount-text';
import { balanceSummary } from '@/db/balances';
import { usePayments } from '@/store/payments-store';
import { useSplits } from '@/store/splits-store';
import { categoryEmoji, relativeDate } from '@/utils/format';

const RECENT_LIMIT = 5;

export type RecentExpense = {
  id: string;
  title: string;
  total: number;
  emoji: string;
  subtitle: string;
};

export function useHome() {
  const { splits } = useSplits();
  const { payments } = usePayments();

  const { owed, owe, net } = balanceSummary(splits, payments);

  const netLabel =
    net > 0 ? 'You are owed more than you owe' : net < 0 ? 'You owe more than you are owed' : "You're all settled up";
  const netText = `${net > 0 ? '+' : net < 0 ? '-' : ''}${formatAmount(Math.abs(net))}`;

  const recent: RecentExpense[] = splits.slice(0, RECENT_LIMIT).map((s) => ({
    id: s.id,
    title: s.title,
    total: s.total,
    emoji: categoryEmoji(s.title),
    subtitle: `${relativeDate(s.createdAt)} • ${s.participants.length} Members`,
  }));

  return { owed, owe, net, netLabel, netText, recent };
}
