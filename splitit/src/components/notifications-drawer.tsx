import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { Spacing } from '@/constants/theme';
import { relativeDate } from '@/utils/format';
import { useNotifications } from '@/store/notifications-store';
import { useTheme } from '@/hooks/use-theme';

const ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  split_added: 'receipt-outline',
  reminder: 'alarm-outline',
};

type Props = { visible: boolean; onClose: () => void };

/** Right-side sliding panel (80% width) showing the notification feed. */
export function NotificationsDrawer({ visible, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, refresh, markRead, clearAll } = useNotifications();

  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          entering={SlideInRight.duration(220)}
          exiting={SlideOutRight.duration(180)}
          style={[styles.panel, { backgroundColor: '#000', paddingTop: insets.top + Spacing.two }]}
        >
          <View style={styles.header}>
            <ThemedText type="smallBold">Notifications</ThemedText>
            <View style={styles.headerActions}>
              {notifications.length > 0 ? (
                <Pressable hitSlop={8} onPress={clearAll} accessibilityLabel="Clear all">
                  <ThemedText type="small" themeColor="primary">
                    Clear all
                  </ThemedText>
                </Pressable>
              ) : null}
              <Pressable hitSlop={8} onPress={onClose} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.three }}>
            {notifications.length === 0 ? (
              <EmptyState
                icon="notifications-outline"
                title="No notifications"
                message="Split updates and payment reminders will appear here."
              />
            ) : (
              notifications.map((n) => (
                <ListItem
                  key={n.id}
                  title={n.title}
                  subtitle={`${n.body}  ·  ${relativeDate(n.createdAt)}`}
                  left={
                    <View style={styles.iconWrap}>
                      <Ionicons name={ICON[n.type] ?? 'notifications-outline'} size={20} color={theme.primary} />
                      {!n.read ? <View style={[styles.dot, { backgroundColor: theme.primary }]} /> : null}
                    </View>
                  }
                  onPress={() => !n.read && markRead(n.id)}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: '#00000066' },
  panel: {
    width: '80%',
    maxWidth: 360,
    paddingHorizontal: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: -2, height: 0 },
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconWrap: { width: 28, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: -2, right: 0, width: 8, height: 8, borderRadius: 4 },
});
