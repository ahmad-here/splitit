import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AmountText, formatAmount } from '@/components/ui/amount-text';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { useHome } from '@/helpers/use-home';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { owed, owe, netLabel, netText, recent } = useHome();

  return (
    <Screen>
      {/* Total balance card */}
      <Card style={[styles.hero, { backgroundColor: theme.primary }]}>
        <View style={styles.heroTop}>
          <ThemedText style={styles.heroEmoji}>💰</ThemedText>
          <ThemedText type="small" style={styles.heroLabel}>
            Total Balance
          </ThemedText>
        </View>
        <ThemedText type="title" style={styles.heroAmount}>
          {netText}
        </ThemedText>
        <ThemedText type="small" style={styles.heroSubtitle}>
          {netLabel}
        </ThemedText>

        <View style={styles.heroDivider} />

        <View style={styles.heroCols}>
          <View style={styles.heroCol}>
            <ThemedText type="small" style={styles.heroColLabel}>
              You Owe
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroColAmount}>
              {formatAmount(owe)}
            </ThemedText>
          </View>
          <View style={styles.heroColSep} />
          <View style={styles.heroCol}>
            <ThemedText type="small" style={styles.heroColLabel}>
              You Are Owed
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroColAmount}>
              {formatAmount(owed)}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* Recent expenses */}
      <SectionHeader
        title="Recent Expenses"
        action={recent.length ? <ThemedText type="small" themeColor="primary" onPress={() => router.push('/(tabs)/history')}>See all</ThemedText> : undefined}
      />
      {recent.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No expenses yet" message="Tap the ＋ button to upload an invoice and split it." actionTitle="Split a bill" onAction={() => router.push('/upload')} />
      ) : (
        <Card>
          {recent.map((s) => (
            <ListItem
              key={s.id}
              title={s.title}
              subtitle={s.subtitle}
              left={<ThemedText style={styles.expenseEmoji}>{s.emoji}</ThemedText>}
              right={<AmountText amount={s.total} />}
              onPress={() => router.push(`/split/${s.id}` as Href)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.three },
  brand: { fontSize: 18 },
  hero: { gap: Spacing.one, paddingVertical: Spacing.four, marginTop: Spacing.four },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroEmoji: { fontSize: 18 },
  heroLabel: { color: '#ffffffcc' },
  heroAmount: { color: '#ffffff', fontSize: 40, lineHeight: 46 },
  heroSubtitle: { color: '#ffffffcc' },
  heroDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#ffffff55', marginVertical: Spacing.three },
  heroCols: { flexDirection: 'row', alignItems: 'center' },
  heroCol: { flex: 1, gap: 2 },
  heroColSep: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: '#ffffff55', marginHorizontal: Spacing.three },
  heroColLabel: { color: '#ffffffcc' },
  heroColAmount: { color: '#ffffff', fontSize: 22, lineHeight: 28 },
  expenseEmoji: { fontSize: 26 },
});
