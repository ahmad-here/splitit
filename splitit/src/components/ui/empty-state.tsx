import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type EmptyStateProps = {
  icon?: IoniconName;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
  /** Fill available height and center vertically (for whole-screen empties). */
  fill?: boolean;
};

export function EmptyState({ icon = 'receipt-outline', title, message, actionTitle, onAction, fill }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, fill && styles.fill]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primary + '1A' }]}>
        <Ionicons name={icon} size={38} color={theme.primary} />
      </View>
      <ThemedText type="smallBold" style={styles.title}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
      {actionTitle && onAction ? (
        <View style={styles.action}>
          <Button title={actionTitle} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: Spacing.five, gap: Spacing.two },
  fill: { flex: 1 },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 16 },
  message: { textAlign: 'center', maxWidth: 260 },
  action: { marginTop: Spacing.three },
});
