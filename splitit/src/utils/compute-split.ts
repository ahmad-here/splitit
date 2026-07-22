/**
 * Client-side mirror of the backend's deterministic split math (see
 * splitit-server/lib/graph/nodes.ts computeSplit). Used by the Edit screen to
 * recompute per-person amounts after the user reassigns items.
 */

import type { Assignment, LineItem, PerPerson } from '@/db/models';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computePerPerson(
  items: LineItem[],
  assignments: Assignment[],
  participants: string[],
  tax: number,
  tip: number,
): PerPerson[] {
  const priceByItem = new Map(items.map((i) => [i.name, i.price]));
  const subtotals = new Map<string, number>();
  for (const name of participants) subtotals.set(name, 0);

  for (const a of assignments) {
    const price = priceByItem.get(a.item) ?? 0;
    const people = a.people.length ? a.people : participants;
    const share = price / people.length;
    for (const person of people) subtotals.set(person, (subtotals.get(person) ?? 0) + share);
  }

  const itemsSubtotal = [...subtotals.values()].reduce((s, v) => s + v, 0) || 1;
  const extras = tax + tip;

  return participants.map((name) => {
    const base = subtotals.get(name) ?? 0;
    const extraShare = (base / itemsSubtotal) * extras;
    return { name, amount: round2(base + extraShare) };
  });
}
