import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { getProvider } from '../../llm';
import { llmCallOptions } from '../../llm/call-options';
import { AssignmentResultSchema, type Assignment } from '../../schema';
import { ASSIGN_ITEMS_PROMPT } from '../../constants';
import type { NodeSpec } from '../../graph/nodes/types';

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
      new SystemMessage(ASSIGN_ITEMS_PROMPT),
      new HumanMessage(
        `Participants: ${JSON.stringify(state.participants)}\n` +
          `Items: ${JSON.stringify(items.map((i) => i.name))}\n` +
          `Description: "${state.description}"`,
      ),
    ];

    const result = (await structured.invoke(messages, llmCallOptions())) as { assignments: Assignment[] };

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
