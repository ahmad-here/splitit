import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardStickyView, useKeyboardState } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatHistoryDrawer } from '@/components/chat/chat-history-drawer';
import { ResultCard } from '@/components/chat/result-card';
import { MemberPicker } from '@/components/member-picker';
import { ThemedText } from '@/components/themed-text';
import { OptionSheet } from '@/components/ui/option-sheet';
import { Spacing } from '@/constants/theme';
import { useChat } from '@/helpers/use-chat';
import { useFriends } from '@/store/friends-store';
import { useTheme } from '@/hooks/use-theme';

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const c = useChat();
  const { friends } = useFriends();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paidByOpen, setPaidByOpen] = useState(false);
  const keyboardVisible = useKeyboardState().isVisible;

  // @-mention: when the text ends with "@partial", suggest linked friends.
  const mentionMatch = /(^|\s)@(\w*)$/.exec(c.input);
  const mentionQuery = mentionMatch ? mentionMatch[2].toLowerCase() : null;
  const mentionSuggestions =
    mentionQuery === null
      ? []
      : friends.filter((f) => f.name.toLowerCase().includes(mentionQuery)).slice(0, 5);

  function applyMention(f: { id: string; name: string }) {
    // Replace the trailing "@partial" with the friend's name.
    c.setInput(c.input.replace(/(^|\s)@(\w*)$/, (_m, pre) => `${pre}${f.name} `));
    // Ensure they're a participant of this split.
    if (!c.members.some((m) => m.id === f.id)) c.setMembers([...c.members, { id: f.id, name: f.name }]);
  }

  // Keep the latest message visible when the keyboard opens.
  useEffect(() => {
    if (keyboardVisible) scrollRef.current?.scrollToEnd({ animated: true });
  }, [keyboardVisible]);

  const {
    messages,
    members,
    paidBy,
    payerOptions,
    input,
    staged,
    sending,
    pickerVisible,
    attachOpen,
  } = c;
  const canSend = !sending && (input.trim().length > 0 || staged !== null);
  const isEmpty = messages.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header button (right) to open the chat history menu. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              hitSlop={10}
              onPress={() => setDrawerOpen(true)}
              accessibilityLabel="Chat history"
              style={{ paddingLeft: Spacing.three, paddingRight: Spacing.four }}
            >
              <Ionicons name="time-outline" size={22} color={theme.text} />
            </Pressable>
          ),
        }}
      />

      {/* Members + payer — compact dropdowns (avoid chip clutter with many members) */}
      <View style={[styles.controlsBar, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => c.setPickerVisible(true)}
          style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
        >
          <Ionicons name="people-outline" size={16} color={theme.primary} />
          <ThemedText type="small" numberOfLines={1} style={styles.dropdownLabel}>
            {members.length === 0 ? 'Add members' : `${members.length}: ${members.map((m) => m.name).join(', ')}`}
          </ThemedText>
          <Ionicons name="chevron-down" size={16} color={theme.muted} />
        </Pressable>

        <Pressable
          onPress={() => setPaidByOpen(true)}
          style={[styles.dropdown, styles.paidDropdown, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="small" themeColor="textSecondary">
            Paid by
          </ThemedText>
          <ThemedText type="small" numberOfLines={1} style={styles.dropdownLabel}>
            {paidBy}
          </ThemedText>
          <Ionicons name="chevron-down" size={16} color={theme.muted} />
        </Pressable>
      </View>

      {/* Conversation */}
      {isEmpty ? (
        <View style={styles.empty}>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            Split a bill
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
            Add a receipt photo, or just describe your bill below.
          </ThemedText>
          <View style={styles.emptyButtons}>
            <Pressable onPress={() => c.pickImage(false)} style={[styles.bigBtn, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="add" size={34} color={theme.primary} />
              <ThemedText type="small">Gallery</ThemedText>
            </Pressable>
            <Pressable onPress={() => c.pickImage(true)} style={[styles.bigBtn, { backgroundColor: theme.backgroundElement }]}>
              <Ionicons name="camera" size={30} color={theme.primary} />
              <ThemedText type="small">Camera</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m) => (
            <Animated.View
              key={m.id}
              entering={FadeInDown.springify().damping(18).mass(0.6)}
              style={[styles.bubbleRow, m.role === 'user' ? styles.rowRight : styles.rowLeft]}
            >
              <View
                style={[
                  styles.bubble,
                  m.role === 'user'
                    ? { backgroundColor: theme.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: 4 },
                ]}
              >
                {m.image ? <Image source={{ uri: m.image }} style={styles.bubbleImage} contentFit="cover" /> : null}
                {m.text ? (
                  <ThemedText type="small" style={{ color: m.role === 'user' ? theme.onPrimary : theme.text }}>
                    {m.text}
                  </ThemedText>
                ) : null}
              </View>
              {m.result ? (
                <View style={styles.resultWrap}>
                  <ResultCard
                    result={m.result}
                    title={m.title ?? 'Bill split'}
                    paidBy={paidBy}
                    saved={m.saved}
                    onSave={() => c.onSave(m)}
                    onEdit={() => c.onEdit(m)}
                    onShare={() => c.shareResult(m)}
                  />
                </View>
              ) : null}
            </Animated.View>
          ))}
          {sending ? (
            <Animated.View entering={FadeIn.duration(200)} style={[styles.bubbleRow, styles.rowLeft]}>
              <View style={[styles.bubble, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Splitit is thinking…
                </ThemedText>
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>
      )}

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
      {/* Staged image preview */}
      {staged ? (
        <View style={[styles.stagedRow, { borderTopColor: theme.border }]}>
          <Image source={{ uri: staged }} style={styles.stagedImg} contentFit="cover" />
          <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
            Receipt attached
          </ThemedText>
          <Pressable hitSlop={8} onPress={c.clearStaged}>
            <Ionicons name="close-circle" size={22} color={theme.muted} />
          </Pressable>
        </View>
      ) : null}

      {/* Attach menu (toggled by the + button) */}
      {attachOpen ? (
        <View style={[styles.attachMenu, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Pressable style={styles.attachItem} onPress={() => c.pickImage(false)}>
            <Ionicons name="image-outline" size={22} color={theme.primary} />
            <ThemedText type="small">Gallery</ThemedText>
          </Pressable>
          <View style={[styles.attachDivider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.attachItem} onPress={() => c.pickImage(true)}>
            <Ionicons name="camera-outline" size={22} color={theme.primary} />
            <ThemedText type="small">Camera</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {/* @-mention suggestions */}
      {mentionSuggestions.length > 0 ? (
        <View style={[styles.mentionBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {mentionSuggestions.map((f) => (
            <Pressable key={f.id} style={styles.mentionItem} onPress={() => applyMention(f)}>
              <Ionicons name="at" size={16} color={theme.primary} />
              <ThemedText type="small" numberOfLines={1}>
                {f.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          {
            borderTopColor: theme.border,
            // KeyboardAvoidingView lifts the bar above the keyboard; only add the
            // home-indicator inset when the keyboard is closed.
            paddingBottom: keyboardVisible ? Spacing.two : insets.bottom + Spacing.two,
          },
        ]}
      >
        <Pressable
          hitSlop={6}
          onPress={c.toggleAttach}
          disabled={sending}
          style={[styles.attachBtn, attachOpen && { transform: [{ rotate: '45deg' }] }]}
          accessibilityLabel="Attach receipt"
        >
          <Ionicons name="add" size={26} color={theme.primary} />
        </Pressable>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          placeholder="Describe the bill…"
          placeholderTextColor={theme.muted}
          value={input}
          onChangeText={c.setInput}
          multiline
        />
        <Pressable
          hitSlop={6}
          onPress={c.send}
          disabled={!canSend}
          style={[styles.send, { backgroundColor: theme.primary, opacity: canSend ? 1 : 0.5 }]}
        >
          <Ionicons name="arrow-up" size={22} color={theme.onPrimary} />
        </Pressable>
      </View>
      </KeyboardStickyView>

      <MemberPicker visible={pickerVisible} onClose={() => c.setPickerVisible(false)} selected={members} onChange={c.setMembers} />

      <OptionSheet
        visible={paidByOpen}
        onClose={() => setPaidByOpen(false)}
        title="Paid by"
        groups={[
          {
            title: 'Who paid?',
            options: payerOptions.map((name) => ({ label: name, value: name })),
            value: paidBy,
            onSelect: (v) => {
              c.setPaidBy(v);
              setPaidByOpen(false);
            },
          },
        ]}
      />

      <ChatHistoryDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNewChat={c.newChat}
        onSelect={c.openChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  controlsBar: {
    flexDirection: 'column',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  paidDropdown: {},
  dropdownLabel: { flex: 1 },
  mentionBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: Spacing.one },
  mentionItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.two },
  emptyTitle: { textAlign: 'center' },
  emptyHint: { textAlign: 'center', marginBottom: Spacing.three },
  emptyButtons: { flexDirection: 'row', gap: Spacing.four },
  bigBtn: { width: 120, height: 120, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },

  messages: { flex: 1 },
  messagesContent: { padding: Spacing.three, gap: Spacing.two },
  bubbleRow: { maxWidth: '100%' },
  rowLeft: { alignItems: 'flex-start' },
  rowRight: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  bubbleImage: { width: 200, height: 150, borderRadius: 10 },
  resultWrap: { width: '100%' },

  stagedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  stagedImg: { width: 40, height: 40, borderRadius: 8 },

  attachMenu: {
    position: 'absolute',
    bottom: 72,
    left: Spacing.three,
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 10,
  },
  attachItem: { alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  attachDivider: { width: StyleSheet.hairlineWidth },
  attachBtn: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, maxHeight: 120, minHeight: 40, borderRadius: 20, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two, fontSize: 16 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
