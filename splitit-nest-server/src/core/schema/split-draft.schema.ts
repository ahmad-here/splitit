import { z } from 'zod';

import { AssignmentSchema } from './assignment.schema';
import { LineItemSchema } from './line-item.schema';

/**
 * What the split AGENT returns for POST /api/split — the read/assign result only.
 * Per-person amounts are NOT here: they're computed in code (split-math) after the
 * agent runs, so the money is deterministic. Participants come from the request.
 */
export const SplitDraftSchema = z.object({
  items: z.array(LineItemSchema),
  assignments: z.array(AssignmentSchema),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  total: z.number(),
});
export type SplitDraft = z.infer<typeof SplitDraftSchema>;
