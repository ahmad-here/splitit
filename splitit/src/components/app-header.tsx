import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NotificationsDrawer } from '@/components/notifications-drawer';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useNotifications } from '@/store/notifications-store';
import { useTheme } from '@/hooks/use-theme';

/**
 * App-wide top bar: stylish app name (left) · notification bell with unread
 * badge (right) that opens a sliding notifications panel. Rendered once above
 * the tabs so it persists across Home/History/Members/Settings.
 */
export function AppHeader() {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <View style={[styles.bar, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
      <ThemedText style={[styles.brand, { color: theme.primary }]}>Splitit</ThemedText>

      <Pressable
        hitSlop={10}
        accessibilityLabel="Notifications"
        onPress={() => setNotifOpen(true)}
        style={styles.side}
      >
        <Ionicons name="notifications-outline" size={24} color={theme.text} />
        {unreadCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.owe ?? '#e5484d', borderColor: theme.background }]}>
            <ThemedText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
          </View>
        ) : null}
      </Pressable>

      <NotificationsDrawer visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  // "Stylish" wordmark: bold, wide tracking. Swap in a display font via
  // expo-font here if desired.
  brand: { fontSize: 22, fontWeight: '800', letterSpacing: 1.5 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
