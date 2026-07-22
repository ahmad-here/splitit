import { z } from 'zod';

/** A single line item read off the receipt. */
export const LineItemSchema = z.object({
  name: z.string().describe('Item name as printed on the receipt'),
  qty: z.number().describe('Quantity; default 1 if not printed'),
  price: z.number().describe('Total price for this line (qty * unit price)'),
});
export type LineItem = z.infer<typeof LineItemSchema>;

/** Output of the vision extraction step. */
export const ExtractionSchema = z.object({
  items: z.array(LineItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  total: z.number(),
  currency: z.string().default('$'),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

/** Output of the assignment step: which people each item belongs to. */
export const AssignmentSchema = z.object({
  item: z.string().describe('Must match a line item name exactly'),
  people: z.array(z.string()).describe('Participant names this item is split between'),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

export const AssignmentResultSchema = z.object({
  assignments: z.array(AssignmentSchema),
});

/** Amount owed by one participant. */
export const PerPersonSchema = z.object({
  name: z.string(),
  amount: z.number(),
});
export type PerPerson = z.infer<typeof PerPersonSchema>;

/** Final API response shape. Mirrored by the app's SplitResult type. */
export const SplitResultSchema = z.object({
  items: z.array(LineItemSchema),
  assignments: z.array(AssignmentSchema),
  perPerson: z.array(PerPersonSchema),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  total: z.number(),
  needsReview: z.boolean(),
});
export type SplitResult = z.infer<typeof SplitResultSchema>;

/* ------------------------------------------------------------------ */
/* Conversational chat (/api/chat)                                     */
/* ------------------------------------------------------------------ */

/** One turn in the chat. `image` is an optional data URL (receipt photo). */
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string(),
  image: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/** A known member the user has saved (used for participant disambiguation). */
export const ChatMemberSchema = z.object({ id: z.string(), name: z.string() });
export type ChatMember = z.infer<typeof ChatMemberSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema),
  members: z.array(ChatMemberSchema).default([]),
});

/** The split the model proposes once it has enough info (perPerson is computed server-side). */
export const ChatSplitSchema = z.object({
  title: z.string().describe('Short human title for the bill, e.g. "KFC Dinner"'),
  items: z.array(LineItemSchema),
  assignments: z.array(AssignmentSchema),
  participants: z.array(z.string()).describe('Everyone involved in this bill'),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  total: z.number(),
});
export type ChatSplit = z.infer<typeof ChatSplitSchema>;

/** What the model returns each turn: always a reply, optionally a finished split. */
export const ChatReplySchema = z.object({
  reply: z.string().describe('Friendly natural-language message to show the user'),
  ready: z.boolean().describe('True only when a complete, unambiguous split is ready'),
  split: ChatSplitSchema.nullable().describe('Present only when ready is true'),
});
export type ChatReply = z.infer<typeof ChatReplySchema>;
