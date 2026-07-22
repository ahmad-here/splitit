import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = ScrollViewProps & {
  scroll?: boolean;
  /** Add top inset (for tab screens without a stack header). */
  topInset?: boolean;
};

export function Screen({ children, scroll = true, topInset = false, contentContainerStyle, style, ...rest }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const padTop = topInset ? insets.top + Spacing.three : Spacing.three;

  if (scroll) {
    return (
      <ScrollView
        style={[{ backgroundColor: theme.background }, style]}
        contentContainerStyle={[styles.content, { paddingTop: padTop, paddingBottom: insets.bottom + Spacing.five }, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.content, { backgroundColor: theme.background, paddingTop: padTop, flex: 1 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },
});
