import { auth, firestoreDb } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query, writeBatch, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { localDb, tabSyncChannel } from './localDb';
class SimpleEventEmitter {
  private listeners: Record<string, Function[]> = {};
  private pendingEvents: Set<string> = new Set();
  private timer: any = null;

  on(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  off(event: string, fn: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== fn);
  }
  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    if (args.length > 0) {
      this.listeners[event].forEach(fn => {
        try { fn(...args); } catch (e) { console.error(e); }
      });
      return;
    }
    // Batch notifications within a 16ms window to prevent live query storms
    this.pendingEvents.add(event);
    if (!this.timer) {
      this.timer = setTimeout(() => {
        const events = Array.from(this.pendingEvents);
        this.pendingEvents.clear();
        this.timer = null;
        for (const ev of events) {
          if (this.listeners[ev]) {
            this.listeners[ev].forEach(fn => {
              try { fn(); } catch (e) { console.error(e); }
            });
          }
        }
      }, 16);
    }
  }
  emitSync(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(fn => {
      try { fn(...args); } catch (e) { console.error(e); }
    });
  }
  setMaxListeners() {}
}
import { generateHLC, updateHLC, resolveEntityConflict, compareHLC } from '@/lib/hlc';
import * as T from './types';

export const dbEvents = new SimpleEventEmitter();
dbEvents.setMaxListeners(100);

function sanitizeForFirestore(obj: any, preserveNullOrUndefinedKeys: boolean = false): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(o => sanitizeForFirestore(o, preserveNullOrUndefinedKeys)).filter(v => v !== undefined);
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        res[key] = sanitizeForFirestore(val, preserveNullOrUndefinedKeys);
      } else if (preserveNullOrUndefinedKeys) {
        res[key] = null;
      }
    }
    return res;
  }
  return obj;
}

class FirestoreTable<T extends Record<string, any>> {
  private cache: Map<string, T> = new Map();
  private unsubscribe: (() => void) | null = null;
  private readyResolve!: () => void;
  public ready: Promise<void>;
  private isInitialLoadDone = false;

  public workspaceSuffix: string = "";

  constructor(public name: string) {
    this.ready = new Promise<void>((resolve) => {
      this.readyResolve = resolve;
    });
    dbEvents.emit('change', this.name);
  }

  public async startListener(uid: string) {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = () => {};

    // Hydrate directly from Dexie localDb
    const localTable = (localDb as any)[this.name];
    if (localTable) {
      try {
        const items = await localTable.toArray();
        this.cache.clear();
        items.forEach((item: any) => {
          // Parse stringified Date objects if necessary
          for (const key in item) {
            if (item[key] && typeof item[key] === 'object' && 'toDate' in item[key]) {
              item[key] = item[key].toDate();
            } else if (item[key] && typeof item[key] === 'string' && (key.endsWith('At') || key === 'timestamp')) {
              const d = new Date(item[key]);
              if (!isNaN(d.getTime())) {
                item[key] = d;
              }
            }
          }

          let itemWorkspace = (item as any)._workspace;
          if (itemWorkspace === undefined) {
            itemWorkspace = getWorkspaceSuffix(item.examProfile);
          }
          if (itemWorkspace === this.workspaceSuffix) {
            this.cache.set(String(item.id), item as T);
          }
        });
      } catch (err) {
        console.error(`[FirestoreTable:${this.name}] Local hydration failed:`, err);
      }
    }

    if (!this.isInitialLoadDone) {
      this.isInitialLoadDone = true;
      this.readyResolve();
    }
    dbEvents.emit('change', this.name);
  }

  public stopListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.cache.clear();
    this.isInitialLoadDone = false;
    this.ready = new Promise<void>((resolve) => {
      this.readyResolve = resolve;
    });
    dbEvents.emit('change', this.name);
  }

  getCollectionRef() {
    if (!auth.currentUser) throw new Error("Not authenticated");
    return collection(firestoreDb, `users/${auth.currentUser.uid}/${this.name}${this.workspaceSuffix}`);
  }

  async toArray(): Promise<T[]> {
    return Array.from(this.cache.values());
  }

  async count(): Promise<number> {
    return this.cache.size;
  }

  async get(id: string | number): Promise<T | undefined> {
    return this.cache.get(String(id));
  }

  async add(item: any): Promise<string | number> {
    const id = (item as any).id || generateHLC();
    const existing = this.cache.get(String(id));
    const hlc = (item as any).hlc || generateHLC();
    
    let resolvedItem = {
      ...item,
      id: isNaN(Number(id)) ? id : Number(id),
      hlc,
      updatedAt: item.updatedAt ? (item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt)) : new Date(),
    };

    if (existing) {
      resolvedItem = resolveEntityConflict(existing, resolvedItem);
    }

    const cleanPayload = sanitizeForFirestore(resolvedItem);
    this.cache.set(String(id), cleanPayload as T);
    dbEvents.emit('change', this.name);

    const localTable = (localDb as any)[this.name];
    if (localTable) {
      await localTable.put(cleanPayload);
    }
    tabSyncChannel.postMessage('invalidate_cache');
    return id;
  }

  async put(item: T): Promise<string | number> {
    return this.add(item);
  }

  async bulkAdd(items: T[]) {
    if (!items.length) return;
    const resolvedItems: T[] = [];

    items.forEach(item => {
      const id = (item as any).id || generateHLC();
      const existing = this.cache.get(String(id));
      let resolved = {
        ...item,
        id: isNaN(Number(id)) ? id : Number(id),
        hlc: (item as any).hlc || generateHLC(),
        _workspace: this.workspaceSuffix,
        updatedAt: item.updatedAt ? (item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt)) : new Date(),
      };
      if (existing) resolved = resolveEntityConflict(existing, resolved);
      const cleanPayload = sanitizeForFirestore(resolved);
      this.cache.set(String(id), cleanPayload as T);
      resolvedItems.push(cleanPayload);
    });
    dbEvents.emit('change', this.name);

    const localTable = (localDb as any)[this.name];
    if (localTable) {
      await localTable.bulkPut(resolvedItems);
    }
    tabSyncChannel.postMessage('invalidate_cache');
  }

  async bulkPut(items: T[]) {
    return this.bulkAdd(items);
  }

  async update(id: string | number, changes: Partial<T>) {
    const existing = this.cache.get(String(id));
    const nowHlc = (changes as any).hlc || generateHLC();
    const cleanChanges = sanitizeForFirestore({
      ...changes,
      hlc: nowHlc,
      _workspace: this.workspaceSuffix,
      updatedAt: changes.updatedAt ? (changes.updatedAt instanceof Date ? changes.updatedAt : new Date(changes.updatedAt)) : new Date(),
    }, true);

    let resolved;
    if (existing) {
      const merged = { ...existing };
      for (const k of Object.keys(cleanChanges)) {
        (merged as any)[k] = cleanChanges[k];
      }
      resolved = resolveEntityConflict(existing, merged);
      this.cache.set(String(id), resolved as T);
      dbEvents.emit('change', this.name);
    } else {
       return 0;
    }

    const localTable = (localDb as any)[this.name];
    if (localTable && resolved) {
      await localTable.put(resolved);
    }
    tabSyncChannel.postMessage('invalidate_cache');
    return 1;
  }

  async delete(id: string | number) {
    this.cache.delete(String(id));
    dbEvents.emit('change', this.name);

    const localTable = (localDb as any)[this.name];
    if (localTable) {
      await localTable.delete(id);
    }
    tabSyncChannel.postMessage('invalidate_cache');
  }

  where(field: string) {
    const matchesValue = (itemVal: any, targetVal: any) => {
      if (itemVal === targetVal) return true;
      if (itemVal !== null && itemVal !== undefined && targetVal !== null && targetVal !== undefined) {
        return String(itemVal) === String(targetVal);
      }
      return false;
    };

    return {
      equals: (value: any) => {
         const getMatchedItems = async () => {
           const all = await this.toArray();
           return all.filter((item: any) => matchesValue(item[field], value));
         };

         return {
            toArray: getMatchedItems,
            filter: (predicate: any) => {
               const getFiltered = async () => {
                 const matched = await getMatchedItems();
                 return matched.filter(predicate);
               };
               return {
                  toArray: getFiltered,
                  modify: async (changes: Partial<T> | ((item: T) => void)): Promise<number> => {
                    const items = await getFiltered();
                    let count = 0;
                    for (const item of items) {
                      const id = (item as any).id;
                      if (id !== undefined && id !== null) {
                        if (typeof changes === 'function') {
                          const cloned = { ...item };
                          changes(cloned);
                          await this.update(id, cloned);
                        } else {
                          await this.update(id, changes);
                        }
                        count++;
                      }
                    }
                    return count;
                  },
                  delete: async (): Promise<number> => {
                    const items = await getFiltered();
                    let count = 0;
                    for (const item of items) {
                      const id = (item as any).id;
                      if (id !== undefined && id !== null) {
                        await this.delete(id);
                        count++;
                      }
                    }
                    return count;
                  }
               };
            },
            modify: async (changes: Partial<T> | ((item: T) => void)): Promise<number> => {
              const items = await getMatchedItems();
              let count = 0;
              for (const item of items) {
                const id = (item as any).id;
                if (id !== undefined && id !== null) {
                  if (typeof changes === 'function') {
                    const cloned = { ...item };
                    changes(cloned);
                    await this.update(id, cloned);
                  } else {
                    await this.update(id, changes);
                  }
                  count++;
                }
              }
              return count;
            },
            delete: async (): Promise<number> => {
              const items = await getMatchedItems();
              let count = 0;
              for (const item of items) {
                const id = (item as any).id;
                if (id !== undefined && id !== null) {
                  await this.delete(id);
                  count++;
                }
              }
              return count;
            }
         };
      },
      between: (lower: any, upper: any, includeLower: boolean = true, includeUpper: boolean = false) => {
         return {
            toArray: async (): Promise<T[]> => {
               const all = await this.toArray();
               return all.filter((item: any) => {
                  const val = item[field];
                  const passLower = includeLower ? val >= lower : val > lower;
                  const passUpper = includeUpper ? val <= upper : val < upper;
                  return passLower && passUpper;
               });
            },
            reverse: () => {
               return {
                  toArray: async (): Promise<T[]> => {
                     const all = await this.toArray();
                     return all.filter((item: any) => {
                        const val = item[field];
                        const passLower = includeLower ? val >= lower : val > lower;
                        const passUpper = includeUpper ? val <= upper : val < upper;
                        return passLower && passUpper;
                     }).sort((a: any, b: any) => (a[field] < b[field] ? 1 : -1));
                  }
               }
            }
         }
      },
      anyOf: (values: any[]) => {
         const getAnyOfItems = async () => {
           const all = await this.toArray();
           return all.filter((item: any) => values.some(val => matchesValue(item[field], val)));
         };

         return {
            toArray: getAnyOfItems,
            filter: (predicate: any) => {
               const getFiltered = async () => {
                 const matched = await getAnyOfItems();
                 return matched.filter(predicate);
               };
               return {
                  toArray: getFiltered,
                  modify: async (changes: Partial<T> | ((item: T) => void)): Promise<number> => {
                    const items = await getFiltered();
                    let count = 0;
                    for (const item of items) {
                      const id = (item as any).id;
                      if (id !== undefined && id !== null) {
                        if (typeof changes === 'function') {
                          const cloned = { ...item };
                          changes(cloned);
                          await this.update(id, cloned);
                        } else {
                          await this.update(id, changes);
                        }
                        count++;
                      }
                    }
                    return count;
                  },
                  delete: async (): Promise<number> => {
                    const items = await getFiltered();
                    let count = 0;
                    for (const item of items) {
                      const id = (item as any).id;
                      if (id !== undefined && id !== null) {
                        await this.delete(id);
                        count++;
                      }
                    }
                    return count;
                  }
               };
            },
            modify: async (changes: Partial<T> | ((item: T) => void)): Promise<number> => {
              const items = await getAnyOfItems();
              let count = 0;
              for (const item of items) {
                const id = (item as any).id;
                if (id !== undefined && id !== null) {
                  if (typeof changes === 'function') {
                    const cloned = { ...item };
                    changes(cloned);
                    await this.update(id, cloned);
                  } else {
                    await this.update(id, changes);
                  }
                  count++;
                }
              }
              return count;
            },
            delete: async (): Promise<number> => {
              const items = await getAnyOfItems();
              let count = 0;
              for (const item of items) {
                const id = (item as any).id;
                if (id !== undefined && id !== null) {
                  await this.delete(id);
                  count++;
                }
              }
              return count;
            }
         };
      }
    };
  }

  filter(predicate: (item: T) => boolean) {
     const getFiltered = async (): Promise<T[]> => {
        const all = await this.toArray();
        return all.filter(predicate);
     };

     return {
        toArray: getFiltered,
        modify: async (changes: Partial<T> | ((item: T) => void)): Promise<number> => {
          const items = await getFiltered();
          let count = 0;
          for (const item of items) {
            const id = (item as any).id;
            if (id !== undefined && id !== null) {
              if (typeof changes === 'function') {
                const cloned = { ...item };
                changes(cloned);
                await this.update(id, cloned);
              } else {
                await this.update(id, changes);
              }
              count++;
            }
          }
          return count;
        },
        delete: async (): Promise<number> => {
          const items = await getFiltered();
          let count = 0;
          for (const item of items) {
            const id = (item as any).id;
            if (id !== undefined && id !== null) {
              await this.delete(id);
              count++;
            }
          }
          return count;
        }
     };
  }

  orderBy(field: string) {
     return {
         toArray: async (): Promise<T[]> => {
            const all = await this.toArray();
            return all.sort((a: any, b: any) => (a[field] > b[field] ? 1 : -1));
         },
         reverse: () => ({
             toArray: async (): Promise<T[]> => {
                 const all = await this.toArray();
                 return all.sort((a: any, b: any) => (a[field] < b[field] ? 1 : -1));
             }
         })
     }
  }

  async each(callback: (item: T) => void) {
     const all = await this.toArray();
     all.forEach(callback);
  }

  async clear() {
    this.cache.clear();
    dbEvents.emit('change', this.name);
    const localTable = (localDb as any)[this.name];
    if (localTable) {
      try {
        await localTable.clear();
      } catch (err) {
        console.error(`Error clearing local table ${this.name}:`, err);
      }
    }
    tabSyncChannel.postMessage('invalidate_cache');
  }
}


export function getWorkspaceSuffix(exam?: string): string {
  if (!exam) return "";
  const lower = exam.toLowerCase();
  if (lower.includes("step 1")) return "_usmle1";
  if (lower.includes("step 2")) return "_usmle2";
  if (lower.includes("usmle")) return "_usmle";
  if (lower.includes("neet") || lower.includes("ini-cet") || lower.includes("inicet")) return "_neetpg";
  if (lower.includes("plab")) return "_plab";
  if (lower.includes("amc")) return "_amc";
  if (lower.includes("mccqe")) return "_mccqe";
  if (lower.includes("custom") || lower.includes("other") || lower.includes("general") || lower.includes("mbbs")) return "_custom";
  return "";
}

class AtlasDB {

  switchWorkspace(exam?: string) {
    const newSuffix = getWorkspaceSuffix(exam);
    const tables = [
      this.subjects, this.systems, this.history, this.pyqYears, this.scoreLogs,
      this.uiPreferences, this.topicProgress, this.curriculumSets, this.revisionSets,
      this.mistakeLogs, this.recommendationSkips, this.operationalModes
    ];
    
    if (this.subjects.workspaceSuffix === newSuffix) return;

    tables.forEach(t => t.stopListener());
    tables.forEach(t => t.workspaceSuffix = newSuffix);
    
    if (auth.currentUser) {
      tables.forEach(t => t.startListener(auth.currentUser!.uid));
    }
  }

  subjects = new FirestoreTable<T.Subject>('subjects');
  systems = new FirestoreTable<T.StudySystem>('systems');
  history = new FirestoreTable<T.HistoryEntry>('history');
  pyqYears = new FirestoreTable<T.PYQYear>('pyqYears');
  scoreLogs = new FirestoreTable<T.ScoreLog>('scoreLogs');
  uiPreferences = new FirestoreTable<T.UIPreference>('uiPreferences');
  topicProgress = new FirestoreTable<T.TopicProgress>('topicProgress');
  curriculumSets = new FirestoreTable<T.CurriculumSet>('curriculumSets');
  revisionSets = new FirestoreTable<T.CurriculumSet>('revisionSets');
  mistakeLogs = new FirestoreTable<T.MistakeLog>('mistakeLogs');
  recommendationSkips = new FirestoreTable<T.RecommendationSkip>('recommendationSkips');
  operationalModes = new FirestoreTable<T.OperationalModeRecord>('operationalModes');

  constructor() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.subjects.startListener(user.uid);
        this.systems.startListener(user.uid);
        this.history.startListener(user.uid);
        this.pyqYears.startListener(user.uid);
        this.scoreLogs.startListener(user.uid);
        this.uiPreferences.startListener(user.uid);
        this.topicProgress.startListener(user.uid);
        this.curriculumSets.startListener(user.uid);
        this.revisionSets.startListener(user.uid);
        this.mistakeLogs.startListener(user.uid);
        this.recommendationSkips.startListener(user.uid);
        this.operationalModes.startListener(user.uid);
      } else {
        this.subjects.stopListener();
        this.systems.stopListener();
        this.history.stopListener();
        this.pyqYears.stopListener();
        this.scoreLogs.stopListener();
        this.uiPreferences.stopListener();
        this.topicProgress.stopListener();
        this.curriculumSets.stopListener();
        this.revisionSets.stopListener();
        this.mistakeLogs.stopListener();
        this.recommendationSkips.stopListener();
        this.operationalModes.stopListener();
      }
    });
  }

  transaction(mode: string, ...args: any[]) {
      const callback = args[args.length - 1];
      return callback();
      return callback();
  }
}

export const db = new AtlasDB();

tabSyncChannel.onmessage = async (event) => {
  if (event.data === 'invalidate_cache') {
    const tables = [
      db.subjects, db.systems, db.history, db.pyqYears, db.scoreLogs,
      db.uiPreferences, db.topicProgress, db.curriculumSets, db.revisionSets,
      db.mistakeLogs, db.recommendationSkips, db.operationalModes
    ];
    if (auth.currentUser) {
      for (const t of tables) {
        await t.startListener(auth.currentUser.uid);
      }
    }
  }
};
