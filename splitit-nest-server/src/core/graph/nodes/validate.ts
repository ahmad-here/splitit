import { round2, sumPerPerson } from '../../split/split-math';
import type { NodeSpec } from '../../graph/nodes/types';

/**
 * Node — reconcile the computed total against the receipt total. If it drifts
 * beyond a cent tolerance, flag needsReview (the pipeline wires a repair retry).
 */
export const validateNode: NodeSpec = {
  name: 'validate',
  run(state) {
    const receiptTotal = state.extraction?.total ?? 0;
    const drift = Math.abs(sumPerPerson(state.perPerson) - round2(receiptTotal));
    return { needsReview: drift > 0.05, attempts: state.attempts + 1 };
  },
};
