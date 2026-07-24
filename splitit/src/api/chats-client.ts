/**
 * Client for /api/chats — list past chat sessions and restore their messages.
 * Requires auth. (The conversational turn endpoint is /api/chat.)
 */

import { httpClient } from '@/api/http-client';

export type ChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  createdAt: string;
};

export function listChats(): Promise<ChatSummary[]> {
  return httpClient.getJson<ChatSummary[]>('/api/chats');
}

export function getChatMessages(chatId: string): Promise<StoredChatMessage[]> {
  return httpClient.getJson<StoredChatMessage[]>(`/api/chats/${chatId}`);
}
