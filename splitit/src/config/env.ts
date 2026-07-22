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
} as const;
