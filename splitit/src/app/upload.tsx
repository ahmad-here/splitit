import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ResultCard } from '@/components/chat/result-card';
import { MemberPicker } from '@/components/member-picker';
import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { useChat } from '@/helpers/use-chat';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useTheme } from '@/hooks/use-theme';

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const c = useChat();

  // Keep the latest message visible when the keyboard opens.
  useEffect(() => {
    if (keyboardHeight > 0) scrollRef.current?.scrollToEnd({ animated: true });
  }, [keyboardHeight]);

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
    <View style={{ flex: 1, backgroundColor: theme.background, paddingBottom: keyboardHeight }}>
      {/* Members bar */}
      <View style={[styles.membersBar, { borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersRow}>
          {members.map((m) => (
            <Chip key={m.id} label={`${m.name}  ✕`} selected onPress={() => c.removeMember(m.id)} />
          ))}
          <Pressable onPress={() => c.setPickerVisible(true)} style={[styles.addMember, { borderColor: theme.primary }]}>
            <Ionicons name="person-add-outline" size={16} color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.primary }}>
              Add member
            </ThemedText>
          </Pressable>
        </ScrollView>
      </View>

      {/* Paid by selector */}
      <View style={[styles.paidBar, { borderBottomColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Paid by
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paidRow}>
          {payerOptions.map((name) => (
            <Chip key={name} label={name} selected={paidBy === name} onPress={() => c.setPaidBy(name)} />
          ))}
        </ScrollView>
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
            <View key={m.id} style={[styles.bubbleRow, m.role === 'user' ? styles.rowRight : styles.rowLeft]}>
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
            </View>
          ))}
          {sending ? (
            <View style={[styles.bubbleRow, styles.rowLeft]}>
              <View style={[styles.bubble, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Splitit is thinking…
                </ThemedText>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}

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

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          {
            borderTopColor: theme.border,
            // The container already lifts by keyboardHeight; only add the
            // home-indicator inset when the keyboard is closed.
            paddingBottom: keyboardHeight > 0 ? Spacing.two : insets.bottom + Spacing.two,
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

      <MemberPicker visible={pickerVisible} onClose={() => c.setPickerVisible(false)} selected={members} onChange={c.setMembers} />
    </View>
  );
}

const styles = StyleSheet.create({
  membersBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  membersRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', padding: Spacing.two },
  addMember: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  paidBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  paidRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },

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
