/**
 * StorageAdapter is the single seam between the app and its persistence engine
 * (DIP). Repositories depend on THIS interface, not on AsyncStorage, so it can
 * be swapped for SQLite or an in-memory adapter (for tests) without touching
 * repositories, the store, or screens.
 *
 * LSP contract — every adapter MUST honour this so substitutes are safe:
 *   - getJSON resolves to `fallback` on a missing OR unparseable key; it never
 *     rejects/throws.
 *   - setJSON / remove persist and resolve; they may reject only on a genuine
 *     hardware/IO failure.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageAdapter {
  getJSON<T>(key: string, fallback: T): Promise<T>;
  setJSON<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Default adapter backed by React Native AsyncStorage. */
export const asyncStorageAdapter: StorageAdapter = {
  async getJSON<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  async setJSON<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
