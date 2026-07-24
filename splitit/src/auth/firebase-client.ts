/**
 * Firebase app + auth singletons for the app. Auth persists across restarts:
 * AsyncStorage on native, browser localStorage on web. Everything
 * Firebase-specific lives behind this module (and the auth store) — screens
 * never import firebase.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
// getReactNativePersistence is only present in Firebase's React Native build,
// which Metro loads because package-exports resolution is disabled (see
// metro.config.js). The type isn't in the default d.ts, hence the cast.
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';

import { env, isFirebaseConfigured } from '@/config/env';

const getRNPersistence = (firebaseAuth as unknown as {
  getReactNativePersistence?: (storage: unknown) => unknown;
}).getReactNativePersistence;

const app = getApps().length ? getApp() : initializeApp(env.firebase);

/**
 * initializeAuth must run exactly once per platform:
 *   - web: getAuth() uses the browser's default (localStorage) persistence.
 *   - native: initializeAuth with React Native (AsyncStorage) persistence.
 * A hot reload can call this twice, so fall back to getAuth if already set up.
 */
function createAuth(): Auth {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: getRNPersistence ? (getRNPersistence(AsyncStorage) as never) : undefined,
    });
  } catch {
    return getAuth(app);
  }
}

export const firebaseApp = app;
export const firebaseAuthClient: Auth = createAuth();
export { isFirebaseConfigured };
