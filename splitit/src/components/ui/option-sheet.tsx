import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type Option = { label: string; value: string };

export type OptionGroup = {
  title: string;
  options: Option[];
  /** Currently selected value in this group. */
  value: string;
  onSelect: (value: string) => void;
};

export type OptionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  groups: OptionGroup[];
};

/**
 * Reusable single-select sheet for sort/filter style choices. Pass any number
 * of labelled groups; each behaves like a radio group.
 */
export function OptionSheet({ visible, onClose, title = 'Sort & Filter', groups }: OptionSheetProps) {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.title}>
            <SectionHeader title={group.title} />
            {group.options.map((opt) => {
              const selected = opt.value === group.value;
              return (
                <Pressable key={opt.value} style={styles.row} onPress={() => group.onSelect(opt.value)}>
                  <ThemedText type="small" style={{ color: selected ? theme.primary : theme.text }}>
                    {opt.label}
                  </ThemedText>
                  <Ionicons
                    name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={selected ? theme.primary : theme.muted}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three },
});
