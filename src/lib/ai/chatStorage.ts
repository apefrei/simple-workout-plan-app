import { openDB, type IDBPDatabase } from 'idb';
import type { ContentPart, ProviderName } from './types';

export interface StoredChatMessage {
  id: string;
  userId: string;
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
  timestamp: number;
  provider?: ProviderName;
}

const DB_NAME = 'workout-app-ai-chat';
const STORE_NAME = 'messages';
const DB_VERSION = 1;
const MAX_MESSAGES_PER_USER = 1000;

function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('userId_timestamp', ['userId', 'timestamp'], { unique: false });
      }
    },
  });
}

export async function saveMessage(message: StoredChatMessage): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, message);
  await pruneMessages(db, message.userId);
}

export async function getMessages(userId: string, limit?: number): Promise<StoredChatMessage[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound([userId, 0], [userId, Infinity]);
  const all = await db.getAllFromIndex(STORE_NAME, 'userId_timestamp', range);

  if (limit && all.length > limit) {
    return all.slice(-limit);
  }
  return all;
}

export async function clearMessages(userId: string): Promise<void> {
  const db = await getDB();
  const range = IDBKeyRange.bound([userId, 0], [userId, Infinity]);
  const keys = await db.getAllKeysFromIndex(STORE_NAME, 'userId_timestamp', range);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const key of keys) {
    tx.store.delete(key);
  }
  await tx.done;
}

export async function deleteMessage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

async function pruneMessages(db: IDBPDatabase, userId: string): Promise<void> {
  const range = IDBKeyRange.bound([userId, 0], [userId, Infinity]);
  const all = await db.getAllFromIndex(STORE_NAME, 'userId_timestamp', range);

  if (all.length <= MAX_MESSAGES_PER_USER) return;

  const toRemove = all.slice(0, all.length - MAX_MESSAGES_PER_USER);
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const msg of toRemove) {
    tx.store.delete(msg.id);
  }
  await tx.done;
}
