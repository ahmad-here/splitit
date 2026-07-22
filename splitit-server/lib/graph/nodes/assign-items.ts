import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { getProvider } from '@/lib/llm';
import { AssignmentResultSchema, type Assignment } from '@/lib/schema';
import type { NodeSpec } from '@/lib/graph/nodes/types';

/**
 * Node — read the user's description and assign each item to the people who
 * consumed it. Unmentioned items are shared among all participants.
 */
export const assignItemsNode: NodeSpec = {
  name: 'assignItems',
  async run(state) {
    const model = getProvider().getModel();
    const structured = model.withStructuredOutput(AssignmentResultSchema, { name: 'assignments' });

    const items = state.extraction?.items ?? [];
    const messages = [
      new SystemMessage(
        'You assign receipt items to people based on a free-text description of who bought what. ' +
          'Rules: (1) "item" must exactly match one of the given item names. ' +
          '(2) "people" must be a non-empty subset of the participant list. ' +
          '(3) If an item is not clearly attributed to anyone, split it among ALL participants. ' +
          '(4) Every item must appear exactly once.',
      ),
      new HumanMessage(
        `Participants: ${JSON.stringify(state.participants)}\n` +
          `Items: ${JSON.stringify(items.map((i) => i.name))}\n` +
          `Description: "${state.description}"`,
      ),
    ];

    const result = (await structured.invoke(messages)) as { assignments: Assignment[] };

    // Ensure every item is covered; default uncovered items to everyone.
    const covered = new Set(result.assignments.map((a) => a.item));
    const filled: Assignment[] = [...result.assignments];
    for (const item of items) {
      if (!covered.has(item.name)) {
        filled.push({ item: item.name, people: state.participants });
      }
    }
    return { assignments: filled };
  },
};
