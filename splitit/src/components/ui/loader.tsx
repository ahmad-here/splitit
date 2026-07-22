import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Loader({ label }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.primary} size="large" />
      {label ? (
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: Spacing.five, gap: Spacing.three },
});
