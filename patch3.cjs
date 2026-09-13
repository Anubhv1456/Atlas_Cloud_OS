const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/admin.ts';
let code = fs.readFileSync(file, 'utf8');

const targetCallServerless = `async function callServerlessAdminApi<T = any>(
  action: string,
  methodOrPayload: 'GET' | 'POST' | Record<string, any> = 'POST',
  optionalPayload?: Record<string, any>
): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Unauthenticated: An active administrator session is required.');
  }

  let method: 'GET' | 'POST' = 'POST';`;
  
const newCallServerless = `async function callServerlessAdminApi<T = any>(
  action: string,
  methodOrPayload: 'GET' | 'POST' | Record<string, any> = 'POST',
  optionalPayload?: Record<string, any>
): Promise<T> {
  throw new Error('Serverless API removed, forcing client fallback.');
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Unauthenticated: An active administrator session is required.');
  }

  let method: 'GET' | 'POST' = 'POST';`;

code = code.replace(targetCallServerless, newCallServerless);

const targetBottom = `export async function listStaffUsersAdmin(): Promise<StaffUserEntity[]> {
  const res = await callServerlessAdminApi<{ staff: StaffUserEntity[] }>('list-staff', 'GET');
  return res?.staff ?? [];
}

export async function setStaffRoleAdmin(
  targetUid: string,
  newRole: StaffRole,
  targetEmail?: string
): Promise<{ success: boolean }> {
  return await callServerlessAdminApi<{ success: boolean }>('set-role', 'POST', {
    targetUid,
    newRole,
    targetEmail,
  });
}

export async function reconcileAdminAccessAdmin(): Promise<{ success: boolean; message: string }> {
  return await callServerlessAdminApi<{ success: boolean; message: string }>('reconcile-admin-access', 'POST');
}

export async function listAdminAuditLogs(): Promise<AdminAuditLogEntity[]> {
  const res = await callServerlessAdminApi<{ logs: AdminAuditLogEntity[] }>('list-audit-logs', 'GET');
  return res?.logs ?? [];
}`;

const newBottom = `export async function listStaffUsersAdmin(): Promise<StaffUserEntity[]> {
  if (!firestoreDb) return [];
  const colRef = collection(firestoreDb, 'admins');
  const snap = await getDocs(colRef);
  return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as StaffUserEntity));
}

export async function setStaffRoleAdmin(
  targetUid: string,
  newRole: StaffRole,
  targetEmail?: string
): Promise<{ success: boolean }> {
  if (!firestoreDb) return { success: false };
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(firestoreDb);
  
  const isStaff = newRole !== 'student';
  const userRef = doc(firestoreDb, 'users', targetUid);
  const adminRef = doc(firestoreDb, 'admins', targetUid);
  const auditRef = doc(collection(firestoreDb, 'adminAuditLogs'));

  batch.set(userRef, { role: newRole, isAdmin: isStaff }, { merge: true });
  
  if (isStaff) {
    batch.set(adminRef, { uid: targetUid, role: newRole, email: targetEmail || '' }, { merge: true });
  } else {
    batch.delete(adminRef);
  }
  
  batch.set(auditRef, {
    action: 'set_staff_role',
    performedBy: auth.currentUser?.uid || 'unknown',
    targetUid,
    timestamp: new Date().toISOString(),
    details: { newRole }
  });
  
  await batch.commit();
  return { success: true };
}

export async function reconcileAdminAccessAdmin(): Promise<{ success: boolean; message: string }> {
  if (!firestoreDb) return { success: false, message: 'No firestore' };
  const targetUid = auth.currentUser?.uid;
  if (!targetUid) return { success: false, message: 'No auth' };
  const userRef = doc(firestoreDb, 'users', targetUid);
  await setDoc(userRef, { role: 'superadmin', isAdmin: true }, { merge: true });
  return { success: true, message: 'Reconciled' };
}

export async function listAdminAuditLogs(): Promise<AdminAuditLogEntity[]> {
  if (!firestoreDb) return [];
  const colRef = collection(firestoreDb, 'adminAuditLogs');
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminAuditLogEntity));
}`;

code = code.replace(targetBottom, newBottom);
fs.writeFileSync(file, code);
