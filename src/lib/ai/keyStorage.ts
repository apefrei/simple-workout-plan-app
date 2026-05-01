import type { ProviderName } from './types';

interface StoredKey {
  encryptedKey: string;
  iv: string;
  timestamp: number;
}

const SALT = 'simple-workout-ai-keys';
const ACTIVE_PROVIDER_KEY_PREFIX = 'ai_active_provider_';
const KEY_PREFIX = 'ai_key_';

function storageKey(userId: string, provider: ProviderName): string {
  return `${KEY_PREFIX}${userId}_${provider}`;
}

async function deriveKey(userId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode(SALT), iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(plaintext: string, cryptoKey: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoder.encode(plaintext),
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decrypt(ciphertext: string, ivString: string, cryptoKey: CryptoKey): Promise<string> {
  const encrypted = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivString), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted,
  );
  return new TextDecoder().decode(decrypted);
}

export async function saveApiKey(userId: string, provider: ProviderName, apiKey: string): Promise<void> {
  const cryptoKey = await deriveKey(userId);
  const { ciphertext, iv } = await encrypt(apiKey, cryptoKey);
  const stored: StoredKey = { encryptedKey: ciphertext, iv, timestamp: Date.now() };
  localStorage.setItem(storageKey(userId, provider), JSON.stringify(stored));
}

export async function getApiKey(userId: string, provider: ProviderName): Promise<string | null> {
  const raw = localStorage.getItem(storageKey(userId, provider));
  if (!raw) return null;

  try {
    const stored: StoredKey = JSON.parse(raw);
    const cryptoKey = await deriveKey(userId);
    return await decrypt(stored.encryptedKey, stored.iv, cryptoKey);
  } catch {
    // Corrupted or wrong session — remove invalid entry
    localStorage.removeItem(storageKey(userId, provider));
    return null;
  }
}

export function removeApiKey(userId: string, provider: ProviderName): void {
  localStorage.removeItem(storageKey(userId, provider));
}

export function clearAllKeys(userId: string): void {
  const providers: ProviderName[] = ['claude', 'gemini', 'gpt'];
  for (const provider of providers) {
    localStorage.removeItem(storageKey(userId, provider));
  }
  localStorage.removeItem(`${ACTIVE_PROVIDER_KEY_PREFIX}${userId}`);
}

export function getActiveProvider(userId: string): ProviderName | null {
  return localStorage.getItem(`${ACTIVE_PROVIDER_KEY_PREFIX}${userId}`) as ProviderName | null;
}

export function setActiveProvider(userId: string, provider: ProviderName): void {
  localStorage.setItem(`${ACTIVE_PROVIDER_KEY_PREFIX}${userId}`, provider);
}

export function hasStoredKey(userId: string, provider: ProviderName): boolean {
  return localStorage.getItem(storageKey(userId, provider)) !== null;
}
