import { HumanMessage } from '@langchain/core/messages';
import { createAgent, toolStrategy } from 'langchain';

import { ASSIGN_ITEMS_PROMPT, EXTRACT_ITEMS_PROMPT } from '../constants';
import { getProvider } from '../llm';
import { agentInvokeConfig } from '../llm/call-options';
import { computePerPerson, round2, sumPerPerson } from '../split/split-math';
import { computeSplitTool } from '../tools';
import { SplitDraftSchema, type SplitDraft, type SplitResult } from '../schema';

export type SplitInput = { imageDataUrl: string; description: string; participants: string[] };

const SPLIT_AGENT_PROMPT = `${EXTRACT_ITEMS_PROMPT}

${ASSIGN_ITEMS_PROMPT}

After you have the items and assignments, call the compute_split tool to work out each
person's share, then return the final structured result. Use plain numbers only.`;

/**
 * Split agent: reads the receipt image + description, assigns items, and (via the
 * compute_split tool) works out the shares. The agent is the read/assign brain;
 * the per-person math is re-derived in code here so amounts are always correct
 * regardless of what the model returns.
 */
export async function runSplit(input: SplitInput): Promise<SplitResult> {
  const agent = createAgent({
    model: getProvider().getModel(),
    tools: [computeSplitTool],
    systemPrompt: SPLIT_AGENT_PROMPT,
    // Cast: langchain 1.5's ResponseFormat generics don't line up with zod v4's
    // inferred type, but toolStrategy validates against the schema at runtime.
    responseFormat: toolStrategy(SplitDraftSchema) as never,
  });

  const message = new HumanMessage({
    content: [
      {
        type: 'text',
        text: `Participants: ${JSON.stringify(input.participants)}\nDescription: ${input.description || '(none provided)'}`,
      },
      { type: 'image_url', image_url: input.imageDataUrl },
    ],
  });

  const res = (await agent.invoke({ messages: [message] }, agentInvokeConfig())) as unknown as {
    structuredResponse: SplitDraft;
  };
  const draft = res.structuredResponse;

  // Deterministic money — recompute in code from the agent's items/assignments.
  const perPerson = computePerPerson({
    items: draft.items,
    assignments: draft.assignments,
    participants: input.participants,
    tax: draft.tax,
    tip: draft.tip,
  });
  const computedTotal = sumPerPerson(perPerson);
  const needsReview = draft.total > 0 && Math.abs(computedTotal - round2(draft.total)) > 0.05;

  return {
    items: draft.items,
    assignments: draft.assignments,
    perPerson,
    subtotal: draft.subtotal,
    tax: draft.tax,
    tip: draft.tip,
    total: draft.total > 0 ? draft.total : round2(computedTotal),
    needsReview,
  };
}
