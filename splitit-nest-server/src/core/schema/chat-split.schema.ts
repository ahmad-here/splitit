import { z } from 'zod';

import { AssignmentSchema } from './assignment.schema';
import { LineItemSchema } from './line-item.schema';

/**
 * The split the model proposes once it has enough info. Note there is no
 * perPerson field — those amounts are computed server-side by split-math.ts so
 * the LLM never does arithmetic.
 */
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
