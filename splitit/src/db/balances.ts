/**
 * Derive running per-person balances from saved splits, Splitwise-style.
 *
 * Convention: the device owner is "Me" (matched case-insensitively). For every
 * split, each other participant's share is money they owe the owner. We sum
 * those shares across all splits to get a running balance per friend/person.
 */

import type { Friend, Payment, SplitRecord } from '@/db/models';

export const OWNER_NAME = 'Me';

export type PersonBalance = {
  name: string;
  /** Positive = this person owes you (you are owed). */
  amount: number;
};

function isOwner(name: string): boolean {
  return name.trim().toLowerCase() === OWNER_NAME.toLowerCase();
}

/** Per-person balances across all splits (excludes the owner). */
export function computeBalances(splits: SplitRecord[]): PersonBalance[] {
  const totals = new Map<string, number>();
  for (const split of splits) {
    for (const p of split.perPerson) {
      if (isOwner(p.name)) continue;
      totals.set(p.name, (totals.get(p.name) ?? 0) + p.amount);
    }
  }
  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

/** Total the owner is owed across everyone. */
export function totalOwed(splits: SplitRecord[]): number {
  return round2(computeBalances(splits).reduce((sum, b) => sum + b.amount, 0));
}

export type BalanceSummary = {
  /** Money others owe the owner (owner paid). */
  owed: number;
  /** Money the owner owes others (someone else paid). */
  owe: number;
  /** Net position: owed - owe. Positive means you are owed overall. */
  net: number;
};

/**
 * Owner-perspective summary across all splits, using each split's payer
 * (defaults to the owner). If the owner paid, everyone else's share is owed to
 * the owner. If someone else paid, the owner's own share is money they owe.
 */
export function balanceSummary(splits: SplitRecord[], payments: Payment[] = []): BalanceSummary {
  let owed = 0;
  let owe = 0;
  for (const split of splits) {
    const payer = split.paidBy ?? OWNER_NAME;
    const payerIsOwner = isOwner(payer);
    for (const p of split.perPerson) {
      if (payerIsOwner) {
        if (!isOwner(p.name)) owed += p.amount;
      } else if (isOwner(p.name)) {
        owe += p.amount;
      }
    }
  }
  // Settlements: received money reduces what you're owed; given money reduces
  // what you owe.
  let received = 0;
  let given = 0;
  for (const p of payments) {
    if ((p.direction ?? 'received') === 'given') given += p.amount;
    else received += p.amount;
  }
  owed = round2(Math.max(0, owed - received));
  owe = round2(Math.max(0, owe - given));
  return { owed, owe, net: round2(owed - owe) };
}

/**
 * Net balance with a specific friend, from the owner's perspective and aware of
 * who paid each bill.
 *   positive → the friend owes you (money you'll take)
 *   negative → you owe the friend (money you'll give)
 * When the owner paid, the friend's share is owed to you. When the friend paid,
 * your own share is money you owe them. Bills paid by a third party don't affect
 * this pairwise balance.
 */
export function balanceForFriend(splits: SplitRecord[], friend: Friend, payments: Payment[] = []): number {
  const friendName = friend.name.trim().toLowerCase();
  let net = 0;
  for (const split of splits) {
    const payer = (split.paidBy ?? OWNER_NAME).trim().toLowerCase();
    if (payer === OWNER_NAME.toLowerCase()) {
      // You paid — the friend's share is owed to you.
      for (const p of split.perPerson) {
        if (p.name.trim().toLowerCase() === friendName) net += p.amount;
      }
    } else if (payer === friendName) {
      // The friend paid — your share is money you owe them.
      for (const p of split.perPerson) {
        if (isOwner(p.name)) net -= p.amount;
      }
    }
  }
  // Settlements adjust the balance by direction:
  //   received (they paid you)  -> reduces what they owe you  (net down)
  //   given    (you paid them)  -> reduces what you owe them  (net up)
  for (const pay of payments) {
    if (pay.friendId !== friend.id) continue;
    if ((pay.direction ?? 'received') === 'given') net += pay.amount;
    else net -= pay.amount;
  }
  return round2(net);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
