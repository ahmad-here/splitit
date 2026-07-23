import { z } from 'zod';

import { AssignmentSchema } from './assignment.schema';
import { LineItemSchema } from './line-item.schema';
import { PerPersonSchema } from './per-person.schema';

/**
 * Final API response shape for POST /api/split and the `result` field of
 * POST /api/chat. Mirrored by the app's SplitResult type in splitit/src/db/models.
 */
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
