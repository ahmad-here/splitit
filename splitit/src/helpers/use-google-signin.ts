/**
 * "Continue with Google" for the Firebase JS SDK. expo-auth-session obtains a
 * Google id_token, which we hand to the auth store to exchange for a Firebase
 * session. Returns a ready flag + a prompt() to trigger the flow. No-op (ready
 * false) until EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is set.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

import { googleAuth, isGoogleConfigured } from '@/config/env';
import { useAuth } from '@/store/auth-store';
import { toast } from '@/utils/toast';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleSignIn() {
  const { signInWithGoogleIdToken } = useAuth();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleAuth.webClientId || undefined,
    iosClientId: googleAuth.iosClientId || undefined,
    androidClientId: googleAuth.androidClientId || undefined,
  });

  // Print the exact redirect URI so it can be whitelisted in the Google Cloud
  // OAuth client (fixes Error 400: redirect_uri_mismatch). Add this value to the
  // matching OAuth client's "Authorized redirect URIs".
  useEffect(() => {
    if (request?.redirectUri) {
      console.log('[GoogleSignIn] redirect URI to whitelist:', request.redirectUri);
    }
  }, [request?.redirectUri]);

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params?.id_token;
    if (!idToken) return;
    signInWithGoogleIdToken(idToken).catch((err) =>
      toast.error('Google sign-in failed', err instanceof Error ? err.message : undefined),
    );
  }, [response, signInWithGoogleIdToken]);

  return {
    available: isGoogleConfigured && !!request,
    prompt: () => promptAsync(),
  };
}
