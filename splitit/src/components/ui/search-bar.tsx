import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** When provided, shows a filter/tune icon on the right. */
  onFilterPress?: () => void;
  /** Highlights the filter icon (e.g. non-default filters active). */
  filterActive?: boolean;
};

/** Reusable search input with a leading search icon and optional filter action. */
export function SearchBar({ value, onChangeText, placeholder = 'Search…', onFilterPress, filterActive }: SearchBarProps) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Ionicons name="search" size={18} color={theme.muted} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable hitSlop={8} onPress={() => onChangeText('')} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={theme.muted} />
        </Pressable>
      ) : null}
      {onFilterPress ? (
        <Pressable hitSlop={8} onPress={onFilterPress} accessibilityLabel="Filter and sort" style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={filterActive ? theme.primary : theme.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    height: 46,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  filterBtn: { paddingLeft: Spacing.one },
});
