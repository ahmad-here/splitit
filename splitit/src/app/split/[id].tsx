import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SplitSummary } from '@/components/split-summary';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useSplitDetail } from '@/helpers/use-split-detail';

export default function SplitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { split, share, confirmDelete } = useSplitDetail(id);

  if (!split) {
    return (
      <Screen>
        <ThemedText type="small" themeColor="textSecondary">
          Split not found.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="subtitle">{split.title}</ThemedText>
      {split.invoiceImageUri ? <Image source={{ uri: split.invoiceImageUri }} style={styles.invoice} contentFit="cover" /> : null}

      <SplitSummary result={split} />

      <View style={styles.actions}>
        <Button title="Share" onPress={share} />
        <Button title="Delete" variant="secondary" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  invoice: { width: '100%', height: 180, borderRadius: 16, marginBottom: Spacing.two },
  actions: { marginTop: Spacing.four, gap: Spacing.two },
});
