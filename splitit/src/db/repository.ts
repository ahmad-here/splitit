/**
 * Generic collection repository over a StorageAdapter (DIP). Consumers depend on
 * the Repository<T> interface; the concrete factory below is the only place that
 * knows how items are stored.
 */

import type { StorageAdapter } from '@/db/storage-adapter';

export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>;
  save(all: T[]): Promise<void>;
  upsert(item: T): Promise<T[]>;
  remove(id: string): Promise<T[]>;
}

export function createRepository<T extends { id: string }>(adapter: StorageAdapter, key: string): Repository<T> {
  return {
    list() {
      return adapter.getJSON<T[]>(key, []);
    },
    async save(all) {
      await adapter.setJSON(key, all);
    },
    async upsert(item) {
      const all = await adapter.getJSON<T[]>(key, []);
      const idx = all.findIndex((x) => x.id === item.id);
      if (idx >= 0) all[idx] = item;
      else all.unshift(item);
      await adapter.setJSON(key, all);
      return all;
    },
    async remove(id) {
      const all = (await adapter.getJSON<T[]>(key, [])).filter((x) => x.id !== id);
      await adapter.setJSON(key, all);
      return all;
    },
  };
}
