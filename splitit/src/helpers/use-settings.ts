/**
 * Settings-screen logic: theme mode + the user's shareable friend code.
 * (App data lives on the backend, so the old local "clear app data" flow is gone.)
 */

import { useCallback, useEffect, useState } from 'react';

import { getMyProfile } from '@/api/members-client';
import { useAuth } from '@/store/auth-store';
import { useThemeMode } from '@/store/theme-context';

export function useSettings() {
  const { mode, setMode } = useThemeMode();
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

  const loadCode = useCallback(async () => {
    if (!user) return;
    setLoadingCode(true);
    setCodeError(null);
    try {
      const profile = await getMyProfile();
      setCode(profile.friendCode);
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Could not load your code.');
    } finally {
      setLoadingCode(false);
    }
  }, [user]);

  // Fetch when the user becomes available (and retry if it changes).
  useEffect(() => {
    loadCode();
  }, [loadCode]);

  return { mode, setMode, code, codeError, loadingCode, reloadCode: loadCode };
}
