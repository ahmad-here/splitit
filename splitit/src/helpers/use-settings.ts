/**
 * Settings-screen logic: theme mode, backend URL, and the "clear app data" flow
 * gated by optional device lock-screen auth.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

import { useClearAllData } from '@/store/app-store';
import { useThemeMode } from '@/store/theme-context';
import { toast } from '@/utils/toast';

export function useSettings() {
  const { mode, setMode } = useThemeMode();
  const clearAllData = useClearAllData();

  /** Require device lock-screen auth *only if* the user has it set up. */
  async function ensureAuthorized(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !enrolled) return true; // no lock screen — allow without auth
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Authenticate to clear all app data' });
      return res.success;
    } catch {
      return true; // never hard-block on an unexpected auth error
    }
  }

  function confirmClearData() {
    Alert.alert(
      'Clear app data',
      'This permanently deletes all members, splits and payments stored on this device. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear data',
          style: 'destructive',
          onPress: async () => {
            const ok = await ensureAuthorized();
            if (!ok) {
              toast.error('Authentication failed');
              return;
            }
            await clearAllData();
            toast.success('App data cleared');
          },
        },
      ],
    );
  }

  return { mode, setMode, confirmClearData };
}
