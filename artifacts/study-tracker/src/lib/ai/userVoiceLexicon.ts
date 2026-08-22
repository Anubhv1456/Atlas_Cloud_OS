/**
 * Local IndexedDB Personal Voice Lexicon Cache
 * 
 * Stores custom phonetic aliases, doctor-specific abbreviations,
 * and frequently transcribed clinical terms on-device.
 */

export interface VoiceLexiconEntry {
  alias: string;            // e.g. "farma", "obg", "psm"
  canonicalSubject: string; // e.g. "Pharmacology", "Obstetrics & Gynaecology"
  frequency: number;
  lastUsedAt: number;
}

const DB_NAME = 'atlas_voice_lexicon_db';
const DB_VERSION = 1;
const STORE_NAME = 'user_voice_lexicon';

class UserVoiceLexiconManager {
  private static instance: UserVoiceLexiconManager;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryCache: Map<string, string> = new Map();

  private constructor() {
    this.init();
  }

  public static getInstance(): UserVoiceLexiconManager {
    if (!UserVoiceLexiconManager.instance) {
      UserVoiceLexiconManager.instance = new UserVoiceLexiconManager();
    }
    return UserVoiceLexiconManager.instance;
  }

  private init(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'alias' });
          store.createIndex('canonicalSubject', 'canonicalSubject', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // Warm memory cache
        this.loadAllIntoMemory(db);
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private loadAllIntoMemory(db: IDBDatabase) {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const entries: VoiceLexiconEntry[] = req.result || [];
        for (const entry of entries) {
          this.memoryCache.set(entry.alias.toLowerCase(), entry.canonicalSubject);
        }
      };
    } catch (err) {
      console.warn('[UserVoiceLexicon] Failed to warm cache:', err);
    }
  }

  /**
   * Fast synchronous lookup from memory cache
   */
  public resolveAlias(spokenWord: string): string | null {
    const clean = spokenWord.toLowerCase().trim();
    return this.memoryCache.get(clean) || null;
  }

  /**
   * Record or boost an alias in local storage
   */
  public async learnAlias(alias: string, canonicalSubject: string): Promise<void> {
    const cleanAlias = alias.toLowerCase().trim();
    if (!cleanAlias || cleanAlias.length < 2) return;

    this.memoryCache.set(cleanAlias, canonicalSubject);

    try {
      const db = await this.init();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const getReq = store.get(cleanAlias);
      getReq.onsuccess = () => {
        const existing: VoiceLexiconEntry = getReq.result || {
          alias: cleanAlias,
          canonicalSubject,
          frequency: 0,
          lastUsedAt: Date.now(),
        };

        existing.canonicalSubject = canonicalSubject;
        existing.frequency += 1;
        existing.lastUsedAt = Date.now();

        store.put(existing);
      };
    } catch (err) {
      console.warn('[UserVoiceLexicon] Failed to persist learned alias:', err);
    }
  }

  /**
   * Get all learned personalized entries
   */
  public async getAllLearnedAliases(): Promise<VoiceLexiconEntry[]> {
    try {
      const db = await this.init();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}

export const userVoiceLexicon = UserVoiceLexiconManager.getInstance();

export function getSpeechLexicon() {
  return userVoiceLexicon;
}
