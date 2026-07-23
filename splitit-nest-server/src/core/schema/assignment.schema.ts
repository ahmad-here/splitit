import { z } from 'zod';

/** Which people a single item belongs to. */
export const AssignmentSchema = z.object({
  item: z.string().describe('Must match a line item name exactly'),
  people: z.array(z.string()).describe('Participant names this item is split between'),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

/** Output of the assignment step (see graph/nodes/assign-items.ts). */
export const AssignmentResultSchema = z.object({
  assignments: z.array(AssignmentSchema),
});
export type AssignmentResult = z.infer<typeof AssignmentResultSchema>;
