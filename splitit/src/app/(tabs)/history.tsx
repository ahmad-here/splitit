import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AmountText } from '@/components/ui/amount-text';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useHistory } from '@/helpers/use-history';

export default function HistoryScreen() {
  const router = useRouter();
  const { splits, confirmDelete, confirmClearAll } = useHistory();

  const isEmpty = splits.length === 0;

  return (
    <Screen scroll={!isEmpty}>
      <View style={styles.header}>
        <ThemedText type="subtitle">History</ThemedText>
        {!isEmpty ? (
          <ThemedText type="smallBold" themeColor="error" onPress={confirmClearAll}>
            Clear all
          </ThemedText>
        ) : null}
      </View>

      {isEmpty ? (
        <EmptyState fill icon="receipt-outline" title="No splits yet" message="Your saved splits will appear here." actionTitle="Split a bill" onAction={() => router.push('/upload')} />
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Tap to view · long-press to delete
          </ThemedText>
          <Card>
            {splits.map((s) => (
              <ListItem
                key={s.id}
                title={s.title}
                subtitle={`${new Date(s.createdAt).toLocaleDateString()} · ${s.participants.length} people`}
                left={
                  s.invoiceImageUri ? (
                    <Image source={{ uri: s.invoiceImageUri }} style={{ width: 44, height: 44, borderRadius: 8 }} contentFit="cover" />
                  ) : (
                    <ThemedText style={{ fontSize: 28 }}>🧾</ThemedText>
                  )
                }
                right={<AmountText amount={s.total} />}
                onPress={() => router.push(`/split/${s.id}` as Href)}
                onLongPress={() => confirmDelete(s)}
              />
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { marginTop: Spacing.one },
});
