import { auth, firestoreDb } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
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

  constructor(public name: string) {
    this.ready = new Promise<void>((resolve) => {
      this.readyResolve = resolve;
    });
  }

  public startListener(uid: string) {
    if (this.unsubscribe) this.unsubscribe();
    const q = collection(firestoreDb, `users/${uid}/${this.name}`);
    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let hasChanges = false;
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          // Parse date objects properly
          for (const key in data) {
            if (data[key] && typeof data[key] === 'object' && 'toDate' in data[key]) {
              data[key] = data[key].toDate();
            }
          }

          const docId = String(change.doc.id);
          const incoming = { ...data, id: isNaN(Number(change.doc.id)) ? change.doc.id : Number(change.doc.id) } as T;

          
          // --- MIGRATION LOGIC FOR N:N CLINICAL GRAPH ---
          if (incoming.subjectId && !incoming.subjectIds) {
            incoming.subjectIds = [incoming.subjectId];
          }

          // Track remote HLC logical clock
          if (incoming.hlc) {
            updateHLC(incoming.hlc);
          }
          
          if (change.type === "added" || change.type === "modified") {
            const existing = this.cache.get(docId);
            if (existing) {
              // Perform CRDT / HLC-aware conflict resolution to avoid overwriting newer local edits
              const merged = resolveEntityConflict(existing, incoming);
              this.cache.set(docId, merged as T);
            } else {
              this.cache.set(docId, incoming);
            }
            hasChanges = true;
          }
          if (change.type === "removed") {
            this.cache.delete(docId);
            hasChanges = true;
          }
        });
        if (!this.isInitialLoadDone) {
          this.isInitialLoadDone = true;
          this.readyResolve();
        }
        if (hasChanges) {
          dbEvents.emit('change', this.name);
        }
      },
      (error) => {
        console.warn(`[FirestoreTable:${this.name}] Snapshot listener operating in offline/cache mode:`, error);
        if (!this.isInitialLoadDone) {
          this.isInitialLoadDone = true;
          this.readyResolve();
        }
      }
    );
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
  }

  getCollectionRef() {
    if (!auth.currentUser) throw new Error("Not authenticated");
    return collection(firestoreDb, `users/${auth.currentUser.uid}/${this.name}`);
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

    // Optimistic cache update
    this.cache.set(String(id), cleanPayload as T);
    dbEvents.emit('change', this.name);

    if (auth.currentUser) {
      const docRef = doc(firestoreDb, `users/${auth.currentUser.uid}/${this.name}`, String(id));
      await setDoc(docRef, cleanPayload, { merge: true });
    }
    return id;
  }

  async put(item: T): Promise<string | number> {
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

    // Optimistic cache update
    this.cache.set(String(id), cleanPayload as T);
    dbEvents.emit('change', this.name);

    if (auth.currentUser) {
      const docRef = doc(firestoreDb, `users/${auth.currentUser.uid}/${this.name}`, String(id));
      await setDoc(docRef, cleanPayload, { merge: true });
    }
    return id;
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
        updatedAt: item.updatedAt ? (item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt)) : new Date(),
      };
      if (existing) {
        resolved = resolveEntityConflict(existing, resolved);
      }
      const cleanPayload = sanitizeForFirestore(resolved);
      this.cache.set(String(id), cleanPayload as T);
      resolvedItems.push(cleanPayload);
    });
    dbEvents.emit('change', this.name);

    if (!auth.currentUser) return;
    for (let i = 0; i < resolvedItems.length; i += 400) {
      const batch = writeBatch(firestoreDb);
      const chunk = resolvedItems.slice(i, i + 400);
      chunk.forEach(item => {
        const id = (item as any).id;
        const docRef = doc(firestoreDb, `users/${auth.currentUser!.uid}/${this.name}`, String(id));
        batch.set(docRef, item, { merge: true });
      });
      await batch.commit();
    }
  }

  async bulkPut(items: T[]) {
    if (!items.length) return;
    const resolvedItems: T[] = [];

    items.forEach(item => {
      const id = (item as any).id || generateHLC();
      const existing = this.cache.get(String(id));
      let resolved = {
        ...item,
        id: isNaN(Number(id)) ? id : Number(id),
        hlc: (item as any).hlc || generateHLC(),
        updatedAt: item.updatedAt ? (item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt)) : new Date(),
      };
      if (existing) {
        resolved = resolveEntityConflict(existing, resolved);
      }
      const cleanPayload = sanitizeForFirestore(resolved);
      this.cache.set(String(id), cleanPayload as T);
      resolvedItems.push(cleanPayload);
    });
    dbEvents.emit('change', this.name);

    if (!auth.currentUser) return;
    for (let i = 0; i < resolvedItems.length; i += 400) {
      const batch = writeBatch(firestoreDb);
      const chunk = resolvedItems.slice(i, i + 400);
      chunk.forEach(item => {
        const id = (item as any).id;
        const docRef = doc(firestoreDb, `users/${auth.currentUser!.uid}/${this.name}`, String(id));
        batch.set(docRef, item, { merge: true });
      });
      await batch.commit();
    }
  }

  async update(id: string | number, changes: Partial<T>) {
    const existing = this.cache.get(String(id));
    const nowHlc = (changes as any).hlc || generateHLC();
    const cleanChanges = sanitizeForFirestore({
      ...changes,
      hlc: nowHlc,
      updatedAt: changes.updatedAt ? (changes.updatedAt instanceof Date ? changes.updatedAt : new Date(changes.updatedAt)) : new Date(),
    }, true);

    if (existing) {
      const merged = { ...existing };
      for (const k of Object.keys(cleanChanges)) {
        (merged as any)[k] = cleanChanges[k];
      }
      // Apply conflict-aware safeguard
      const resolved = resolveEntityConflict(existing, merged);
      this.cache.set(String(id), resolved as T);
      dbEvents.emit('change', this.name);
    }

    if (!auth.currentUser) return 1;
    const docRef = doc(firestoreDb, `users/${auth.currentUser.uid}/${this.name}`, String(id));
    await setDoc(docRef, cleanChanges, { merge: true });
    return 1;
  }

  async delete(id: string | number) {
    this.cache.delete(String(id));
    dbEvents.emit('change', this.name);

    if (!auth.currentUser) return;
    const docRef = doc(firestoreDb, `users/${auth.currentUser.uid}/${this.name}`, String(id));
    await deleteDoc(docRef);
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
    if (!auth.currentUser) return;
    try {
      const q = collection(firestoreDb, `users/${auth.currentUser.uid}/${this.name}`);
      const snap = await getDocs(q);
      if (snap.empty) return;
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(firestoreDb);
        docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.error(`Error clearing table ${this.name}:`, e);
    }
  }
}

class AtlasDB {
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
