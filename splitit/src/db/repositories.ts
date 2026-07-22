/**
 * Concrete repositories, wired to the default AsyncStorage adapter. To move the
 * whole app to SQLite (or an in-memory store for tests), swap the adapter here —
 * nothing else changes.
 */

import type { Friend, Group, Payment, SplitRecord } from '@/db/models';
import { createRepository, type Repository } from '@/db/repository';
import { asyncStorageAdapter, type StorageAdapter } from '@/db/storage-adapter';
import { StorageKeys } from '@/db/storage';

const adapter: StorageAdapter = asyncStorageAdapter;

export const friendsRepo: Repository<Friend> = createRepository<Friend>(adapter, StorageKeys.friends);
export const groupsRepo: Repository<Group> = createRepository<Group>(adapter, StorageKeys.groups);
export const splitsRepo: Repository<SplitRecord> = createRepository<SplitRecord>(adapter, StorageKeys.splits);
export const paymentsRepo: Repository<Payment> = createRepository<Payment>(adapter, StorageKeys.payments);

/** Wipe every collection from storage. */
export async function clearAllData(): Promise<void> {
  await Promise.all(Object.values(StorageKeys).map((key) => adapter.remove(key)));
}
