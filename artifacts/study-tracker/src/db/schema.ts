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
import { generateHLC } from '@/lib/hlc';
import * as T from './types';

export const dbEvents = new SimpleEventEmitter();
dbEvents.setMaxListeners(100);

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore).filter(v => v !== undefined);
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        res[key] = sanitizeForFirestore(val);
      }
    }
    return res;
  }
  return obj;
}

class FirestoreTable<T> {
  private cache: Map<string, T> = new Map();
  private unsubscribe: (() => void) | null = null;

  constructor(public name: string) {}

  public startListener(uid: string) {
    if (this.unsubscribe) this.unsubscribe();
    const q = collection(firestoreDb, `users/${uid}/${this.name}`);
    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          // Parse date objects properly
          for (const key in data) {
            if (data[key] && typeof data[key] === 'object' && 'toDate' in data[key]) {
              data[key] = data[key].toDate();
            }
          }
          
          if (change.type === "added" || change.type === "modified") {
            this.cache.set(change.doc.id, { ...data, id: isNaN(Number(change.doc.id)) ? change.doc.id : Number(change.doc.id) } as T);
          }
          if (change.type === "removed") {
            this.cache.delete(change.doc.id);
          }
        });
        dbEvents.emit('change', this.name);
      },
      (error) => {
        console.warn(`[FirestoreTable:${this.name}] Snapshot listener operating in offline/cache mode:`, error);
      }
    );
  }

  public stopListener() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.cache.clear();
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
    const cleanPayload = sanitizeForFirestore({
      ...item,
      id: isNaN(Number(id)) ? id : Number(id),
      hlc: (item as any).hlc || generateHLC(),
    });

    // Optimistic cache update
    this.cache.set(String(id), cleanPayload as T);
    dbEvents.emit('change', this.name);

    if (auth.currentUser) {
      const docRef = doc(firestoreDb, `users/${auth.currentUser.uid}/${this.name}`, String(id));
      await setDoc(docRef, cleanPayload);
    }
    return id;
  }

  async put(item: T): Promise<string | number> {
    const id = (item as any).id || generateHLC();
    const cleanPayload = sanitizeForFirestore({
      ...item,
      id: isNaN(Number(id)) ? id : Number(id),
      hlc: (item as any).hlc || generateHLC(),
    });

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
    items.forEach(item => {
      const id = (item as any).id || generateHLC();
      const cleanPayload = sanitizeForFirestore({
        ...item,
        id: isNaN(Number(id)) ? id : Number(id),
        hlc: (item as any).hlc || generateHLC(),
      });
      this.cache.set(String(id), cleanPayload as T);
    });
    dbEvents.emit('change', this.name);

    if (!auth.currentUser) return;
    for (let i = 0; i < items.length; i += 400) {
      const batch = writeBatch(firestoreDb);
      const chunk = items.slice(i, i + 400);
      chunk.forEach(item => {
        const id = (item as any).id || generateHLC();
        const docRef = doc(firestoreDb, `users/${auth.currentUser!.uid}/${this.name}`, String(id));
        batch.set(docRef, sanitizeForFirestore({ ...item, id, hlc: (item as any).hlc || generateHLC() }));
      });
      await batch.commit();
    }
  }

  async bulkPut(items: T[]) {
    if (!items.length) return;
    items.forEach(item => {
      const id = (item as any).id || generateHLC();
      const cleanPayload = sanitizeForFirestore({
        ...item,
        id: isNaN(Number(id)) ? id : Number(id),
        hlc: (item as any).hlc || generateHLC(),
      });
      this.cache.set(String(id), cleanPayload as T);
    });
    dbEvents.emit('change', this.name);

    if (!auth.currentUser) return;
    for (let i = 0; i < items.length; i += 400) {
      const batch = writeBatch(firestoreDb);
      const chunk = items.slice(i, i + 400);
      chunk.forEach(item => {
        const id = (item as any).id || generateHLC();
        const docRef = doc(firestoreDb, `users/${auth.currentUser!.uid}/${this.name}`, String(id));
        batch.set(docRef, sanitizeForFirestore({ ...item, id, hlc: (item as any).hlc || generateHLC() }), { merge: true });
      });
      await batch.commit();
    }
  }

  async update(id: string | number, changes: Partial<T>) {
    const existing = this.cache.get(String(id));
    const cleanChanges = sanitizeForFirestore({
      ...changes,
      hlc: (changes as any).hlc || generateHLC(),
    });

    if (existing) {
      this.cache.set(String(id), { ...existing, ...cleanChanges } as T);
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
    return {
      equals: (value: any) => {
         return {
            toArray: async (): Promise<T[]> => {
               const all = await this.toArray();
               return all.filter((item: any) => item[field] === value);
            },
            filter: (predicate: any) => {
               return {
                  toArray: async (): Promise<T[]> => {
                     const all = await this.toArray();
                     return all.filter((item: any) => item[field] === value).filter(predicate);
                  }
               }
            }
         }
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
         return {
            toArray: async (): Promise<T[]> => {
               const all = await this.toArray();
               return all.filter((item: any) => values.includes(item[field]));
            },
            filter: (predicate: any) => {
               return {
                  toArray: async (): Promise<T[]> => {
                     const all = await this.toArray();
                     return all.filter((item: any) => values.includes(item[field])).filter(predicate);
                  }
               }
            }
         }
      }
    }
  }

  filter(predicate: (item: T) => boolean) {
     return {
        toArray: async (): Promise<T[]> => {
           const all = await this.toArray();
           return all.filter(predicate);
        }
     }
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
