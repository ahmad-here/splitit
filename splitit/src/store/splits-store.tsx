/**
 * Splits (bill history) domain store.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { SplitRecord, SplitResult } from '@/db/models';
import { splitsRepo } from '@/db/repositories';
import { makeId } from '@/db/storage';

export type SaveSplitMeta = {
  title: string;
  participants: string[];
  description?: string;
  invoiceImageUri?: string;
  paidBy?: string;
  groupId?: string;
  id?: string;
};

type SplitsValue = {
  splits: SplitRecord[];
  saveSplit: (result: SplitResult, meta: SaveSplitMeta) => Promise<SplitRecord>;
  removeSplit: (id: string) => Promise<void>;
  clearSplits: () => Promise<void>;
  getSplit: (id: string) => SplitRecord | undefined;
  reset: () => void;
};

const SplitsContext = createContext<SplitsValue | undefined>(undefined);

export function SplitsProvider({ children }: { children: React.ReactNode }) {
  const [splits, setSplits] = useState<SplitRecord[]>([]);

  useEffect(() => {
    splitsRepo.list().then(setSplits);
  }, []);

  const saveSplit = useCallback(async (result: SplitResult, meta: SaveSplitMeta) => {
    const record: SplitRecord = {
      ...result,
      id: meta.id ?? makeId('sp'),
      title: meta.title,
      participants: meta.participants,
      description: meta.description,
      invoiceImageUri: meta.invoiceImageUri,
      paidBy: meta.paidBy,
      groupId: meta.groupId,
      createdAt: new Date().toISOString(),
    };
    setSplits(await splitsRepo.upsert(record));
    return record;
  }, []);

  const removeSplit = useCallback(async (id: string) => {
    setSplits(await splitsRepo.remove(id));
  }, []);

  const clearSplits = useCallback(async () => {
    await splitsRepo.save([]);
    setSplits([]);
  }, []);

  const reset = useCallback(() => setSplits([]), []);

  const getSplit = useCallback((id: string) => splits.find((s) => s.id === id), [splits]);

  const value = useMemo<SplitsValue>(
    () => ({ splits, saveSplit, removeSplit, clearSplits, getSplit, reset }),
    [splits, saveSplit, removeSplit, clearSplits, getSplit, reset],
  );

  return <SplitsContext.Provider value={value}>{children}</SplitsContext.Provider>;
}

export function useSplits(): SplitsValue {
  const ctx = useContext(SplitsContext);
  if (!ctx) throw new Error('useSplits must be used within a SplitsProvider');
  return ctx;
}
