import { z } from 'zod';

/** Durable, cross-chat facts about the user (ChatGPT-style memory). */
export const MemoryFactsSchema = z.object({
  facts: z
    .array(z.string())
    .describe('Short, stable facts worth remembering across all chats (e.g. the user\'s name, currency, recurring people). No transient bill details.'),
});
export type MemoryFacts = z.infer<typeof MemoryFactsSchema>;
