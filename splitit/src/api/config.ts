/**
 * Backend base URL — sourced ONLY from EXPO_PUBLIC_API_BASE_URL (see
 * src/config/env.ts and splitit/.env.local). It is not user-editable and not
 * persisted anywhere on-device; change it in the env file and rebuild.
 */

import { env } from '@/config/env';

export function getApiBaseUrl(): string {
  const url = env.apiBaseUrl || 'http://localhost:3000';
  return url.replace(/\/$/, '');
}
