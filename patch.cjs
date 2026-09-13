const fs = require('fs');
const file = 'artifacts/study-tracker/src/lib/offlineLease.ts';
let code = fs.readFileSync(file, 'utf8');

const targetFunction = `export async function requestServerOfflineLease(user: User | null): Promise<OfflineLease | null> {
  if (!user) return null;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getStoredOfflineLease(user.uid);
  }

  try {
    const idToken = await user.getIdToken();
    const response = await fetch('/api/auth/issue-lease', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${idToken}\`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn('[Atlas Offline Lease] Server rejected lease request:', errData.message || response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.lease) {
      return null;
    }

    const monotonic = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
    const now = Date.now();

    const signedLease: OfflineLease = {
      uid: data.lease.uid,
      grantedAt: data.lease.grantedAt,
      expiresAt: data.lease.expiresAt,
      lastOnlineSync: now,
      initialMonotonic: monotonic,
      initialTimestamp: now,
      signature: data.signature,
      serverSigned: true,
    };

    try {
      localStorage.setItem(\`\${LEASE_KEY_PREFIX}\${user.uid}\`, JSON.stringify(signedLease));
    } catch (e) {
      console.warn('[Atlas Offline Lease] Failed to store lease in localStorage', e);
    }

    return signedLease;
  } catch (error) {
    console.warn('[Atlas Offline Lease] Network error requesting lease:', error);
    return null;
  }
}`;

const newFunction = `export async function requestServerOfflineLease(user: User | null): Promise<OfflineLease | null> {
  if (!user) return null;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getStoredOfflineLease(user.uid);
  }

  try {
    if (!firestoreDb) return null;
    const userRef = doc(firestoreDb, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;

    const userData = snap.data();
    const now = Date.now();
    const isPaid = userData.hasPaidAccess === true || userData.paymentStatus === 'succeeded';

    let betaExpiry: number | null = null;
    if (userData.betaAccessExpiresAt) {
      betaExpiry = typeof userData.betaAccessExpiresAt === 'string' ? new Date(userData.betaAccessExpiresAt).getTime() : userData.betaAccessExpiresAt;
    }

    let trialExpiry: number | null = null;
    if (userData.trialExpiresAt) {
      trialExpiry = typeof userData.trialExpiresAt === 'string' ? new Date(userData.trialExpiresAt).getTime() : userData.trialExpiresAt;
    }

    const isBetaActive = userData.betaAccess === true && (!betaExpiry || betaExpiry > now);
    const isTrialActive = Boolean(trialExpiry && trialExpiry > now);
    const isEntitled = isPaid || isBetaActive || isTrialActive;

    if (!isEntitled) {
      return null;
    }

    let expiresAt = now + OFFLINE_LEASE_DURATION_MS;
    const caps = [betaExpiry, trialExpiry].filter((exp): exp is number => typeof exp === 'number' && exp > now);
    if (!isPaid && caps.length > 0) {
      expiresAt = Math.min(expiresAt, ...caps);
    }

    const monotonic = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;

    const signedLease: OfflineLease = {
      uid: user.uid,
      grantedAt: now,
      expiresAt: expiresAt,
      lastOnlineSync: now,
      initialMonotonic: monotonic,
      initialTimestamp: now,
      signature: 'local_cache',
      serverSigned: false,
    };

    try {
      localStorage.setItem(\`\${LEASE_KEY_PREFIX}\${user.uid}\`, JSON.stringify(signedLease));
    } catch (e) {
      console.warn('[Atlas Offline Lease] Failed to store lease in localStorage', e);
    }

    return signedLease;
  } catch (error) {
    console.warn('[Atlas Offline Lease] Error issuing lease:', error);
    return null;
  }
}`;

code = code.replace(targetFunction, newFunction);
fs.writeFileSync(file, code);
