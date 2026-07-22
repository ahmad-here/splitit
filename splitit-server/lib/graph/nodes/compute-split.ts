import { computePerPerson } from '@/lib/split/split-math';
import type { NodeSpec } from '@/lib/graph/nodes/types';

/**
 * Node — deterministic arithmetic (NOT the LLM). Delegates to the shared
 * split-math module so the graph and the chat agent stay in lockstep.
 */
export const computeSplitNode: NodeSpec = {
  name: 'computeSplit',
  run(state) {
    const extraction = state.extraction;
    if (!extraction) return { perPerson: [] };

    const perPerson = computePerPerson({
      items: extraction.items,
      assignments: state.assignments,
      participants: state.participants,
      tax: extraction.tax,
      tip: extraction.tip,
    });

    return { perPerson };
  },
};
