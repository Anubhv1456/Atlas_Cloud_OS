const fs = require('fs');
const file = 'artifacts/study-tracker/src/hooks/useBetaAccess.ts';
let code = fs.readFileSync(file, 'utf8');

const targetFunction = `    async function syncServerTrial() {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/auth/activate-trial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: \`Bearer \${idToken}\`,
          },
        });
        if (!res.ok) return;

        const data = await res.json();

        if (!isCancelled && data.success && data.trialExpiresAt) {
          updateSingleton({
            trialExpiresAt: data.trialExpiresAt,
            trialStartedAt: data.trialStartedAt,
            isTrialAuthoritative: true,
          });
        }
      } catch (err) {
        console.warn('[useBetaAccess] Network error during trial sync:', err);
      }
    }`;

const newFunction = `    async function syncServerTrial() {
      if (!firestoreDb) return;
      try {
        const userRef = doc(firestoreDb, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.hasPaidAccess || userData.paymentStatus === 'succeeded' || userData.isTrial) {
            return;
          }
        }
        
        const now = Date.now();
        const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
        const trialStartedAt = new Date(now).toISOString();
        const trialExpiresAt = new Date(now + FOURTEEN_DAYS_MS).toISOString();
        
        await setDoc(userRef, {
          isTrial: true,
          trialStartedAt,
          trialExpiresAt,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (!isCancelled) {
          updateSingleton({
            trialExpiresAt,
            trialStartedAt,
            isTrialAuthoritative: true,
          });
        }
      } catch (err) {
        console.warn('[useBetaAccess] Network error during trial sync:', err);
      }
    }`;

code = code.replace(targetFunction, newFunction);
fs.writeFileSync(file, code);
