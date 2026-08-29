import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestoreDb } from './firebase';

const ALIAS_PREFIXES = ['Waypoint', 'Navigator', 'Guide', 'Sherpa', 'Pathfinder', 'Seeker', 'Explorer', 'Wanderer'];

export async function getUserAlias(userId: string): Promise<string> {
  const fallbackAlias = `Waypoint ${Math.floor(Math.random() * 900) + 100}`;
  if (!firestoreDb || !userId) return fallbackAlias;
  
  try {
    const userRef = doc(firestoreDb, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data && data.authorAlias) {
        return data.authorAlias;
      }
    }
    
    // Generate a new alias
    const prefix = ALIAS_PREFIXES[Math.floor(Math.random() * ALIAS_PREFIXES.length)];
    const suffix = Math.floor(Math.random() * 900) + 100;
    const newAlias = `${prefix} ${suffix}`;
    
    // Save it
    await setDoc(userRef, { authorAlias: newAlias }, { merge: true });
    
    return newAlias;
  } catch (e) {
    console.warn('Could not fetch or save user alias from Firestore:', e);
    return fallbackAlias;
  }
}

export async function getAISettingsFromFirebase(userId: string) {
  if (!firestoreDb || !userId) return null;
  try {
    const userRef = doc(firestoreDb, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.aiSettings || null;
    }
  } catch (e) {
    console.warn('Could not fetch AI settings from Firestore:', e);
  }
  return null;
}

export async function saveAISettingsToFirebase(userId: string, settings: any) {
  if (!firestoreDb || !userId) return;
  try {
    const userRef = doc(firestoreDb, `users/${userId}`);
    await setDoc(userRef, { aiSettings: settings }, { merge: true });
  } catch (e) {
    console.warn('Could not save AI settings to Firestore:', e);
  }
}
