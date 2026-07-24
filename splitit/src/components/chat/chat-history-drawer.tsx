import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listChats, type ChatSummary } from '@/api/chats-client';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Spacing } from '@/constants/theme';
import { relativeDate } from '@/utils/format';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelect: (chatId: string) => void;
};

/**
 * Right-side sliding menu (ChatGPT-style) for the AI chat page: a "New chat"
 * action pinned on top, then the user's chat history.
 */
export function ChatHistoryDrawer({ visible, onClose, onNewChat, onSelect }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState<ChatSummary[]>([]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    listChats()
      .then((c) => active && setChats(c))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          entering={SlideInRight.duration(220)}
          exiting={SlideOutRight.duration(180)}
          style={[styles.panel, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.two }]}
        >
          <View style={styles.header}>
            <ThemedText type="smallBold">Chats</ThemedText>
            <Pressable hitSlop={8} onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* New chat — pinned top tab */}
          <Pressable
            onPress={() => {
              onNewChat();
              onClose();
            }}
            style={[styles.newChat, { borderColor: theme.primary }]}
          >
            <Ionicons name="add" size={20} color={theme.primary} />
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              Start new chat
            </ThemedText>
          </Pressable>

          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.three }}>
            {chats.length === 0 ? (
              <EmptyState icon="chatbubbles-outline" title="No past chats" message="Your conversations will appear here." />
            ) : (
              chats.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                  style={styles.chatRow}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.muted} />
                  <View style={{ flex: 1 }}>
                    <ThemedText type="small" numberOfLines={1}>
                      {c.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {relativeDate(c.updatedAt)}
                    </ThemedText>
                  </View>
                </Pressable>
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
    width: '78%',
    maxWidth: 340,
    paddingHorizontal: Spacing.three,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: -2, height: 0 },
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.two },
  newChat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    marginVertical: Spacing.two,
  },
  list: { flex: 1 },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
});
