import { z } from 'zod';

import { AssignmentSchema } from './assignment.schema';
import { LineItemSchema } from './line-item.schema';
import { PerPersonSchema } from './per-person.schema';

/** A participant on a persisted split; profileId is set when linked to a real user. */
export const SplitParticipantSchema = z.object({
  profileId: z.string().nullable().optional(),
  name: z.string(),
  amount: z.number(),
});
export type SplitParticipant = z.infer<typeof SplitParticipantSchema>;

/**
 * Body of POST /api/splits — persist a computed split. The app sends the same
 * SplitResult it already renders, plus metadata; the server stores it and fans
 * out notifications to linked participants.
 */
export const SaveSplitSchema = z.object({
  id: z.string().optional(),
  title: z.string().default(''),
  description: z.string().optional(),
  currency: z.string().default('$'),
  paidBy: z.string().optional(),
  subtotal: z.number().default(0),
  tax: z.number().default(0),
  tip: z.number().default(0),
  total: z.number().default(0),
  needsReview: z.boolean().default(false),
  items: z.array(LineItemSchema).default([]),
  assignments: z.array(AssignmentSchema).default([]),
  perPerson: z.array(PerPersonSchema).default([]),
  /** Optional map of participant name -> linked friend profileId. */
  participantLinks: z.record(z.string(), z.string()).default({}),
  /** Receipt photo as a data URL (input only; server offloads it to Storage). */
  invoiceImage: z.string().optional(),
});
export type SaveSplit = z.infer<typeof SaveSplitSchema>;
