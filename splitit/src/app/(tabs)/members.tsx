import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatAmount } from '@/components/ui/amount-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { OptionSheet } from '@/components/ui/option-sheet';
import { Screen } from '@/components/ui/screen';
import { SearchBar } from '@/components/ui/search-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { FILTER_OPTIONS, SORT_OPTIONS, type FilterValue, type SortValue } from '@/helpers/members-filter';
import { useMembersScreen } from '@/helpers/use-members-screen';
import { useTheme } from '@/hooks/use-theme';

export default function MembersScreen() {
  const theme = useTheme();
  const m = useMembersScreen();

  const isEmpty = m.friends.length === 0;
  const noResults = !isEmpty && m.visible.length === 0;

  return (
    <Screen scroll={!isEmpty}>
      <ThemedText type="subtitle">Members</ThemedText>

      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <TextField placeholder="Member name…" value={m.name} onChangeText={m.setName} onSubmitEditing={m.add} returnKeyType="done" />
        </View>
        <Button title="Add" fullWidth={false} onPress={m.add} />
      </View>

      {isEmpty ? (
        <EmptyState fill icon="people-outline" title="No members yet" message="Add people you split bills with to track balances." />
      ) : (
        <>
          <View style={styles.searchRow}>
            <SearchBar
              value={m.query}
              onChangeText={m.setQuery}
              placeholder="Search members..."
              onFilterPress={() => m.setSheetOpen(true)}
              filterActive={m.filtersActive}
            />
          </View>

          <SectionHeader title={`Your people (${m.friends.length})`} />

          {noResults ? (
            <EmptyState icon="search-outline" title="No members found." />
          ) : (
            <Card>
              {m.visible.map((f) => {
                const bal = m.balances.get(f.id) ?? 0;
                const label = bal > 0 ? 'owes you' : bal < 0 ? 'you owe' : 'settled up';
                const color = bal > 0 ? theme.owed : bal < 0 ? theme.owe : theme.muted;
                return (
                  <ListItem
                    key={f.id}
                    title={f.name}
                    subtitle={label}
                    left={<Avatar name={f.name} size={36} />}
                    right={
                      <View style={styles.right}>
                        <ThemedText type="smallBold" style={{ color }}>
                          {bal === 0 ? '—' : formatAmount(Math.abs(bal))}
                        </ThemedText>
                        <Pressable
                          hitSlop={8}
                          onPress={() => m.openSettle(f)}
                          accessibilityLabel={`Record a payment from ${f.name}`}
                          style={[styles.settleBtn, { borderColor: theme.primary }]}
                        >
                          <Ionicons name="add" size={18} color={theme.primary} />
                        </Pressable>
                        <Pressable hitSlop={8} onPress={() => m.confirmDelete(f)} accessibilityLabel={`Delete ${f.name}`}>
                          <Ionicons name="trash-outline" size={18} color={theme.muted} />
                        </Pressable>
                      </View>
                    }
                  />
                );
              })}
            </Card>
          )}
        </>
      )}

      <OptionSheet
        visible={m.sheetOpen}
        onClose={() => m.setSheetOpen(false)}
        title="Sort & Filter"
        groups={[
          { title: 'Sort By', options: SORT_OPTIONS, value: m.sort, onSelect: (v) => m.setSort(v as SortValue) },
          { title: 'Filter', options: FILTER_OPTIONS, value: m.filter, onSelect: (v) => m.setFilter(v as FilterValue) },
        ]}
      />

      <Modal visible={m.settleFriend !== null} transparent animationType="fade" onRequestClose={m.closeSettle}>
        <Pressable style={styles.dialogBackdrop} onPress={m.closeSettle}>
          <Pressable style={[styles.dialog, { backgroundColor: theme.background }]} onPress={(e) => e.stopPropagation()}>
            <ThemedText type="smallBold">Update balance with {m.settleFriend?.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Record money manually. Enter what you received, gave, or both.
            </ThemedText>

            <View style={styles.settleField}>
              <TextField
                label="You received  (they paid you back)"
                value={m.received}
                onChangeText={m.setReceived}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <ThemedText type="small" themeColor="textSecondary">
                Lowers what {m.settleFriend?.name} owes you.
              </ThemedText>
            </View>

            <View style={styles.settleField}>
              <TextField
                label="You gave  (you paid them)"
                value={m.given}
                onChangeText={m.setGiven}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <ThemedText type="small" themeColor="textSecondary">
                Lowers what you owe {m.settleFriend?.name}.
              </ThemedText>
            </View>

            <View style={styles.dialogActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="secondary" onPress={m.closeSettle} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Save" onPress={m.saveSettle} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start', marginTop: Spacing.two },
  searchRow: { marginTop: Spacing.two },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  settleBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dialogBackdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', padding: Spacing.four },
  dialog: { borderRadius: 18, padding: Spacing.four, gap: Spacing.three },
  settleField: { gap: Spacing.one },
  dialogActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
});
