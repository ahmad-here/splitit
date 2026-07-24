import { z } from 'zod';

/** A chat session summary in the chat list. */
export const ChatSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ChatSummary = z.infer<typeof ChatSummarySchema>;

/** A stored chat message. */
export const StoredChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  text: z.string(),
  imageUrl: z.string().optional(),
  createdAt: z.string(),
});
export type StoredChatMessage = z.infer<typeof StoredChatMessageSchema>;
