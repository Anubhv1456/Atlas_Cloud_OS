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
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      helpfulBy: Array.isArray(data.helpfulBy) ? data.helpfulBy : [],
      notHelpfulBy: Array.isArray(data.notHelpfulBy) ? data.notHelpfulBy : [],
      savedBy: Array.isArray(data.savedBy) ? data.savedBy : [],
      reportedBy: Array.isArray(data.reportedBy) ? data.reportedBy : [],
    } as Marker;
  });
}

export async function updateMarkerStatusAdmin(markerId: string, status: MarkerStatus) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const markerRef = doc(firestoreDb, 'insights', markerId);
  await updateDoc(markerRef, { status });
}

export async function updateUserBetaAccess(userId: string, betaAccess: boolean, durationDays?: number | null) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const userRef = doc(firestoreDb, 'users', userId);
  if (betaAccess) {
    const now = Date.now();
    const betaAccessExpiresAt = durationDays ? now + durationDays * 24 * 60 * 60 * 1000 : null;
    await setDoc(userRef, {
      betaAccess: true,
      betaAccessExpiresAt,
      betaGrantedAt: new Date()
    }, { merge: true });
  } else {
    await setDoc(userRef, {
      betaAccess: false,
      betaAccessExpiresAt: null
    }, { merge: true });
  }
}

export async function bulkUpdateUserBetaAccess(userIds: string[], betaAccess: boolean, durationDays?: number | null) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const now = Date.now();
  const promises = userIds.map(userId => {
    const userRef = doc(firestoreDb, 'users', userId);
    if (betaAccess) {
      const betaAccessExpiresAt = durationDays ? now + durationDays * 24 * 60 * 60 * 1000 : null;
      return setDoc(userRef, {
        betaAccess: true,
        betaAccessExpiresAt,
        betaGrantedAt: new Date()
      }, { merge: true });
    } else {
      return setDoc(userRef, {
        betaAccess: false,
        betaAccessExpiresAt: null
      }, { merge: true });
    }
  });
  await Promise.all(promises);
}


export async function deleteUserAsAdmin(userId: string) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const { deleteDoc } = await import("firebase/firestore");
  const userRef = doc(firestoreDb, "users", userId);
  await deleteDoc(userRef);
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
  aiInsights: boolean;
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  if (!firestoreDb) return { communityMarkers: true, markerSubmission: true, markerVisibility: true, payments: false, aiInsights: true };
  const docRef = doc(firestoreDb, 'config', 'featureFlags');
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { aiInsights: true, ...snapshot.data() } as FeatureFlags;
  }
  return { communityMarkers: true, markerSubmission: true, markerVisibility: true, payments: false, aiInsights: true };
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

// Payment Submissions Management
export interface PaymentSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  upiReference: string;
  proofUrl: string;
  amount: number;
  plan: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  rejectionNote?: string;
}

export async function submitPaymentProof(data: {
  userId: string;
  userEmail: string;
  userName?: string;
  upiReference: string;
  proofUrl: string;
  amount?: number;
  plan?: string;
}): Promise<string> {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const { addDoc, serverTimestamp } = await import('firebase/firestore');
  const colRef = collection(firestoreDb, 'payments');

  const payload = {
    userId: data.userId,
    userEmail: data.userEmail,
    userName: data.userName || '',
    upiReference: data.upiReference.trim(),
    proofUrl: data.proofUrl,
    amount: data.amount ?? 499,
    plan: data.plan || 'Closed Beta (3 Months)',
    status: 'pending',
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(colRef, payload);

  // Update user document
  const userRef = doc(firestoreDb, 'users', data.userId);
  await setDoc(userRef, {
    paymentStatus: 'pending',
    pendingPaymentId: docRef.id,
    lastPaymentSubmittedAt: new Date()
  }, { merge: true });

  return docRef.id;
}

export interface PaymentConfig {
  planTitle: string;
  price: number;
  currencySymbol: string;
  durationText: string;
  durationDays: number;
  upiId: string;
  upiQrUrl: string;
  paymentLinkUrl: string;
  enableUpiTab: boolean;
  enableQrTab: boolean;
  enableLinkTab: boolean;
  instructionsText: string;
  benefits: string[];
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  planTitle: 'Closed Beta Membership',
  price: 499,
  currencySymbol: '₹',
  durationText: '3 Months',
  durationDays: 90,
  upiId: 'atlas@upi',
  upiQrUrl: '',
  paymentLinkUrl: '',
  enableUpiTab: true,
  enableQrTab: true,
  enableLinkTab: true,
  instructionsText: "You're one step away from joining Atlas Closed Beta. Complete your membership payment below. Access is manually reviewed and usually activated within a few hours.",
  benefits: [
    'Full Atlas access',
    'Continuous beta updates',
    'Direct influence on future development'
  ]
};

export async function getPaymentConfig(): Promise<PaymentConfig> {
  if (!firestoreDb) return DEFAULT_PAYMENT_CONFIG;
  try {
    const docRef = doc(firestoreDb, 'config', 'payment_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_PAYMENT_CONFIG, ...snap.data() };
    }
  } catch (e) {
    console.error('Error fetching payment config:', e);
  }
  return DEFAULT_PAYMENT_CONFIG;
}

export async function savePaymentConfig(config: Partial<PaymentConfig>): Promise<void> {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const docRef = doc(firestoreDb, 'config', 'payment_settings');
  await setDoc(docRef, config, { merge: true });
}

export async function getPaymentSubmissions(): Promise<PaymentSubmission[]> {
  if (!firestoreDb) return [];
  const colRef = collection(firestoreDb, 'payments');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(150));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PaymentSubmission));
}

export async function approvePayment(paymentId: string, userId: string, adminEmail?: string, durationDays: number = 90) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  
  // 1. Update Payment doc
  const paymentRef = doc(firestoreDb, 'payments', paymentId);
  await updateDoc(paymentRef, {
    status: 'approved',
    reviewedAt: new Date(),
    reviewedBy: adminEmail || 'admin'
  });

  // 2. Update User doc and Grant Beta Access
  await updateUserBetaAccess(userId, true, durationDays);

  const userRef = doc(firestoreDb, 'users', userId);
  await setDoc(userRef, {
    paymentStatus: 'approved'
  }, { merge: true });
}

export async function rejectPayment(paymentId: string, userId: string, rejectionNote?: string, adminEmail?: string) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");

  // 1. Update Payment doc
  const paymentRef = doc(firestoreDb, 'payments', paymentId);
  await updateDoc(paymentRef, {
    status: 'rejected',
    rejectionNote: rejectionNote || 'Verification unsuccessful.',
    reviewedAt: new Date(),
    reviewedBy: adminEmail || 'admin'
  });

  // 2. Update User doc
  const userRef = doc(firestoreDb, 'users', userId);
  await setDoc(userRef, {
    paymentStatus: 'rejected',
    paymentRejectionNote: rejectionNote || 'Verification unsuccessful.'
  }, { merge: true });
}


