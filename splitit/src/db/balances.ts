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
 * A participant's effective identity: their linked profileId, or — for the "Me"
 * entry (no profileId) — the split's owner. Lets us reason about who is who from
 * ANY viewer's perspective (in a shared split, "Me" is the creator, not you).
 */
function participantId(split: SplitRecord, p: SplitRecord['perPerson'][number], meId: string): string | null {
  if (p.profileId) return p.profileId;
  if (isOwner(p.name)) return split.ownerId ?? meId;
  return null;
}

/** Who paid, resolved to an id: the server's paidById, else the owner. */
function payerId(split: SplitRecord, meId: string): string | null {
  if (split.paidById) return split.paidById;
  if (split.ownerId) {
    const pb = (split.paidBy ?? '').trim();
    if (!pb || isOwner(pb)) return split.ownerId;
    const match = split.perPerson.find((p) => p.name.trim().toLowerCase() === pb.toLowerCase());
    return match?.profileId ?? split.ownerId;
  }
  // Fully legacy split (no owner recorded): treat "Me" as the viewer.
  return isOwner(split.paidBy ?? OWNER_NAME) ? meId : null;
}

/**
 * Viewer-perspective summary across all splits, keyed on the current user's id
 * (`meId`) and each split's resolved payer — correct even for splits someone
 * else created and shared with you. If you paid, everyone else's share is owed
 * to you; if someone else paid, your share is money you owe.
 */
export function balanceSummary(splits: SplitRecord[], payments: Payment[] = [], meId = ''): BalanceSummary {
  let owed = 0;
  let owe = 0;
  for (const split of splits) {
    const payer = payerId(split, meId);
    for (const p of split.perPerson) {
      const pid = participantId(split, p, meId);
      if (payer === meId) {
        if (pid && pid !== meId) owed += p.amount; // others owe you
      } else if (pid === meId) {
        owe += p.amount; // the payer covered your share
      }
    }
  }
  // Settlements: received money reduces what you're owed; given reduces what you owe.
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
export function balanceForFriend(
  splits: SplitRecord[],
  friend: Friend,
  payments: Payment[] = [],
  meId = '',
): number {
  const friendId = friend.profileId ?? friend.id;
  let net = 0;
  for (const split of splits) {
    const payer = payerId(split, meId);
    let myShare = 0;
    let friendShare = 0;
    for (const p of split.perPerson) {
      const pid = participantId(split, p, meId);
      if (pid === meId) myShare += p.amount;
      else if (pid === friendId) friendShare += p.amount;
    }
    if (payer === meId) net += friendShare; // you paid → friend owes you
    else if (payer === friendId) net -= myShare; // friend paid → you owe them
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
