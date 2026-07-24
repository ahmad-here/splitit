/** AI Result screen logic: save / edit / share the current draft split. */

import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useFlow } from '@/store/flow-context';
import { useFriends } from '@/store/friends-store';
import { useSplits } from '@/store/splits-store';
import { shareSplit } from '@/utils/share';
import { toast } from '@/utils/toast';

export function useResult() {
  const router = useRouter();
  const { draft, setDraft } = useFlow();
  const { saveSplit } = useSplits();
  const { friends } = useFriends();
  const [saving, setSaving] = useState(false);

  /** Map participant names to linked friend profileIds for server notifications. */
  function participantLinks(names: string[]): Record<string, string> {
    const links: Record<string, string> = {};
    for (const name of names) {
      const friend = friends.find((f) => f.name.toLowerCase() === name.toLowerCase() && f.profileId);
      if (friend?.profileId) links[name] = friend.profileId;
    }
    return links;
  }

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
        participantLinks: participantLinks(draft.participants),
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
