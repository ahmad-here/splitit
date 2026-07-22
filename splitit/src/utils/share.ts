/**
 * Format a split into a readable summary and open the native share sheet
 * (WhatsApp, Messages, etc.).
 */

import { Share } from 'react-native';

import { formatAmount } from '@/components/ui/amount-text';
import type { SplitRecord, SplitResult } from '@/db/models';

export function formatSplitMessage(split: SplitResult & Partial<Pick<SplitRecord, 'title'>>): string {
  const lines: string[] = [];
  lines.push(`🧾 ${split.title ?? 'Bill split'} — Splitit`);
  lines.push('');
  for (const p of split.perPerson) {
    lines.push(`• ${p.name}: ${formatAmount(p.amount)}`);
  }
  lines.push('');
  lines.push(`Total: ${formatAmount(split.total)}`);
  if (split.tax) lines.push(`Tax: ${formatAmount(split.tax)}`);
  if (split.tip) lines.push(`Tip: ${formatAmount(split.tip)}`);
  return lines.join('\n');
}

export async function shareSplit(split: SplitResult & Partial<Pick<SplitRecord, 'title'>>): Promise<void> {
  await Share.share({ message: formatSplitMessage(split) });
}
