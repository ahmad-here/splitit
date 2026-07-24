/**
 * "Continue with Google", split by platform:
 *   - Native (Android/iOS): the native Google Sign-In SDK (Google Play Services).
 *     Uses the Android/iOS OAuth client (package + SHA-1) and returns an ID token
 *     directly — no browser redirect, so Google's "invalid_request / secure app
 *     policy" block on the expo-auth-session browser flow doesn't apply.
 *   - Web: expo-auth-session (works in the browser).
 * Both hand the resulting Google ID token to the auth store, which exchanges it
 * for a Firebase session.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { googleAuth, isGoogleConfigured } from '@/config/env';
import { useAuth } from '@/store/auth-store';
import { toast } from '@/utils/toast';

WebBrowser.maybeCompleteAuthSession();

// Native module — require lazily so it isn't pulled into the web bundle.
const NativeGoogleSignin: typeof import('@react-native-google-signin/google-signin') | null =
  Platform.OS === 'web' ? null : require('@react-native-google-signin/google-signin');

let nativeConfigured = false;

export function useGoogleSignIn() {
  const { signInWithGoogleIdToken } = useAuth();

  // Web flow (hook must be called unconditionally; unused on native).
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleAuth.webClientId || undefined,
    iosClientId: googleAuth.iosClientId || undefined,
    androidClientId: googleAuth.androidClientId || undefined,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (idToken) {
      signInWithGoogleIdToken(idToken).catch((err) =>
        toast.error('Google sign-in failed', err instanceof Error ? err.message : undefined),
      );
    }
  }, [response, signInWithGoogleIdToken]);

  // Configure the native SDK once. webClientId is required so the returned ID
  // token's audience matches what Firebase verifies.
  useEffect(() => {
    if (Platform.OS === 'web' || !NativeGoogleSignin || nativeConfigured || !googleAuth.webClientId) return;
    NativeGoogleSignin.GoogleSignin.configure({ webClientId: googleAuth.webClientId });
    nativeConfigured = true;
  }, []);

  async function promptNative() {
    if (!NativeGoogleSignin) return;
    const { GoogleSignin } = NativeGoogleSignin;
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = (await GoogleSignin.signIn()) as {
        idToken?: string | null;
        data?: { idToken?: string | null };
      };
      const idToken = result?.data?.idToken ?? result?.idToken;
      if (!idToken) {
        toast.error('Google sign-in failed', 'No ID token returned.');
        return;
      }
      await signInWithGoogleIdToken(idToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : undefined;
      // User-cancelled is not an error worth surfacing loudly.
      if (msg && /cancel/i.test(msg)) return;
      toast.error('Google sign-in failed', msg);
    }
  }

  return {
    available: isGoogleConfigured && (Platform.OS === 'web' ? !!request : !!NativeGoogleSignin),
    prompt: () => (Platform.OS === 'web' ? promptAsync() : promptNative()),
  };
}
