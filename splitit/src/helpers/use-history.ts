/**
 * History-screen logic: expose the splits and the delete / clear-all flows
 * (with confirmation). The screen only renders.
 */

import { Alert } from 'react-native';

import type { SplitRecord } from '@/db/models';
import { useSplits } from '@/store/splits-store';
import { toast } from '@/utils/toast';

export function useHistory() {
  const { splits, removeSplit, clearSplits } = useSplits();

  function confirmDelete(split: SplitRecord) {
    Alert.alert('Delete split', `Delete “${split.title}”? This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeSplit(split.id);
          toast.success('Split deleted');
        },
      },
    ]);
  }

  function confirmClearAll() {
    Alert.alert('Clear all history', `Delete all ${splits.length} splits? This can’t be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          await clearSplits();
          toast.success('History cleared');
        },
      },
    ]);
  }

  return { splits, confirmDelete, confirmClearAll };
}
