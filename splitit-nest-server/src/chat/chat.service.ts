import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { extractMemory, runChat, type ChatResponse } from '../core/chat/agent';
import type { ChatMember, ChatMessage } from '../core/schema';
import { ChatStoreService } from '../chats/chat-store.service';
import { MemoryService } from '../chats/memory.service';
import { StorageService } from '../storage/storage.service';

/** Result returned to the controller; includes the chatId when persisted. */
export type ChatResult = ChatResponse & { chatId: string | null };

/** Options present only when the caller is authenticated. */
export type ChatContext = { uid?: string; chatId?: string };

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly memory: MemoryService,
    private readonly store: ChatStoreService,
    private readonly storage: StorageService,
  ) {}

  async chat(messages: ChatMessage[], members: ChatMember[], ctx: ChatContext = {}): Promise<ChatResult> {
    if (messages.length === 0) throw new BadRequestException('No messages provided.');

    // Anonymous (backward-compatible) path: stateless, no memory, no storage.
    if (!ctx.uid) {
      const res = await runChat(messages, members);
      return { ...res, chatId: null };
    }

    const uid = ctx.uid;
    const facts = await this.memory.getFacts(uid);
    const res = await runChat(messages, members, facts);

    // Persist into a chat session (create one on first turn).
    let chatId = ctx.chatId ?? null;
    try {
      if (!chatId) chatId = await this.store.createChat(uid);
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      // Offload the receipt photo to Storage so the data URL never lands in
      // Firestore (~1 MB doc limit). Best-effort: drop the image on failure.
      let imageUrl: string | undefined;
      if (lastUser?.image) {
        imageUrl = await this.storage.uploadDataUrl(uid, lastUser.image).catch(() => undefined);
      }
      const toStore = [
        ...(lastUser ? [{ role: 'user' as const, text: lastUser.text, imageUrl }] : []),
        { role: 'assistant' as const, text: res.reply },
      ];
      const title = res.title ?? undefined;
      await this.store.append(uid, chatId, toStore, title);
    } catch (err) {
      this.logger.warn(`Chat persistence failed: ${err instanceof Error ? err.message : err}`);
    }

    // Update durable cross-chat memory (best-effort — never break the reply).
    try {
      const updated = await extractMemory(messages, facts);
      if (updated.length && JSON.stringify(updated) !== JSON.stringify(facts)) {
        await this.memory.setFacts(uid, updated);
      }
    } catch (err) {
      this.logger.warn(`Memory update failed: ${err instanceof Error ? err.message : err}`);
    }

    return { ...res, chatId };
  }
}
