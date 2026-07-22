/**
 * Holds the in-progress split ("draft") as the user moves through the
 * Upload -> Result -> Edit flow, so large objects don't travel through route
 * params. Cleared once a split is saved or the flow is abandoned.
 */

import { createContext, useContext, useMemo, useState } from 'react';

import type { SplitResult } from '@/db/models';

export type SplitDraft = {
  result: SplitResult;
  participants: string[];
  description?: string;
  invoiceImageUri?: string;
  title: string;
  paidBy?: string;
  groupId?: string;
  /** Set when editing an existing saved split. */
  recordId?: string;
};

type FlowContextValue = {
  draft: SplitDraft | null;
  setDraft: (draft: SplitDraft | null) => void;
  updateResult: (result: SplitResult) => void;
};

const FlowContext = createContext<FlowContextValue | undefined>(undefined);

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<SplitDraft | null>(null);

  const updateResult = (result: SplitResult) => {
    setDraft((prev) => (prev ? { ...prev, result } : prev));
  };

  const value = useMemo(() => ({ draft, setDraft, updateResult }), [draft]);
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within a FlowProvider');
  return ctx;
}
