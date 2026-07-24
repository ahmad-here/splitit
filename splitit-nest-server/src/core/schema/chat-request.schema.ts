import { z } from 'zod';

import { ChatMemberSchema } from './chat-member.schema';
import { ChatMessageSchema } from './chat-message.schema';

/** Body of POST /api/chat. Validated by ZodValidationPipe in chat.controller.ts. */
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema),
  members: z.array(ChatMemberSchema).default([]),
  /** When signed in, the chat session to persist into (omit to start a new one). */
  chatId: z.string().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
