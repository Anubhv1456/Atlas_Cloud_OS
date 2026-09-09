const fs = require('fs');
const path = '/app/applet/artifacts/study-tracker/src/db/schema.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Add arrayUnion to imports
code = code.replace(
  "import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query, writeBatch } from 'firebase/firestore';",
  "import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query, writeBatch, arrayUnion } from 'firebase/firestore';"
);

// 2. Replace startListener
const startListenerRegex = /public startListener\(uid: string\) \{[\s\S]*?\n  \}\n\n  public stopListener/g;
const startListenerReplacement = `public startListener(uid: string) {
    if (this.unsubscribe) this.unsubscribe();
    const useBuckets = ['history', 'scoreLogs', 'mistakeLogs', 'pyqYears', 'topicProgress'].includes(this.name);
    const collName = useBuckets ? \`\${this.name}_buckets\${this.workspaceSuffix}\` : \`\${this.name}\${this.workspaceSuffix}\`;
    const q = collection(firestoreDb, \`users/\${uid}/\${collName}\`);

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let hasChanges = false;
        snapshot.docChanges().forEach((change) => {
          const docData = change.doc.data();
          const processIncomingItem = (data: any, docId: string) => {
            for (const key in data) {
              if (data[key] && typeof data[key] === 'object' && 'toDate' in data[key]) {
                data[key] = data[key].toDate();
              }
            }
            const incoming = { ...data, id: isNaN(Number(docId)) ? docId : Number(docId) } as T;
            if (incoming.subjectId && !(incoming as any).subjectIds) {
              (incoming as any).subjectIds = [incoming.subjectId];
            }
            if (incoming.hlc) updateHLC(incoming.hlc);
            const resolvedId = String(incoming.id);
            const existing = this.cache.get(resolvedId);
            if (existing) {
              const merged = resolveEntityConflict(existing, incoming);
              if (JSON.stringify(existing) !== JSON.stringify(merged)) {
                this.cache.set(resolvedId, merged as T);
                hasChanges = true;
              }
            } else {
              this.cache.set(resolvedId, incoming);
              hasChanges = true;
            }
          };

          if (useBuckets) {
            if (change.type === "removed") {
              if (docData.entries && Array.isArray(docData.entries)) {
                docData.entries.forEach((e: any) => {
                  this.cache.delete(String(e.id));
                  hasChanges = true;
                });
              }
            } else {
              if (docData.entries && Array.isArray(docData.entries)) {
                docData.entries.forEach((entry: any) => processIncomingItem(entry, entry.id));
              }
            }
          } else {
             if (change.type === "added" || change.type === "modified") {
               processIncomingItem(docData, change.doc.id);
             }
             if (change.type === "removed") {
               this.cache.delete(String(change.doc.id));
               hasChanges = true;
             }
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
        console.warn(\`[FirestoreTable:\${this.name}] Snapshot listener operating in offline/cache mode:\`, error);
        if (!this.isInitialLoadDone) {
          this.isInitialLoadDone = true;
          this.readyResolve();
        }
      }
    );
  }

  public stopListener`;
code = code.replace(startListenerRegex, startListenerReplacement);

// 3. Replace add and put
const addPutRegex = /async add\(item: any\): Promise<string \| number> \{[\s\S]*?return id;\n  \}\n\n  async bulkAdd\(items/g;
const addPutReplacement = `async add(item: any): Promise<string | number> {
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

    if (auth.currentUser) {
      const useBuckets = ['history', 'scoreLogs', 'mistakeLogs', 'pyqYears', 'topicProgress'].includes(this.name);
      if (useBuckets) {
        const d = cleanPayload.completedAt || cleanPayload.timestamp || cleanPayload.createdAt || new Date();
        const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
        const month = dateObj.toISOString().substring(0, 7);
        const collName = \`\${this.name}_buckets\${this.workspaceSuffix}\`;
        const docRef = doc(firestoreDb, \`users/\${auth.currentUser.uid}/\${collName}\`, month);
        await setDoc(docRef, { month, updatedAt: Date.now(), entries: arrayUnion(cleanPayload) }, { merge: true });
      } else {
        const docRef = doc(firestoreDb, \`users/\${auth.currentUser.uid}/\${this.name}\${this.workspaceSuffix}\`, String(id));
        await setDoc(docRef, cleanPayload, { merge: true });
      }
    }
    return id;
  }

  async put(item: T): Promise<string | number> {
    return this.add(item); // Logic identical in our new bucket setup
  }

  async bulkAdd(items`;
code = code.replace(addPutRegex, addPutReplacement);

// 4. Replace bulkAdd and bulkPut
const bulkAddPutRegex = /async bulkAdd\(items: T\[\]\) \{[\s\S]*?await batch\.commit\(\);\n    \}\n  \}\n\n  async update/g;
const bulkAddPutReplacement = `async bulkAdd(items: T[]) {
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
      if (existing) resolved = resolveEntityConflict(existing, resolved);
      const cleanPayload = sanitizeForFirestore(resolved);
      this.cache.set(String(id), cleanPayload as T);
      resolvedItems.push(cleanPayload);
    });
    dbEvents.emit('change', this.name);

    if (!auth.currentUser) return;
    const useBuckets = ['history', 'scoreLogs', 'mistakeLogs', 'pyqYears', 'topicProgress'].includes(this.name);
    
    if (useBuckets) {
      const bucketsToUpdate: Record<string, any[]> = {};
      resolvedItems.forEach(item => {
        const d = (item as any).completedAt || (item as any).timestamp || (item as any).createdAt || new Date();
        const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
        const month = dateObj.toISOString().substring(0, 7);
        if (!bucketsToUpdate[month]) bucketsToUpdate[month] = [];
        bucketsToUpdate[month].push(item);
      });
      
      const batch = writeBatch(firestoreDb);
      for (const [month, entries] of Object.entries(bucketsToUpdate)) {
        const collName = \`\${this.name}_buckets\${this.workspaceSuffix}\`;
        const docRef = doc(firestoreDb, \`users/\${auth.currentUser.uid}/\${collName}\`, month);
        batch.set(docRef, { month, updatedAt: Date.now(), entries: arrayUnion(...entries) }, { merge: true });
      }
      await batch.commit();
    } else {
      for (let i = 0; i < resolvedItems.length; i += 400) {
        const batch = writeBatch(firestoreDb);
        const chunk = resolvedItems.slice(i, i + 400);
        chunk.forEach(item => {
          const id = (item as any).id;
          const docRef = doc(firestoreDb, \`users/\${auth.currentUser.uid}/\${this.name}\${this.workspaceSuffix}\`, String(id));
          batch.set(docRef, item, { merge: true });
        });
        await batch.commit();
      }
    }
  }

  async bulkPut(items: T[]) {
    return this.bulkAdd(items);
  }

  async update`;
code = code.replace(bulkAddPutRegex, bulkAddPutReplacement);

// 5. Replace update and delete
const updateDeleteRegex = /async update\(id: string \| number, changes: Partial<T>\) \{[\s\S]*?await deleteDoc\(docRef\);\n  \}\n\n  where/g;
const updateDeleteReplacement = `async update(id: string | number, changes: Partial<T>) {
    const existing = this.cache.get(String(id));
    const nowHlc = (changes as any).hlc || generateHLC();
    const cleanChanges = sanitizeForFirestore({
      ...changes,
      hlc: nowHlc,
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

    if (!auth.currentUser) return 1;
    const useBuckets = ['history', 'scoreLogs', 'mistakeLogs', 'pyqYears', 'topicProgress'].includes(this.name);
    
    if (useBuckets && resolved) {
      const cleanPayload = sanitizeForFirestore(resolved);
      const d = cleanPayload.completedAt || cleanPayload.timestamp || cleanPayload.createdAt || new Date();
      const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
      const month = dateObj.toISOString().substring(0, 7);
      const collName = \`\${this.name}_buckets\${this.workspaceSuffix}\`;
      const docRef = doc(firestoreDb, \`users/\${auth.currentUser.uid}/\${collName}\`, month);
      await setDoc(docRef, { month, updatedAt: Date.now(), entries: arrayUnion(cleanPayload) }, { merge: true });
    } else {
      const docRef = doc(firestoreDb, \`users/\${auth.currentUser.uid}/\${this.name}\${this.workspaceSuffix}\`, String(id));
      await setDoc(docRef, cleanChanges, { merge: true });
    }
    return 1;
  }

  async delete(id: string | number) {
    const existing = this.cache.get(String(id));
    this.cache.delete(String(id));
    dbEvents.emit('change', this.name);

    if (!auth.currentUser) return;
    const useBuckets = ['history', 'scoreLogs', 'mistakeLogs', 'pyqYears', 'topicProgress'].includes(this.name);
    
    if (useBuckets && existing) {
      const cleanPayload = sanitizeForFirestore({ ...existing, deletedAt: new Date(), updatedAt: new Date(), hlc: generateHLC() });
      const d = cleanPayload.completedAt || cleanPayload.timestamp || cleanPayload.createdAt || new Date();
      const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
      const month = dateObj.toISOString().substring(0, 7);
      const collName = \`\${this.name}_buckets\${this.workspaceSuffix}\`;
      const docRef = doc(firestoreDb, \`users/\${auth.currentUser.uid}/\${collName}\`, month);
      await setDoc(docRef, { month, updatedAt: Date.now(), entries: arrayUnion(cleanPayload) }, { merge: true });
    } else {
      const docRef = doc(firestoreDb, \`users/\${auth.currentUser.uid}/\${this.name}\${this.workspaceSuffix}\`, String(id));
      await deleteDoc(docRef);
    }
  }

  where`;
code = code.replace(updateDeleteRegex, updateDeleteReplacement);

fs.writeFileSync(path, code);
