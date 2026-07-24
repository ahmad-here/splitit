import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatAmount } from '@/components/ui/amount-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import type { Friend } from '@/db/models';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  friend: Friend;
  balance: number;
  /** Show the reminder action (linked friend who owes you). */
  canRemind: boolean;
  onSettle: () => void;
  onRemind: () => void;
  onDelete: () => void;
};

/**
 * A member row card: avatar + name, a plain-language balance label, the amount,
 * a delete action (top-right), and round settle/remind actions (bottom-right).
 */
export function MemberCard({ friend, balance, canRemind, onSettle, onRemind, onDelete }: Props) {
  const theme = useTheme();
  const label = balance > 0 ? 'Owes you' : balance < 0 ? 'You owe' : 'Settled up';
  const amountColor = balance > 0 ? theme.owed : balance < 0 ? theme.owe : theme.muted;

  return (
    <Card style={styles.card}>
      <Avatar name={friend.name} size={44} />

      <View style={styles.center}>
        <ThemedText type="smallBold" numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
          {friend.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold" style={[styles.amount, { color: amountColor }]}>
          {balance === 0 ? '—' : formatAmount(Math.abs(balance))}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable hitSlop={8} onPress={onDelete} accessibilityLabel={`Delete ${friend.name}`}>
          <Ionicons name="trash-outline" size={18} color={theme.muted} />
        </Pressable>

        <View style={styles.actionRow}>
          <Pressable
            onPress={onSettle}
            accessibilityLabel={`Record a payment with ${friend.name}`}
            style={[styles.circle, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="add" size={20} color={theme.onPrimary} />
          </Pressable>
          {canRemind ? (
            <Pressable
              onPress={onRemind}
              accessibilityLabel={`Remind ${friend.name}`}
              style={[styles.circle, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="notifications" size={18} color={theme.onPrimary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.two },
  center: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 17, lineHeight: 22 },
  amount: { fontSize: 18, lineHeight: 24, marginTop: 2 },
  actions: { alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'flex-end', gap: Spacing.three },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
  circle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
