/**
 * Persistent content-hash cache for AI responses.
 * Caches LLM compilations, distillations, and autopsies in localStorage/IndexedDB
 * with a 7-day TTL to eliminate duplicate API requests.
 */

export interface CachedAIResponse<T = any> {
  hash: string;
  data: T;
  timestamp: number;
  model: string;
}

const CACHE_PREFIX = 'atlas_ai_cache_';
const CACHE_INDEX_KEY = 'atlas_ai_cache_index';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_ENTRIES = 150;

/**
 * Normalizes prompt text (lowercasing, trimming whitespace, stripping trailing punctuation)
 * to maximize cache hit ratios across similar queries.
 */
export function normalizePromptForCache(prompt: string): string {
  return prompt
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fast synchronous string hash (MurmurHash3-like 64-bit variant)
 */
export function fastContentHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

/**
 * Retrieves an entry from persistent cache if valid and within TTL
 */
export function getCachedAIResponse<T = any>(cacheKey: string, maxAgeMs = DEFAULT_TTL_MS): T | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + cacheKey);
    if (!raw) return null;

    const parsed: CachedAIResponse<T> = JSON.parse(raw);
    const now = Date.now();

    if (now - parsed.timestamp > maxAgeMs) {
      localStorage.removeItem(CACHE_PREFIX + cacheKey);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.warn('[AICache] Failed to read cache entry:', err);
    return null;
  }
}

/**
 * Saves an AI response to persistent storage with automatic LRU eviction
 */
export function setCachedAIResponse<T = any>(cacheKey: string, data: T, model: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const entry: CachedAIResponse<T> = {
      hash: cacheKey,
      data,
      timestamp: Date.now(),
      model,
    };

    localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(entry));

    // Update index for LRU management
    let index: string[] = [];
    const rawIndex = localStorage.getItem(CACHE_INDEX_KEY);
    if (rawIndex) {
      try {
        index = JSON.parse(rawIndex);
      } catch {
        index = [];
      }
    }

    // Move to front
    index = [cacheKey, ...index.filter((k) => k !== cacheKey)];

    // Evict oldest if exceeding capacity
    if (index.length > MAX_CACHE_ENTRIES) {
      const keysToEvict = index.slice(MAX_CACHE_ENTRIES);
      for (const k of keysToEvict) {
        localStorage.removeItem(CACHE_PREFIX + k);
      }
      index = index.slice(0, MAX_CACHE_ENTRIES);
    }

    localStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (err) {
    console.warn('[AICache] Failed to write cache entry:', err);
  }
}

/**
 * Clears all cached AI responses
 */
export function clearAICache(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const rawIndex = localStorage.getItem(CACHE_INDEX_KEY);
    if (rawIndex) {
      const index: string[] = JSON.parse(rawIndex);
      for (const k of index) {
        localStorage.removeItem(CACHE_PREFIX + k);
      }
    }
    localStorage.removeItem(CACHE_INDEX_KEY);
  } catch (err) {
    console.warn('[AICache] Failed to clear cache:', err);
  }
}
