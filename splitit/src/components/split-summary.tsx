import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AmountText } from '@/components/ui/amount-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import type { SplitResult } from '@/db/models';
import { useTheme } from '@/hooks/use-theme';

export function SplitSummary({ result }: { result: SplitResult }) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {result.needsReview ? (
        <View style={[styles.banner, { backgroundColor: theme.warning + '22', borderColor: theme.warning }]}>
          <ThemedText type="small" style={{ color: theme.warning }}>
            ⚠️ We couldn&apos;t fully reconcile the total with the receipt. Please review the amounts.
          </ThemedText>
        </View>
      ) : null}

      <SectionHeader title="Who owes what" />
      <Card>
        {result.perPerson.map((p, i) => (
          <View key={p.name} style={[styles.personRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <Avatar name={p.name} size={32} />
            <ThemedText type="smallBold" style={styles.personName}>
              {p.name}
            </ThemedText>
            <AmountText amount={p.amount} />
          </View>
        ))}
      </Card>

      <SectionHeader title="Items" />
      <Card>
        {result.items.map((item, i) => (
          <View key={`${item.name}-${i}`} style={[styles.itemRow, i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <ThemedText type="small" style={styles.itemName}>
              {item.qty > 1 ? `${item.qty}× ` : ''}
              {item.name}
            </ThemedText>
            <AmountText amount={item.price} type="small" />
          </View>
        ))}
      </Card>

      <Card style={styles.totals}>
        <Row label="Subtotal" amount={result.subtotal} />
        <Row label="Tax" amount={result.tax} />
        <Row label="Tip" amount={result.tip} />
        <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
          <ThemedText type="smallBold">Total</ThemedText>
          <AmountText amount={result.total} type="smallBold" />
        </View>
      </Card>
    </View>
  );
}

function Row({ label, amount }: { label: string; amount: number }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <AmountText amount={amount} type="small" themeColor="textSecondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one },
  banner: { padding: Spacing.three, borderRadius: 12, borderWidth: 1, marginBottom: Spacing.two },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  personName: { flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  itemName: { flex: 1, marginRight: Spacing.three },
  totals: { marginTop: Spacing.two, gap: Spacing.one },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two, marginTop: Spacing.one },
});
