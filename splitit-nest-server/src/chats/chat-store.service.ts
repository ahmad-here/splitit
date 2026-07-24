import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import type { ChatSummary, StoredChatMessage } from '../core/schema';

type NewMessage = { role: 'user' | 'assistant'; text: string; imageUrl?: string };

/**
 * Owns the `chats` collection and its `messages` subcollection. Persistence for
 * the conversational split screen so a user can revisit past chats.
 */
@Injectable()
export class ChatStoreService {
  constructor(private readonly firebase: FirebaseService) {}

  private get chats() {
    return this.firebase.db.collection('chats');
  }

  private messages(chatId: string) {
    return this.chats.doc(chatId).collection('messages');
  }

  private async assertOwner(uid: string, chatId: string): Promise<void> {
    const snap = await this.chats.doc(chatId).get();
    if (!snap.exists) throw new NotFoundException('Chat not found.');
    if (snap.data()?.userId !== uid) throw new ForbiddenException('Not your chat.');
  }

  async createChat(uid: string, title = 'New chat'): Promise<string> {
    const now = new Date().toISOString();
    const ref = await this.chats.add({ userId: uid, title, createdAt: now, updatedAt: now });
    return ref.id;
  }

  /** Newest first. Sorted in memory to avoid a composite index (userId + updatedAt). */
  async listChats(uid: string): Promise<ChatSummary[]> {
    const snap = await this.chats.where('userId', '==', uid).get();
    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title ?? 'Chat'),
          createdAt: String(data.createdAt ?? ''),
          updatedAt: String(data.updatedAt ?? ''),
        };
      })
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 100);
  }

  async getMessages(uid: string, chatId: string): Promise<StoredChatMessage[]> {
    await this.assertOwner(uid, chatId);
    const snap = await this.messages(chatId).orderBy('createdAt', 'asc').get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        role: data.role === 'assistant' ? 'assistant' : 'user',
        text: String(data.text ?? ''),
        imageUrl: data.imageUrl ?? undefined,
        createdAt: String(data.createdAt ?? ''),
      };
    });
  }

  /** Append messages and bump the chat's updatedAt (and title if still default). */
  async append(uid: string, chatId: string, msgs: NewMessage[], title?: string): Promise<void> {
    await this.assertOwner(uid, chatId);
    const batch = this.firebase.db.batch();
    const now = new Date().toISOString();
    for (const m of msgs) {
      const ref = this.messages(chatId).doc();
      batch.set(ref, { role: m.role, text: m.text, imageUrl: m.imageUrl ?? null, createdAt: now });
    }
    const patch: Record<string, unknown> = { updatedAt: now };
    if (title) patch.title = title;
    batch.set(this.chats.doc(chatId), patch, { merge: true });
    await batch.commit();
  }
}
