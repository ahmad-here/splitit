import type { SplitStateType } from '@/lib/graph/state';

/** A graph node: reads the state and returns a partial state update. */
export type NodeFn = (state: SplitStateType) => Partial<SplitStateType> | Promise<Partial<SplitStateType>>;

/**
 * A self-describing node. Each node file exports one of these so the pipeline
 * can be assembled by listing specs — adding/removing/reordering a stage never
 * touches the graph wiring.
 */
export type NodeSpec = {
  name: string;
  run: NodeFn;
};
