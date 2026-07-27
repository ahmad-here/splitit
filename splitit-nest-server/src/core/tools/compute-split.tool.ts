import { tool } from 'langchain';
import { z } from 'zod';

import { computePerPerson, round2, sumPerPerson } from '../split/split-math';
import { AssignmentSchema, LineItemSchema } from '../schema';

/**
 * The deterministic "money" capability, exposed to agents as a tool. The agent
 * decides the items/assignments; the actual arithmetic (per-person shares with
 * proportional tax/tip) runs here in code — never in the model. Single
 * responsibility: given items + assignments, return each person's share.
 */
const ComputeSplitInput = z.object({
  items: z.array(LineItemSchema).describe('Line items with numeric prices'),
  assignments: z.array(AssignmentSchema).describe('For each item, the participant names sharing it'),
  participants: z.array(z.string()).describe('Everyone involved in the bill'),
  tax: z.number().default(0),
  tip: z.number().default(0),
});

export const computeSplitTool = tool(
  ({ items, assignments, participants, tax, tip }) => {
    const perPerson = computePerPerson({ items, assignments, participants, tax, tip });
    return JSON.stringify({ perPerson, total: round2(sumPerPerson(perPerson)) });
  },
  {
    name: 'compute_split',
    description:
      "Calculate each participant's share of a bill (with proportional tax/tip). " +
      'ALWAYS use this for the money math — never calculate amounts yourself.',
    schema: ComputeSplitInput,
  },
);
