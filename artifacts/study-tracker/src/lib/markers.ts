import { firestoreDb } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

export type MarkerType = 'mnemonic' | 'pitfall' | 'high_yield' | 'resource' | 'clinical_pearl' | 'memory_trick';
export type MarkerStatus = 'pending' | 'published' | 'trusted' | 'featured' | 'low_quality' | 'archived';

export interface MarkerSubmission {
  subjectId: number;
  systemId: number | string;
  subjectName: string;
  systemName: string;
  type: MarkerType;
  content: string;
  source?: string;
  userId: string | null;
  authorAlias?: string;
}

export interface Marker extends MarkerSubmission {
  id: string;
  createdAt: any;
  usefulCount?: number;
  helpfulBy?: string[];
  
  // Quality Score fields
  qualityScore?: number;
  status?: MarkerStatus;
  savedBy?: string[];
  notHelpfulBy?: string[];
  reportedBy?: string[];
  readCount?: number;
}

export async function submitMarker(marker: MarkerSubmission) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const markersCol = collection(firestoreDb, 'insights'); 
  
  await addDoc(markersCol, {
    ...marker,
    usefulCount: 0,
    helpfulBy: [],
    savedBy: [],
    notHelpfulBy: [],
    reportedBy: [],
    readCount: 0,
    qualityScore: 50,
    status: 'published', // For V1 preview without an admin dashboard, we set this to published so users can see it immediately.
    createdAt: serverTimestamp(),
  });
}

export async function interactWithMarker(
  markerId: string,
  userId: string,
  action: 'helpful' | 'not_helpful' | 'save' | 'report' | 'read'
) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const markerRef = doc(firestoreDb, 'insights', markerId);
  const snapshot = await getDoc(markerRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  let updates: any = {};
  let currentScore = typeof data.qualityScore === 'number' ? data.qualityScore : 50;

  if (action === 'helpful') {
    const helpfulBy = data.helpfulBy || [];
    const notHelpfulBy = data.notHelpfulBy || [];
    if (!helpfulBy.includes(userId)) {
      updates.helpfulBy = arrayUnion(userId);
      updates.usefulCount = increment(1);
      currentScore += 2;
      
      if (notHelpfulBy.includes(userId)) {
        updates.notHelpfulBy = arrayRemove(userId);
        currentScore += 2;
      }
    }
  } else if (action === 'not_helpful') {
    const notHelpfulBy = data.notHelpfulBy || [];
    const helpfulBy = data.helpfulBy || [];
    if (!notHelpfulBy.includes(userId)) {
      updates.notHelpfulBy = arrayUnion(userId);
      currentScore -= 2;
      
      if (helpfulBy.includes(userId)) {
        updates.helpfulBy = arrayRemove(userId);
        updates.usefulCount = increment(-1);
        currentScore -= 2;
      }
    }
  } else if (action === 'save') {
    const savedBy = data.savedBy || [];
    if (!savedBy.includes(userId)) {
      updates.savedBy = arrayUnion(userId);
      currentScore += 4;
    } else {
      updates.savedBy = arrayRemove(userId);
      currentScore -= 4; // Unsave
    }
  } else if (action === 'report') {
    const reportedBy = data.reportedBy || [];
    if (!reportedBy.includes(userId)) {
      updates.reportedBy = arrayUnion(userId);
      currentScore -= 10;
    }
  } else if (action === 'read') {
    updates.readCount = increment(1);
  }

  if (Object.keys(updates).length > 0 || action === 'read') {
    updates.qualityScore = Math.max(0, Math.min(100, currentScore));
    
    // Auto-hide logic based on score
    if (updates.qualityScore < 30 && data.status === 'published') {
      updates.status = 'low_quality';
    } else if (updates.qualityScore < 10 && data.status !== 'archived') {
      updates.status = 'archived';
    } else if (updates.qualityScore >= 30 && data.status === 'low_quality') {
      updates.status = 'published';
    }

    await updateDoc(markerRef, updates);
  }
  
  return updates;
}

export async function getMarkersForSystem(systemId: number | string): Promise<Marker[]> {
  if (!firestoreDb) return [];
  const markersCol = collection(firestoreDb, 'insights');
  const q = query(
    markersCol, 
    where("systemId", "==", systemId),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  
  const markers = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Marker)).filter(m => {
    // Hide archived or low quality unless it's a direct moderator view, but for now we filter locally
    return m.status !== 'archived' && m.status !== 'low_quality';
  });

  markers.sort((a, b) => {
    // Sort by Quality Score first, then recency
    const scoreA = a.qualityScore || 50;
    const scoreB = b.qualityScore || 50;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  return markers;
}
