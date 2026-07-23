import { z } from 'zod';

import { ChatSplitSchema } from './chat-split.schema';

/** What the model returns each turn: always a reply, optionally a finished split. */
export const ChatReplySchema = z.object({
  reply: z.string().describe('Friendly natural-language message to show the user'),
  ready: z.boolean().describe('True only when a complete, unambiguous split is ready'),
  split: ChatSplitSchema.nullable().describe('Present only when ready is true'),
});
export type ChatReply = z.infer<typeof ChatReplySchema>;
