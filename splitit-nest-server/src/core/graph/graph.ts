import { buildSplitGraph } from '../graph/pipeline';
import type { SplitResult } from '../schema';

/** The compiled split pipeline (see lib/graph/pipeline.ts + lib/graph/nodes/*). */
export const splitGraph = buildSplitGraph();

/** Run the pipeline end-to-end and shape the final API result. */
export async function runSplit(input: {
  imageDataUrl: string;
  description: string;
  participants: string[];
}): Promise<SplitResult> {
  const final = await splitGraph.invoke(input);
  const extraction = final.extraction;

  return {
    items: extraction?.items ?? [],
    assignments: final.assignments,
    perPerson: final.perPerson,
    subtotal: extraction?.subtotal ?? 0,
    tax: extraction?.tax ?? 0,
    tip: extraction?.tip ?? 0,
    total: extraction?.total ?? 0,
    needsReview: final.needsReview,
  };
}
