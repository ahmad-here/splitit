import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<NonNullable<ButtonProps['variant']>, ViewStyle> = {
    primary: { backgroundColor: theme.primary },
    secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.primary },
    ghost: { backgroundColor: 'transparent' },
  };

  const textColor =
    variant === 'primary' ? 'onPrimary' : ('primary' as const);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        palette[variant],
        fullWidth && styles.fullWidth,
        (pressed || isDisabled) && styles.dimmed,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.onPrimary : theme.primary} />
      ) : (
        <ThemedText type="smallBold" themeColor={textColor} style={styles.label}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  fullWidth: { alignSelf: 'stretch' },
  dimmed: { opacity: 0.6 },
  label: { fontSize: 16 },
});
