/** Saved-split detail logic: look up the split, share it, delete it (confirmed). */

import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

import type { SplitRecord } from '@/db/models';
import { useSplits } from '@/store/splits-store';
import { shareSplit } from '@/utils/share';
import { toast } from '@/utils/toast';

export function useSplitDetail(id: string | undefined) {
  const router = useRouter();
  const { getSplit, removeSplit } = useSplits();

  const split = id ? getSplit(id) : undefined;

  function share() {
    if (!split) return;
    shareSplit(split).catch(() => toast.error('Share failed'));
  }

  function confirmDelete() {
    if (!split) return;
    Alert.alert('Delete split', `Delete “${split.title}”? This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeSplit(split.id);
          toast.success('Split deleted');
          router.back();
        },
      },
    ]);
  }

  return { split: split as SplitRecord | undefined, share, confirmDelete };
}
