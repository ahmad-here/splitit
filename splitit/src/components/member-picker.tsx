import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFriends } from '@/store/friends-store';
import { toast } from '@/utils/toast';

export type MemberRef = { id: string; name: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  selected: MemberRef[];
  onChange: (members: MemberRef[]) => void;
};

export function MemberPicker({ visible, onClose, selected, onChange }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { friends, addFriend } = useFriends();
  const [query, setQuery] = useState('');

  const selectedIds = useMemo(() => new Set(selected.map((m) => m.id)), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? friends.filter((f) => f.name.toLowerCase().includes(q)) : friends;
  }, [friends, query]);

  const exactExists = friends.some((f) => f.name.toLowerCase() === query.trim().toLowerCase());

  function toggle(member: MemberRef) {
    if (selectedIds.has(member.id)) onChange(selected.filter((m) => m.id !== member.id));
    else onChange([...selected, member]);
  }

  async function createAndAdd() {
    const name = query.trim();
    if (!name) return;
    const friend = await addFriend(name);
    onChange([...selected, { id: friend.id, name: friend.name }]);
    toast.success('Member added', name);
    setQuery('');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={styles.handleRow}>
            <ThemedText type="smallBold">Add members</ThemedText>
            <Pressable hitSlop={8} onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <TextField placeholder="Search or type a new name…" value={query} onChangeText={setQuery} autoFocus autoCorrect={false} />

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {filtered.map((f) => {
              const on = selectedIds.has(f.id);
              return (
                <Pressable key={f.id} onPress={() => toggle({ id: f.id, name: f.name })} style={styles.row}>
                  <Avatar name={f.name} size={36} />
                  <ThemedText type="smallBold" style={styles.rowName}>
                    {f.name}
                  </ThemedText>
                  <Ionicons
                    name={on ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={on ? theme.primary : theme.muted}
                  />
                </Pressable>
              );
            })}

            {query.trim().length > 0 && !exactExists ? (
              <Pressable onPress={createAndAdd} style={styles.row}>
                <View style={[styles.addIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="add" size={22} color={theme.onPrimary} />
                </View>
                <ThemedText type="smallBold" style={styles.rowName}>
                  Add “{query.trim()}” as a new member
                </ThemedText>
              </Pressable>
            ) : null}

            {filtered.length === 0 && query.trim().length === 0 ? (
              <View style={styles.empty}>
                <EmptyState icon="people-outline" title="No members yet" message="Type a name above to add your first member." />
              </View>
            ) : null}
          </ScrollView>

          <Button title="Done" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.three, gap: Spacing.three, maxHeight: '80%' },
  handleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { maxHeight: 360 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  rowName: { flex: 1 },
  addIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: Spacing.two },
});
