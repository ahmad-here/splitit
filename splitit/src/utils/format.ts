import { env } from '@/config/env';

/** Display currency symbol/prefix (from EXPO_PUBLIC_CURRENCY, default "Rs "). */
export const CURRENCY = env.currency;

/** Relative day label: Today / Yesterday / weekday (last week) / date. */
export function relativeDate(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return then.toLocaleDateString(undefined, { weekday: 'long' });
  return then.toLocaleDateString();
}

/** Pick a category emoji from an expense title (best-effort keyword match). */
export function categoryEmoji(title: string): string {
  const t = title.toLowerCase();
  const rules: [RegExp, string][] = [
    [/coffee|cafe|tea|starbucks/, '☕'],
    [/grocery|groceries|mart|store|supermarket/, '🛒'],
    [/kfc|burger|pizza|dinner|lunch|restaurant|food|meal|eat/, '🍔'],
    [/uber|ride|taxi|fuel|gas|petrol|travel|flight|bus/, '🚗'],
    [/movie|cinema|game|fun|party/, '🎉'],
    [/rent|bill|utility|electric|water|internet/, '🧾'],
  ];
  for (const [re, emoji] of rules) if (re.test(t)) return emoji;
  return '🧾';
}
