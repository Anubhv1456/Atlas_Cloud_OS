import { firestoreDb } from './firebase';
import { collection, query, getDocs, limit, doc, updateDoc, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { Marker, MarkerStatus } from './markers';

export async function getAllMarkersForAdmin(): Promise<Marker[]> {
  if (!firestoreDb) return [];
  const markersCol = collection(firestoreDb, 'insights');
  // Order by createdAt descending
  const q = query(
    markersCol,
    orderBy('createdAt', 'desc'),
    limit(200)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Marker));
}

export async function updateMarkerStatusAdmin(markerId: string, status: MarkerStatus) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const markerRef = doc(firestoreDb, 'insights', markerId);
  await updateDoc(markerRef, { status });
}

export async function getAllUsersForAdmin() {
  if (!firestoreDb) return [];
  const usersCol = collection(firestoreDb, 'users');
  const q = query(usersCol, limit(100));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function getDashboardStats() {
  if (!firestoreDb) return { users: 0, signups: 0, pendingMarkers: 0, reportedMarkers: 0 };
  
  // Real implementation would use aggregation queries, but for now we'll do client-side filtering on small sets
  // or just return placeholders/estimates based on full fetches if small.
  // We'll fetch markers and users.
  
  const users = await getAllUsersForAdmin();
  const markers = await getAllMarkersForAdmin();
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const signups = users.filter(u => {
    const createdAt = (u as any).createdAt?.toDate?.() || new Date(0);
    return createdAt >= today;
  }).length;
  
  const pendingMarkers = markers.filter(m => m.status === 'pending').length;
  const reportedMarkers = markers.filter(m => (m.reportedBy || []).length > 0).length;
  
  return {
    users: users.length,
    signups,
    pendingMarkers,
    reportedMarkers
  };
}

export interface FeatureFlags {
  communityMarkers: boolean;
  markerSubmission: boolean;
  markerVisibility: boolean;
  payments: boolean;
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (!firestoreDb) return { communityMarkers: true, markerSubmission: true, markerVisibility: true, payments: false };
  const docRef = doc(firestoreDb, 'config', 'featureFlags');
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as FeatureFlags;
  }
  return { communityMarkers: true, markerSubmission: true, markerVisibility: true, payments: false };
}

export async function setFeatureFlags(flags: FeatureFlags) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const docRef = doc(firestoreDb, 'config', 'featureFlags');
  await setDoc(docRef, flags, { merge: true });
}

export interface Announcement {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  active: boolean;
  createdAt: any;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  if (!firestoreDb) return [];
  const colRef = collection(firestoreDb, 'config', 'app', 'announcements');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
}

export async function setAnnouncementActive(id: string, active: boolean) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const docRef = doc(firestoreDb, 'config', 'app', 'announcements', id);
  await updateDoc(docRef, { active });
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const colRef = collection(firestoreDb, 'config', 'app', 'announcements');
  const { addDoc, serverTimestamp } = await import('firebase/firestore');
  await addDoc(colRef, {
    ...announcement,
    createdAt: serverTimestamp()
  });
}

// Contact / Support Messages
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: any;
  userId?: string;
}

export async function sendContactMessage(data: Omit<ContactMessage, 'id' | 'status' | 'createdAt'>): Promise<string> {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const colRef = collection(firestoreDb, 'contact_messages');
  const { addDoc, serverTimestamp } = await import('firebase/firestore');

  const payload: Record<string, any> = {
    name: data.name || '',
    email: data.email || '',
    category: data.category || 'General',
    subject: data.subject || '',
    message: data.message || '',
    status: 'unread',
    createdAt: serverTimestamp()
  };

  if (data.userId) {
    payload.userId = data.userId;
  }

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  if (!firestoreDb) return [];
  const colRef = collection(firestoreDb, 'contact_messages');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(200));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ContactMessage));
}

export async function updateContactMessageStatus(id: string, status: ContactMessage['status']) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const docRef = doc(firestoreDb, 'contact_messages', id);
  await updateDoc(docRef, { status });
}

export async function deleteContactMessage(id: string) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const { deleteDoc } = await import('firebase/firestore');
  const docRef = doc(firestoreDb, 'contact_messages', id);
  await deleteDoc(docRef);
}

// Social Media Links Management
export interface SocialLinkData {
  url: string;
  enabled: boolean;
}

export interface SocialLinks {
  twitter?: SocialLinkData;
  discord?: SocialLinkData;
  github?: SocialLinkData;
  linkedin?: SocialLinkData;
  telegram?: SocialLinkData;
  youtube?: SocialLinkData;
  instagram?: SocialLinkData;
}

export async function getSocialLinks(): Promise<SocialLinks> {
  const defaultSocials: SocialLinks = {
    twitter: { url: 'https://twitter.com/atlas_os', enabled: false },
    discord: { url: 'https://discord.gg/atlas', enabled: false },
    github: { url: 'https://github.com/atlas-os', enabled: false },
    linkedin: { url: 'https://linkedin.com/company/atlas-os', enabled: false },
    telegram: { url: 'https://t.me/atlas_study', enabled: false },
    youtube: { url: 'https://youtube.com/@atlas_os', enabled: false },
    instagram: { url: 'https://instagram.com/atlas_med_os', enabled: false },
  };
  if (!firestoreDb) return defaultSocials;
  const docRef = doc(firestoreDb, 'config', 'socials');
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    // Merge defaults to handle missing enabled state from previous schema
    const data = snapshot.data();
    const result: any = { ...defaultSocials };
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'string') {
        result[key] = { url: data[key], enabled: false };
      } else {
        result[key] = data[key];
      }
    }
    return result as SocialLinks;
  }
  return defaultSocials;
}

export async function setSocialLinks(links: SocialLinks) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const docRef = doc(firestoreDb, 'config', 'socials');
  await setDoc(docRef, links, { merge: true });
}

