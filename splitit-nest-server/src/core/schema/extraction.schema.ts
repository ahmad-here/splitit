import { z } from 'zod';

import { LineItemSchema } from './line-item.schema';

/** Output of the vision extraction step (see graph/nodes/extract-items.ts). */
export const ExtractionSchema = z.object({
  items: z.array(LineItemSchema),
  subtotal: z.number(),
  tax: z.number(),
  tip: z.number(),
  total: z.number(),
  currency: z.string().default('$'),
});
export type Extraction = z.infer<typeof ExtractionSchema>;
