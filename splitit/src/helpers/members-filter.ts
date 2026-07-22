/**
 * Pure search / sort / filter logic for the Members list. Kept out of the screen
 * so the UI just renders. Reusable and unit-testable.
 */

import type { Option } from '@/components/ui/option-sheet';
import type { Friend } from '@/db/models';

export type SortValue = 'name_asc' | 'name_desc' | 'recent' | 'bal_high' | 'bal_low';
export type FilterValue = 'all' | 'owe_me' | 'i_owe' | 'zero';

export const SORT_OPTIONS: Option[] = [
  { label: 'Name (A–Z)', value: 'name_asc' },
  { label: 'Name (Z–A)', value: 'name_desc' },
  { label: 'Recently Added', value: 'recent' },
  { label: 'Balance (High → Low)', value: 'bal_high' },
  { label: 'Balance (Low → High)', value: 'bal_low' },
];

export const FILTER_OPTIONS: Option[] = [
  { label: 'All Members', value: 'all' },
  { label: 'Members Who Owe Me', value: 'owe_me' },
  { label: 'Members I Owe', value: 'i_owe' },
  { label: 'Zero Balance', value: 'zero' },
];

export const DEFAULT_SORT: SortValue = 'name_asc';
export const DEFAULT_FILTER: FilterValue = 'all';

export function filterAndSortMembers(
  friends: Friend[],
  balances: Map<string, number>,
  opts: { query: string; filter: FilterValue; sort: SortValue },
): Friend[] {
  const q = opts.query.trim().toLowerCase();
  const searched = q ? friends.filter((f) => f.name.toLowerCase().includes(q)) : friends;

  const filtered = searched.filter((f) => {
    const b = balances.get(f.id) ?? 0;
    switch (opts.filter) {
      case 'owe_me':
        return b > 0;
      case 'i_owe':
        return b < 0;
      case 'zero':
        return b === 0;
      default:
        return true;
    }
  });

  return [...filtered].sort((a, b) => {
    const ba = balances.get(a.id) ?? 0;
    const bb = balances.get(b.id) ?? 0;
    switch (opts.sort) {
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'recent':
        return b.createdAt.localeCompare(a.createdAt);
      case 'bal_high':
        return bb - ba;
      case 'bal_low':
        return ba - bb;
      default:
        return a.name.localeCompare(b.name);
    }
  });
}
