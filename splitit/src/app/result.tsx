import { StyleSheet, View } from 'react-native';

import { SplitSummary } from '@/components/split-summary';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useResult } from '@/helpers/use-result';

export default function ResultScreen() {
  const { draft, saving, save, edit, share } = useResult();

  if (!draft) {
    return (
      <Screen>
        <ThemedText type="small" themeColor="textSecondary">
          No split to show. Start from &ldquo;Split a bill&rdquo;.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <SplitSummary result={draft.result} />

      <View style={styles.actions}>
        <Button title="Save split" onPress={save} loading={saving} />
        <View style={styles.secondaryRow}>
          <View style={{ flex: 1 }}>
            <Button title="Edit" variant="secondary" onPress={edit} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Share" variant="secondary" onPress={share} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { marginTop: Spacing.four, gap: Spacing.two },
  secondaryRow: { flexDirection: 'row', gap: Spacing.two },
});
