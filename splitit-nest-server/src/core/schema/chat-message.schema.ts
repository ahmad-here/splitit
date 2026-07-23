import { z } from 'zod';

/** One turn in the chat. `image` is an optional data URL (receipt photo). */
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string(),
  image: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
