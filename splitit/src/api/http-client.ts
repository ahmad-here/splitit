/**
 * HttpClient abstraction (DIP). API clients depend on this interface rather than
 * calling fetch directly, so transport, base-URL resolution, error parsing (and
 * later: auth headers, retries, timeouts) live in one place and can be mocked in
 * tests. The base URL is injected via getBaseUrl.
 */

import { getApiBaseUrl } from '@/api/config';
import { getIdToken } from '@/store/auth-store';

export interface HttpClient {
  getJson<T>(path: string): Promise<T>;
  postJson<T>(path: string, body: unknown): Promise<T>;
  postForm<T>(path: string, form: FormData): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

/**
 * Common headers: the bearer token when signed in, plus a header that tells
 * ngrok to skip its browser-warning interstitial (harmless on other hosts).
 */
async function baseHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'ngrok-skip-browser-warning': 'true' };
  try {
    const token = await getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // not signed in — send without auth
  }
  return headers;
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Server error (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the status message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export function createHttpClient(getBaseUrl: () => string = getApiBaseUrl): HttpClient {
  return {
    async getJson<T>(path: string): Promise<T> {
      const res = await fetch(`${getBaseUrl()}${path}`, { headers: { ...(await baseHeaders()) } });
      return parse<T>(res);
    },
    async postJson<T>(path: string, body: unknown): Promise<T> {
      const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await baseHeaders()) },
        body: JSON.stringify(body),
      });
      return parse<T>(res);
    },
    async postForm<T>(path: string, form: FormData): Promise<T> {
      // No explicit Content-Type: the runtime sets the multipart boundary.
      const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'POST',
        headers: { ...(await baseHeaders()) },
        body: form,
      });
      return parse<T>(res);
    },
    async delete<T>(path: string): Promise<T> {
      const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'DELETE',
        headers: { ...(await baseHeaders()) },
      });
      return parse<T>(res);
    },
  };
}

/** Default client using the app's configured backend base URL. */
export const httpClient: HttpClient = createHttpClient();
