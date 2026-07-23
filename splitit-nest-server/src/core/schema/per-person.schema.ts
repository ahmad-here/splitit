import { z } from 'zod';

/** Amount owed by one participant. Computed by split/split-math.ts. */
export const PerPersonSchema = z.object({
  name: z.string(),
  amount: z.number(),
});
export type PerPerson = z.infer<typeof PerPersonSchema>;
