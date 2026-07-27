/**
 * Splits (bill history) domain store — backed by the backend (/api/splits), not
 * local storage. Held in memory and refreshed from the server; saving a split
 * posts it (which also uploads the receipt and notifies linked participants).
 */

import { collection, query, where } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  deleteSplitRemote,
  listSplitsRemote,
  saveSplitRemote,
} from '@/api/splits-client';
import { env } from '@/config/env';
import { db } from '@/db/firestore';
import type { SplitRecord, SplitResult } from '@/db/models';
import { useAuth } from '@/store/auth-store';
import { useRealtimeRefresh } from '@/helpers/use-realtime';

export type SaveSplitMeta = {
  title: string;
  participants: string[];
  description?: string;
  invoiceImageUri?: string;
  paidBy?: string;
  groupId?: string;
  id?: string;
  /** Map of participant name -> linked friend profileId (for server notifications). */
  participantLinks?: Record<string, string>;
};

type SplitsValue = {
  splits: SplitRecord[];
  hydrated: boolean;
  saveSplit: (result: SplitResult, meta: SaveSplitMeta) => Promise<SplitRecord>;
  removeSplit: (id: string) => Promise<void>;
  getSplit: (id: string) => SplitRecord | undefined;
  refresh: () => Promise<void>;
  reset: () => void;
};

const SplitsContext = createContext<SplitsValue | undefined>(undefined);

export function SplitsProvider({ children }: { children: React.ReactNode }) {
  const { user, emailVerified } = useAuth();
  const active = !!user && emailVerified;
  const uid = user?.uid ?? null;
  const [splits, setSplits] = useState<SplitRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (!active) {
      setSplits([]);
      setHydrated(true);
      return;
    }
    try {
      setSplits(await listSplitsRemote());
    } catch {
      // keep last-known on transient failure
    } finally {
      setHydrated(true);
    }
  }, [active]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live updates: splits I own or am a participant in (e.g. someone adds me).
  useRealtimeRefresh(
    () =>
      active && uid
        ? [
            query(collection(db, 'splits'), where('participantIds', 'array-contains', uid)),
            query(collection(db, 'splits'), where('ownerId', '==', uid)),
          ]
        : null,
    refresh,
    [active, uid],
  );

  const saveSplit = useCallback(async (result: SplitResult, meta: SaveSplitMeta) => {
    const res = await saveSplitRemote({
      ...result,
      id: meta.id,
      title: meta.title,
      description: meta.description,
      paidBy: meta.paidBy,
      currency: env.currency,
      participantLinks: meta.participantLinks,
      invoiceImage: meta.invoiceImageUri,
    });

    const record: SplitRecord = {
      ...result,
      id: res.id,
      title: meta.title,
      participants: meta.participants,
      description: meta.description,
      invoiceImageUri: res.invoiceImageUrl ?? meta.invoiceImageUri,
      paidBy: meta.paidBy,
      groupId: meta.groupId,
      createdAt: new Date().toISOString(),
    };
    // Optimistic insert (or replace when editing), then reconcile from server.
    setSplits((prev) => [record, ...prev.filter((s) => s.id !== record.id)]);
    refresh();
    return record;
  }, [refresh]);

  const removeSplit = useCallback(async (id: string) => {
    setSplits((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteSplitRemote(id);
    } catch {
      // optimistic; a later refresh reconciles
    }
  }, []);

  const reset = useCallback(() => setSplits([]), []);

  const getSplit = useCallback((id: string) => splits.find((s) => s.id === id), [splits]);

  const value = useMemo<SplitsValue>(
    () => ({ splits, hydrated, saveSplit, removeSplit, getSplit, refresh, reset }),
    [splits, hydrated, saveSplit, removeSplit, getSplit, refresh, reset],
  );

  return <SplitsContext.Provider value={value}>{children}</SplitsContext.Provider>;
}

export function useSplits(): SplitsValue {
  const ctx = useContext(SplitsContext);
  if (!ctx) throw new Error('useSplits must be used within a SplitsProvider');
  return ctx;
}
