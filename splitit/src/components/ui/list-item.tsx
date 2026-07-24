import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ListItemProps = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function ListItem({ title, subtitle, left, right, onPress, onLongPress }: ListItemProps) {
  const theme = useTheme();
  const body = (
    <View style={[styles.row, { borderColor: theme.border }]}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.center}>
        <ThemedText type="smallBold" numberOfLines={1} ellipsizeMode="tail">
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );

  if (!onPress && !onLongPress) return body;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  left: {},
  center: { flex: 1, gap: 2, minWidth: 0 },
  right: { flexShrink: 0 },
  pressed: { opacity: 0.6 },
});
