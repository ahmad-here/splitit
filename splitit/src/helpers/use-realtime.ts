/**
 * Subscribes to one or more Firestore queries and calls `refresh` (debounced)
 * whenever any of them changes. Used by the domain stores to turn their
 * fetch-once behaviour into live updates without duplicating data mapping —
 * the snapshot is just a "something changed, re-pull from the backend" signal.
 */

import { onSnapshot, type Query } from 'firebase/firestore';
import { useEffect } from 'react';

export function useRealtimeRefresh(
  buildQueries: () => Query[] | null,
  refresh: () => void,
  deps: React.DependencyList,
) {
  useEffect(() => {
    const queries = buildQueries();
    if (!queries || queries.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const debounced = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    };

    const unsubs = queries.map((q) =>
      onSnapshot(
        q,
        () => debounced(),
        () => {}, // ignore listener errors (e.g. transient permission/network)
      ),
    );

    return () => {
      if (timer) clearTimeout(timer);
      unsubs.forEach((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
