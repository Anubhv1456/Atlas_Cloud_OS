const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/admin.ts';
let code = fs.readFileSync(file, 'utf8');

const targetAmbassador = `export async function approveAmbassadorApplication(applicationId: string, targetUserId: string) {
  return callServerlessAdminApi('approve-ambassador', {
    action: 'approve-ambassador',
    applicationId,
    targetUserId,
  });
}

/**
 * Dispatches ambassador rejection through the serverless admin action boundary.
 */
export async function rejectAmbassadorApplication(applicationId: string) {
  return callServerlessAdminApi('reject-ambassador', {
    action: 'reject-ambassador',
    applicationId,
  });
}`;

const newAmbassador = `export async function approveAmbassadorApplication(applicationId: string, targetUserId: string) {
  if (!firestoreDb) return;
  const appRef = doc(firestoreDb, 'ambassador_applications', applicationId);
  await updateDoc(appRef, { status: 'approved', updatedAt: new Date().toISOString() });
  const userRef = doc(firestoreDb, 'users', targetUserId);
  await updateDoc(userRef, { isAffiliate: true, affiliateCode: \`ambassador_\${targetUserId.slice(0,6)}\` });
}

export async function rejectAmbassadorApplication(applicationId: string) {
  if (!firestoreDb) return;
  const appRef = doc(firestoreDb, 'ambassador_applications', applicationId);
  await updateDoc(appRef, { status: 'rejected', updatedAt: new Date().toISOString() });
}`;

code = code.replace(targetAmbassador, newAmbassador);

const targetInspect = `export async function inspectCandidateVaultServerless(userId: string) {
  return await callServerlessAdminApi('inspect-vault', { targetUserId: userId });
}`;

const newInspect = `export async function inspectCandidateVaultServerless(userId: string) {
  if (!firestoreDb) return null;
  const userRef = doc(firestoreDb, 'users', userId);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}`;

code = code.replace(targetInspect, newInspect);
fs.writeFileSync(file, code);
