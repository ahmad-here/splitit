/**
 * Client for the conversational split endpoint (/api/chat). Sends the message
 * history (with an optional receipt image as a data URL) plus the known members,
 * and gets back the assistant's reply and — when ready — a finished split.
 */

import { httpClient } from '@/api/http-client';
import type { SplitResult } from '@/db/models';

export type ChatRole = 'user' | 'assistant';

/** Message as sent to the backend (image is a data URL). */
export type ChatWireMessage = {
  role: ChatRole;
  text: string;
  image?: string;
};

export type ChatMemberRef = { id: string; name: string };

export type ChatResponse = {
  reply: string;
  result: SplitResult | null;
  title: string | null;
};

export async function postChat(messages: ChatWireMessage[], members: ChatMemberRef[]): Promise<ChatResponse> {
  return httpClient.postJson<ChatResponse>('/api/chat', { messages, members });
}
