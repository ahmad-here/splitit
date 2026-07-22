/**
 * All logic for the conversational split screen: message state, member/payer
 * selection, image capture, sending to the backend, and saving/editing a result.
 * The screen consumes this hook and only renders.
 */

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { postChat, type ChatWireMessage } from '@/api/chat-client';
import type { MemberRef } from '@/components/member-picker';
import { OWNER_NAME } from '@/db/balances';
import type { SplitResult } from '@/db/models';
import { useFlow } from '@/store/flow-context';
import { useSplits } from '@/store/splits-store';
import { shareSplit } from '@/utils/share';
import { toast } from '@/utils/toast';

export type UIMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  image?: string; // data URL
  result?: SplitResult;
  title?: string;
  saved?: boolean;
};

let counter = 0;
const nextId = () => `m${Date.now()}_${counter++}`;

function defaultTitle(): string {
  return `Split · ${new Date().toLocaleDateString()}`;
}

export function useChat() {
  const router = useRouter();
  const { saveSplit } = useSplits();
  const { setDraft } = useFlow();

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [members, setMembers] = useState<MemberRef[]>([]);
  const [paidBy, setPaidBy] = useState<string>(OWNER_NAME);
  const [input, setInput] = useState('');
  const [staged, setStaged] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  const payerOptions = [OWNER_NAME, ...members.map((m) => m.name)];

  async function pickImage(camera: boolean) {
    setAttachOpen(false);
    const perm = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Permission needed', 'Allow access to add a receipt photo.');
      return;
    }
    const res = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true, mediaTypes: ['images'] });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      const mime = a.mimeType ?? 'image/jpeg';
      setStaged(a.base64 ? `data:${mime};base64,${a.base64}` : a.uri);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text && !staged) return;

    const userMsg: UIMessage = { id: nextId(), role: 'user', text, image: staged ?? undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setStaged(null);
    setSending(true);

    try {
      const chain: ChatWireMessage[] = next.map((m) => ({ role: m.role, text: m.text, image: m.image }));
      const res = await postChat(
        chain,
        members.map((m) => ({ id: m.id, name: m.name })),
      );
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: res.reply, result: res.result ?? undefined, title: res.title ?? undefined },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: `⚠️ ${err instanceof Error ? err.message : 'Something went wrong.'}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  const conversationImage = () => messages.find((m) => m.role === 'user' && m.image)?.image;
  const conversationDescription = () =>
    messages
      .filter((m) => m.role === 'user' && m.text)
      .map((m) => m.text)
      .join(' ');

  async function onSave(msg: UIMessage) {
    if (!msg.result) return;
    await saveSplit(msg.result, {
      title: msg.title ?? defaultTitle(),
      participants: msg.result.perPerson.map((p) => p.name),
      paidBy,
      description: conversationDescription(),
      invoiceImageUri: conversationImage(),
    });
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, saved: true } : m)));
    toast.success('Split saved');
  }

  function onEdit(msg: UIMessage) {
    if (!msg.result) return;
    setDraft({
      result: msg.result,
      participants: msg.result.perPerson.map((p) => p.name),
      description: conversationDescription(),
      invoiceImageUri: conversationImage(),
      paidBy,
      title: msg.title ?? defaultTitle(),
    });
    router.push('/result');
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((x) => x.id !== id));
  }

  function shareResult(msg: UIMessage) {
    if (!msg.result) return;
    shareSplit({ ...msg.result, title: msg.title }).catch(() => toast.error('Share failed'));
  }

  return {
    messages,
    members,
    setMembers,
    removeMember,
    paidBy,
    setPaidBy,
    payerOptions,
    input,
    setInput,
    staged,
    clearStaged: () => setStaged(null),
    sending,
    pickerVisible,
    setPickerVisible,
    attachOpen,
    toggleAttach: () => setAttachOpen((v) => !v),
    pickImage,
    send,
    onSave,
    onEdit,
    shareResult,
  };
}
