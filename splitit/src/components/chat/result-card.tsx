import { StyleSheet, View } from 'react-native';

import { SplitSummary } from '@/components/split-summary';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import type { SplitResult } from '@/db/models';

type Props = {
  result: SplitResult;
  title: string;
  /** Current payer, selected at the screen level. */
  paidBy: string;
  onSave: () => void;
  onEdit: () => void;
  onShare: () => void;
  saved?: boolean;
};

/** Inline split card shown inside an assistant message bubble. */
export function ResultCard({ result, title, paidBy, onSave, onEdit, onShare, saved }: Props) {
  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <SplitSummary result={result} />

      <ThemedText type="small" themeColor="textSecondary" style={styles.paidLine}>
        Paid by <ThemedText type="smallBold" themeColor="primary">{paidBy}</ThemedText>
      </ThemedText>

      {saved ? (
        <ThemedText type="smallBold" themeColor="primary" style={styles.savedNote}>
          ✓ Saved to history
        </ThemedText>
      ) : (
        <View style={styles.actions}>
          <Button title="Save split" onPress={onSave} />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button title="Edit" variant="secondary" onPress={onEdit} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Share" variant="secondary" onPress={onShare} />
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two, marginTop: Spacing.two },
  paidLine: { marginTop: Spacing.two },
  actions: { marginTop: Spacing.two, gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
  savedNote: { marginTop: Spacing.two },
});
