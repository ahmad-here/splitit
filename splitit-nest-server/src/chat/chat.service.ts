import { randomUUID } from 'node:crypto';
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
    // Still tag a thread id so the trace groups into a LangSmith thread.
    if (!ctx.uid) {
      const res = await runChat(messages, members, [], randomUUID());
      return { ...res, chatId: null };
    }

    const uid = ctx.uid;
    const facts = await this.memory.getFacts(uid);

    // Resolve the chat session up-front so it can double as the LangSmith
    // thread id (groups every turn of this conversation into one thread).
    let chatId = ctx.chatId ?? null;
    if (!chatId) {
      try {
        chatId = await this.store.createChat(uid);
      } catch (err) {
        this.logger.warn(`Chat create failed: ${err instanceof Error ? err.message : err}`);
      }
    }

    const res = await runChat(messages, members, facts, chatId ?? randomUUID());

    // Persist the turn into the chat session.
    if (chatId) {
      try {
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
        await this.store.append(uid, chatId, toStore, res.title ?? undefined);
      } catch (err) {
        this.logger.warn(`Chat persistence failed: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Update durable cross-chat memory in the BACKGROUND so the user gets the
    // reply immediately (the extraction LLM call can take several seconds).
    // Fire-and-forget: best-effort, never blocks or breaks the response.
    void this.updateMemoryInBackground(uid, messages, facts);

    return { ...res, chatId };
  }

  /** Distil + persist durable memory after the reply has been sent. */
  private async updateMemoryInBackground(
    uid: string,
    messages: ChatMessage[],
    facts: string[],
  ): Promise<void> {
    try {
      const updated = await extractMemory(messages, facts);
      if (updated.length && JSON.stringify(updated) !== JSON.stringify(facts)) {
        await this.memory.setFacts(uid, updated);
      }
    } catch (err) {
      this.logger.warn(`Memory update failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}
