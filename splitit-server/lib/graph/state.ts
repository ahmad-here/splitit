import { Annotation } from '@langchain/langgraph';

import type { Assignment, Extraction, LineItem, PerPerson } from '@/lib/schema';

/**
 * Graph state shared across nodes. `imageDataUrl` and `description` are inputs;
 * everything else is populated as the pipeline runs.
 */
export const SplitState = Annotation.Root({
  // Inputs
  imageDataUrl: Annotation<string>(),
  description: Annotation<string>(),
  participants: Annotation<string[]>(),

  // Produced by extractItems
  extraction: Annotation<Extraction | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  // Produced by assignItems
  assignments: Annotation<Assignment[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  // Produced by computeSplit
  perPerson: Annotation<PerPerson[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  // Produced by validate
  needsReview: Annotation<boolean>({
    reducer: (_prev, next) => next,
    default: () => false,
  }),
  attempts: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
});

export type SplitStateType = typeof SplitState.State;
export type { LineItem };
