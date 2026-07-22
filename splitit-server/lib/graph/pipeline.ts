import { END, START, StateGraph } from '@langchain/langgraph';

import { assignItemsNode, computeSplitNode, extractItemsNode, validateNode, type NodeFn, type NodeSpec } from '@/lib/graph/nodes';
import { SplitState, type SplitStateType } from '@/lib/graph/state';

const MAX_ATTEMPTS = 2;

/**
 * The ordered pipeline. To add / remove / reorder a stage, edit this array — the
 * graph builds its own linear wiring from it. Each entry is a self-describing
 * node (see lib/graph/nodes/*).
 */
export const PIPELINE: NodeSpec[] = [extractItemsNode, assignItemsNode, computeSplitNode, validateNode];

/**
 * After validation: if the totals didn't reconcile and we have retries left,
 * loop back to re-assign items; otherwise finish (needsReview may be true).
 */
function afterValidate(state: SplitStateType): string {
  if (state.needsReview && state.attempts < MAX_ATTEMPTS) return assignItemsNode.name;
  return END;
}

/**
 * Compile the split graph from PIPELINE. The LangGraph builder's fluent types
 * track literal node names; we register from data, so we drive it through a
 * locally-loosened view of the same builder.
 */
export function buildSplitGraph() {
  const graph = new StateGraph(SplitState);
  const wf = graph as unknown as {
    addNode: (name: string, fn: NodeFn) => void;
    addEdge: (from: string, to: string) => void;
    addConditionalEdges: (from: string, router: (s: SplitStateType) => string, map: Record<string, string>) => void;
  };

  for (const node of PIPELINE) wf.addNode(node.name, node.run);

  wf.addEdge(START, PIPELINE[0].name);
  for (let i = 0; i < PIPELINE.length - 1; i++) wf.addEdge(PIPELINE[i].name, PIPELINE[i + 1].name);

  wf.addConditionalEdges(validateNode.name, afterValidate, {
    [assignItemsNode.name]: assignItemsNode.name,
    [END]: END,
  });

  return graph.compile();
}
