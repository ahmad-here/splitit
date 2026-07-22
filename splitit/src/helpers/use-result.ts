/** AI Result screen logic: save / edit / share the current draft split. */

import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useFlow } from '@/store/flow-context';
import { useSplits } from '@/store/splits-store';
import { shareSplit } from '@/utils/share';
import { toast } from '@/utils/toast';

export function useResult() {
  const router = useRouter();
  const { draft, setDraft } = useFlow();
  const { saveSplit } = useSplits();
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      await saveSplit(draft.result, {
        id: draft.recordId,
        title: draft.title,
        participants: draft.participants,
        description: draft.description,
        invoiceImageUri: draft.invoiceImageUri,
        paidBy: draft.paidBy,
        groupId: draft.groupId,
      });
      toast.success('Split saved');
      setDraft(null);
      router.dismissAll();
      router.replace('/(tabs)/history');
    } catch {
      toast.error('Could not save the split');
    } finally {
      setSaving(false);
    }
  }

  function edit() {
    router.push('/edit');
  }

  function share() {
    if (!draft) return;
    shareSplit({ ...draft.result, title: draft.title }).catch(() => toast.error('Share failed'));
  }

  return { draft, saving, save, edit, share };
}
