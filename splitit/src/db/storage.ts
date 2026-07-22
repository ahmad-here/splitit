/**
 * Storage keys and id generation. Read/write goes through the StorageAdapter
 * (see storage-adapter.ts) and repositories (repository.ts) — screens/stores
 * never touch a storage engine directly.
 */

/** Simple, dependency-free id generator (no crypto/uuid needed on-device). */
export function makeId(prefix = 'id'): string {
  const rand = Math.floor(Math.random() * 1e9).toString(36);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${rand}`;
}

export const StorageKeys = {
  friends: 'splitit.friends',
  groups: 'splitit.groups',
  splits: 'splitit.splits',
  payments: 'splitit.payments',
} as const;
