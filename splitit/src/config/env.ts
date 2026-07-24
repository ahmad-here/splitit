/**
 * Typed, centralized access to public build-time configuration.
 *
 * Expo inlines any variable prefixed EXPO_PUBLIC_ from splitit/.env(.local) into
 * the JS bundle at build time. These values are therefore NOT secret — never put
 * API keys or other secrets here (those live only on the server's .env.local).
 * Add crucial front-end config as EXPO_PUBLIC_* and expose it through this file
 * so the rest of the app reads config from one place.
 */

function readString(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  return v && v.length > 0 ? v : fallback;
}

export const env = {
  /** Backend base URL. Empty string means "auto-detect the Metro LAN host". */
  apiBaseUrl: readString(process.env.EXPO_PUBLIC_API_BASE_URL, ''),
  /** Currency symbol/prefix used across the UI. */
  currency: readString(process.env.EXPO_PUBLIC_CURRENCY, 'Rs '),

  /** Firebase web app config (Console → Project settings → Your apps → Web). */
  firebase: {
    apiKey: readString(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, ''),
    authDomain: readString(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, ''),
    projectId: readString(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, ''),
    storageBucket: readString(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, ''),
    messagingSenderId: readString(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, ''),
    appId: readString(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, ''),
  },
} as const;

/** True once the Firebase web config has been provided. */
export const isFirebaseConfigured = env.firebase.apiKey.length > 0 && env.firebase.projectId.length > 0;

/**
 * Google OAuth client IDs for "Continue with Google" (expo-auth-session).
 * Web client id is created automatically when Google sign-in is enabled in
 * Firebase; native ids come from Google Cloud console OAuth credentials.
 */
export const googleAuth = {
  webClientId: readString(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, ''),
  iosClientId: readString(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, ''),
  androidClientId: readString(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, ''),
} as const;

export const isGoogleConfigured = googleAuth.webClientId.length > 0;
