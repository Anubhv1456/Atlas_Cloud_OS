const fs = require('fs');
const path = './artifacts/study-tracker/src/lib/admin.ts';
let code = fs.readFileSync(path, 'utf8');

// Update bulkUpdateUserBetaAccess signature and implementation
code = code.replace(
  'export async function bulkUpdateUserBetaAccess(userIds: string[], betaAccess: boolean, durationDays?: number | null, isTrial?: boolean) {',
  'export async function bulkUpdateUserBetaAccess(userIds: string[], betaAccess: boolean, durationDays?: number | null, isTrial?: boolean, referredBy?: string) {'
);

code = code.replace(
  'isTrial: isTrial ?? (durationDays !== null && durationDays !== undefined && durationDays <= 15)\n      }, { merge: true });',
  'isTrial: isTrial ?? (durationDays !== null && durationDays !== undefined && durationDays <= 15),\n        ...(referredBy ? { referredBy } : {})\n      }, { merge: true });'
);

// Add updateAffiliateStatus
code += `

export async function updateAffiliateStatus(userId: string, isAffiliate: boolean) {
  if (!firestoreDb) throw new Error("Firestore is not initialized.");
  const userRef = doc(firestoreDb, 'users', userId);
  const updateData: any = { isAffiliate };
  
  if (isAffiliate) {
    updateData.affiliateCode = \`affiliate_\${userId.slice(0, 6)}\`;
  }
  
  await setDoc(userRef, updateData, { merge: true });
}
`;

fs.writeFileSync(path, code);
