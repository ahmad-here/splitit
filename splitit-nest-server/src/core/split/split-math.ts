/**
 * Single source of truth for how a bill splits (SRP). The LLM only extracts and
 * assigns items; this pure module does ALL the arithmetic. Both the LangGraph
 * node (lib/graph/nodes.ts) and the chat agent (lib/chat/agent.ts) import it, and
 * the app mirrors it in src/utils/compute-split.ts.
 */

import type { Assignment, LineItem, PerPerson } from '../schema';

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export type SplitMathInput = {
  items: LineItem[];
  assignments: Assignment[];
  participants: string[];
  tax: number;
  tip: number;
};

/**
 * Per-person amounts: each person's item subtotal plus a share of tax + tip
 * distributed in proportion to their subtotal. Items assigned to nobody fall
 * back to being split among all participants.
 */
export function computePerPerson({ items, assignments, participants, tax, tip }: SplitMathInput): PerPerson[] {
  const priceByItem = new Map<string, number>(items.map((i) => [i.name, i.price]));
  const subtotals = new Map<string, number>();
  for (const name of participants) subtotals.set(name, 0);

  for (const a of assignments) {
    const price = priceByItem.get(a.item) ?? 0;
    const people = a.people.length ? a.people : participants;
    const share = price / people.length;
    for (const person of people) subtotals.set(person, (subtotals.get(person) ?? 0) + share);
  }

  const itemsSubtotal = [...subtotals.values()].reduce((sum, v) => sum + v, 0) || 1;
  const extras = tax + tip;

  return participants.map((name) => {
    const base = subtotals.get(name) ?? 0;
    const extraShare = (base / itemsSubtotal) * extras;
    return { name, amount: round2(base + extraShare) };
  });
}

/** Sum of per-person amounts (used to reconcile against a receipt total). */
export function sumPerPerson(perPerson: PerPerson[]): number {
  return round2(perPerson.reduce((sum, p) => sum + p.amount, 0));
}
