import { QueryClient, onlineManager } from '@tanstack/react-query';
import type { Persister, PersistedClient } from '@tanstack/query-persist-client-core';
import { openDB, type IDBPDatabase } from 'idb';

// Sync onlineManager with browser connectivity
onlineManager.setEventListener((setOnline) => {
  const onOnline = () => setOnline(true);
  const onOffline = () => setOnline(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
});

const DB_NAME = 'workout-app-cache';
const STORE_NAME = 'tanstack-query';
const CACHE_KEY = 'persisted-client';
const GC_TIME = 1000 * 60 * 60 * 24; // 24 hours

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: GC_TIME,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    const db = await getDB();
    await db.put(STORE_NAME, client, CACHE_KEY);
  },
  restoreClient: async () => {
    const db = await getDB();
    return await db.get(STORE_NAME, CACHE_KEY);
  },
  removeClient: async () => {
    const db = await getDB();
    await db.delete(STORE_NAME, CACHE_KEY);
  },
};
