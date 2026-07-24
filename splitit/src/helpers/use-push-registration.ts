/**
 * Registers this device for Expo push notifications once the user is signed in,
 * stores the token on the backend, and refreshes the in-app feed when a push
 * arrives or is tapped. Defensive: silently no-ops on simulators / when push
 * isn't available, so it never blocks the app.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { registerPushToken } from '@/api/notifications-client';
import { useAuth } from '@/store/auth-store';
import { useNotifications } from '@/store/notifications-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushRegistration() {
  const { user, emailVerified } = useAuth();
  const { refresh } = useNotifications();
  const active = !!user && emailVerified;

  // Register the device token when the user becomes active.
  useEffect(() => {
    if (!active || !Device.isDevice) return;
    let cancelled = false;

    (async () => {
      try {
        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== 'granted') {
          status = (await Notifications.requestPermissionsAsync()).status;
        }
        if (status !== 'granted') return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
        if (!cancelled && token) await registerPushToken(token);
      } catch {
        // no push on this device/config — fine
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  // Refresh the feed on receipt / tap.
  useEffect(() => {
    if (!active) return;
    const received = Notifications.addNotificationReceivedListener(() => refresh());
    const responded = Notifications.addNotificationResponseReceivedListener(() => refresh());
    return () => {
      received.remove();
      responded.remove();
    };
  }, [active, refresh]);
}
