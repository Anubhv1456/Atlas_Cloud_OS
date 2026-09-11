import { firestoreDb } from './firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, doc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

export type MarkerType = 'clinical_pearl' | 'mnemonic' | 'pitfall' | 'resource' | 'high_yield' | 'memory_trick';
export type MarkerStatus = 'pending' | 'published' | 'trusted' | 'featured' | 'low_quality' | 'archived';

export interface MarkerSubmission {
  subjectId: number;
  systemId: number | string;
  topicId?: string;
  subjectName: string;
  systemName: string;
  topicName?: string;
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
  
  const payload: Record<string, any> = {
    subjectId: marker.subjectId,
    systemId: marker.systemId,
    topicId: marker.topicId || null,
    subjectName: marker.subjectName || '',
    systemName: marker.systemName || '',
    topicName: marker.topicName || '',
    type: marker.type || 'clinical_pearl',
    content: marker.content,
    userId: marker.userId || null,
    authorAlias: marker.authorAlias || 'Wayfinder',
    usefulCount: 0,
    helpfulBy: [],
    savedBy: [],
    notHelpfulBy: [],
    reportedBy: [],
    readCount: 0,
    qualityScore: 50,
    status: 'published', // Published for instant peer access
    createdAt: serverTimestamp(),
  };

  if (marker.source && marker.source.trim()) {
    payload.source = marker.source.trim();
  }

  await addDoc(markersCol, payload);
}

export async function interactWithMarker(
  markerId: string,
  userId: string,
  action: 'helpful' | 'save' | 'report' | 'read' | 'not_helpful'
) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const markerRef = doc(firestoreDb, 'insights', markerId);
  const snapshot = await getDoc(markerRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  let updates: any = {};
  let currentScore = typeof data.qualityScore === 'number' ? data.qualityScore : 50;

  if (action === 'helpful') {
    const helpfulBy = Array.isArray(data.helpfulBy) ? data.helpfulBy : [];
    if (!helpfulBy.includes(userId)) {
      updates.helpfulBy = arrayUnion(userId);
      updates.usefulCount = increment(1);
      currentScore += 5;
    } else {
      // Toggle off verification
      updates.helpfulBy = arrayRemove(userId);
      updates.usefulCount = increment(-1);
      currentScore -= 5;
    }
  } else if (action === 'save') {
    const savedBy = Array.isArray(data.savedBy) ? data.savedBy : [];
    if (!savedBy.includes(userId)) {
      updates.savedBy = arrayUnion(userId);
      currentScore += 3;
    } else {
      updates.savedBy = arrayRemove(userId);
      currentScore -= 3;
    }
  } else if (action === 'report') {
    const reportedBy = Array.isArray(data.reportedBy) ? data.reportedBy : [];
    if (!reportedBy.includes(userId)) {
      updates.reportedBy = arrayUnion(userId);
      currentScore -= 10;
    }
  } else if (action === 'read') {
    updates.readCount = increment(1);
  }

  if (Object.keys(updates).length > 0 || action === 'read') {
    updates.qualityScore = Math.max(0, Math.min(100, currentScore));
    
    // Auto-promote or auto-flag based on peer verifications
    if (updates.qualityScore < 30 && data.status === 'published') {
      updates.status = 'low_quality';
    } else if (updates.qualityScore >= 70 && data.status === 'published') {
      updates.status = 'trusted';
    }

    await updateDoc(markerRef, updates);
  }
  
  return updates;
}

export async function deleteMarker(markerId: string, userId: string): Promise<boolean> {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const markerRef = doc(firestoreDb, 'insights', markerId);
  const snapshot = await getDoc(markerRef);
  if (!snapshot.exists()) return false;

  const data = snapshot.data();
  if (data.userId !== userId) {
    throw new Error("You can only delete your own trail markers.");
  }

  await deleteDoc(markerRef);
  return true;
}

export async function updateOwnMarker(
  markerId: string,
  userId: string,
  content: string,
  source?: string
): Promise<boolean> {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const markerRef = doc(firestoreDb, 'insights', markerId);
  const snapshot = await getDoc(markerRef);
  if (!snapshot.exists()) return false;

  const data = snapshot.data();
  if (data.userId !== userId) {
    throw new Error("You can only edit your own trail markers.");
  }

  const updates: Record<string, any> = {
    content: content.trim(),
  };
  if (source !== undefined) {
    updates.source = source.trim();
  }

  await updateDoc(markerRef, updates);
  return true;
}

export async function getTopicMarkerCounts(systemId: number | string): Promise<Record<string, number>> {
  if (!firestoreDb) return {};
  const markers = await getMarkersForSystem(systemId);
  const counts: Record<string, number> = {};
  for (const m of markers) {
    if (m.topicId) {
      counts[m.topicId] = (counts[m.topicId] || 0) + 1;
    }
  }
  return counts;
}

export async function getSavedMarkersForUser(userId: string): Promise<Marker[]> {
  if (!firestoreDb) return [];
  const markersCol = collection(firestoreDb, 'insights');
  const q = query(
    markersCol,
    where("savedBy", "array-contains", userId),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    helpfulBy: Array.isArray(doc.data().helpfulBy) ? doc.data().helpfulBy : [],
    savedBy: Array.isArray(doc.data().savedBy) ? doc.data().savedBy : [],
  })) as Marker[];
}

export async function getMarkersForSystem(systemId: number | string): Promise<Marker[]> {
  const cacheKey = `atlas_cache_markers_system_${systemId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < 3600000) { // 1 Hour TTL
        return data;
      }
    }
  } catch (e) {
    console.warn('Error reading system markers cache:', e);
  }

  if (!firestoreDb) return [];
  const markersCol = collection(firestoreDb, 'insights');
  const q = query(
    markersCol, 
    where("systemId", "==", systemId),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  
  const markers = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      helpfulBy: Array.isArray(data.helpfulBy) ? data.helpfulBy : [],
      notHelpfulBy: Array.isArray(data.notHelpfulBy) ? data.notHelpfulBy : [],
      savedBy: Array.isArray(data.savedBy) ? data.savedBy : [],
      reportedBy: Array.isArray(data.reportedBy) ? data.reportedBy : [],
    } as Marker;
  }).filter(m => {
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

  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: markers
    }));
  } catch (e) {
    console.warn('Error setting system markers cache:', e);
  }

  return markers;
}


export async function getMarkersForTopic(topicId: string): Promise<Marker[]> {
  const cacheKey = `atlas_cache_markers_topic_${topicId}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < 3600000) { // 1 Hour TTL
        return data;
      }
    }
  } catch (e) {
    console.warn('Error reading topic markers cache:', e);
  }

  if (!firestoreDb) return [];
  const markersCol = collection(firestoreDb, 'insights');
  const q = query(
    markersCol, 
    where("topicId", "==", topicId),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  
  const markers = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      helpfulBy: Array.isArray(data.helpfulBy) ? data.helpfulBy : [],
      notHelpfulBy: Array.isArray(data.notHelpfulBy) ? data.notHelpfulBy : [],
      savedBy: Array.isArray(data.savedBy) ? data.savedBy : [],
      reportedBy: Array.isArray(data.reportedBy) ? data.reportedBy : [],
    } as Marker;
  }).filter(m => {
    return m.status !== 'archived' && m.status !== 'low_quality';
  });

  markers.sort((a, b) => {
    const scoreA = a.qualityScore || 50;
    const scoreB = b.qualityScore || 50;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });

  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: markers
    }));
  } catch (e) {
    console.warn('Error setting topic markers cache:', e);
  }

  return markers;
}
