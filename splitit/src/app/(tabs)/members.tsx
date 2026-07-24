import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { MemberCard } from '@/components/member-card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
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

      {/* Add a real member by their code (your own code lives in Settings) */}
      <View style={styles.addRow}>
        <View style={{ flex: 1 }}>
          <TextField
            placeholder="Enter a friend's code…"
            value={m.codeInput}
            onChangeText={m.setCodeInput}
            onSubmitEditing={m.addByCode}
            autoCapitalize="characters"
            returnKeyType="done"
          />
        </View>
        <Button title="Link" fullWidth={false} onPress={m.addByCode} loading={m.redeeming} />
      </View>
      

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

      {isEmpty ? (
        <EmptyState icon="people-outline" title="No members yet" message="Add a friend by their code above to start tracking balances." />
      ) : noResults ? (
        <EmptyState icon="search-outline" title="No members found." />
      ) : (
        m.visible.map((f) => {
          const bal = m.balances.get(f.id) ?? 0;
          return (
            <MemberCard
              key={f.id}
              friend={f}
              balance={bal}
              canRemind={!!f.profileId && bal > 0}
              onSettle={() => m.openSettle(f)}
              onRemind={() => m.remind(f)}
              onDelete={() => m.confirmDelete(f)}
            />
          );
        })
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
