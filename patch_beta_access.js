const fs = require('fs');
const p = '/app/applet/artifacts/study-tracker/src/hooks/useBetaAccess.ts';
let content = fs.readFileSync(p, 'utf8');

// Replace imports
content = content.replace("import { doc, onSnapshot, setDoc } from 'firebase/firestore';", "import { doc, getDoc, setDoc } from 'firebase/firestore';");

// Replace activeUnsubscribe with isSingletonSetup
content = content.replace('let activeUnsubscribe: (() => void) | null = null;', 'let isSingletonSetup = false;');

const cleanupOld = `export function cleanupBetaAccessSubscription() {
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
    console.log('[useBetaAccess] Cleaned up real-time entitlements listener.');
  }
  currentUserId = null;
}`;
const cleanupNew = `export function cleanupBetaAccessSubscription() {
  isSingletonSetup = false;
  currentUserId = null;
}`;
content = content.replace(cleanupOld, cleanupNew);

const setupStartOld = `function setupSingletonListener(uid: string, userObj?: User | null) {
  if (currentUserId === uid && activeUnsubscribe) {
    return;
  }`;
const setupStartNew = `export async function forceFetchEntitlements(uid: string, userObj?: User | null) {
  if (!firestoreDb) return;
  try {
    const userRef = doc(firestoreDb, 'users', uid);
    const snap = await getDoc(userRef);
    if (currentUserId !== uid) return;

    if (snap.exists()) {
      const data = snap.data();
      const isBeta = data.betaAccess === true;

      if (isBeta) {
        localStorage.setItem(\`beta_access_\${uid}\`, 'true');
        issueOfflineLease(uid);
        if (userObj) {
          requestServerOfflineLease(userObj).catch(() => {});
        }
      } else {
        localStorage.removeItem(\`beta_access_\${uid}\`);
        revokeOfflineLease(uid);
      }

      updateSingleton({
        hasAccess: isBeta,
        paymentStatus: data.paymentStatus || null,
        paymentRejectionNote: data.paymentRejectionNote || null,
        vaultActivationRequired: Boolean(data.vaultActivationRequired),
        vaultProvenance: data.vaultImportProvenance || null,
        offlineLeaseValid: true,
        offlineHoursRemaining: 72,
        loading: false,
        trialExpiresAt: data.trialExpiresAt || null,
        trialStartedAt: data.trialStartedAt || null,
        isTrialAuthoritative: Boolean(data.trialExpiresAt),
      });
    } else {
      localStorage.removeItem(\`beta_access_\${uid}\`);
      revokeOfflineLease(uid);
      updateSingleton({
        hasAccess: false,
        paymentStatus: null,
        paymentRejectionNote: null,
        vaultActivationRequired: false,
        vaultProvenance: null,
        loading: false,
        trialExpiresAt: null,
        trialStartedAt: null,
        isTrialAuthoritative: false,
      });
    }
  } catch (error) {
    console.warn("Singleton Firestore access listener error (offline):", error);
    updateSingleton({ loading: false });
  }
}

function setupSingletonListener(uid: string, userObj?: User | null) {
  if (currentUserId === uid && isSingletonSetup) {
    return;
  }`;
content = content.replace(setupStartOld, setupStartNew);

const setupMiddleOld = `  currentUserId = uid;
  singletonState = getInitialStateForUser(uid);`;
const setupMiddleNew = `  currentUserId = uid;
  isSingletonSetup = true;
  singletonState = getInitialStateForUser(uid);`;
content = content.replace(setupMiddleOld, setupMiddleNew);

const onSnapshotOld = `  const userRef = doc(firestoreDb, 'users', uid);
  activeUnsubscribe = onSnapshot(
    userRef,
    (snap) => {
      if (currentUserId !== uid) return;

      if (snap.exists()) {
        const data = snap.data();
        const isBeta = data.betaAccess === true;

        if (isBeta) {
          localStorage.setItem(\`beta_access_\${uid}\`, 'true');
          issueOfflineLease(uid);
          if (userObj) {
            requestServerOfflineLease(userObj).catch(() => {});
          }
        } else {
          localStorage.removeItem(\`beta_access_\${uid}\`);
          revokeOfflineLease(uid);
        }

        updateSingleton({
          hasAccess: isBeta,
          paymentStatus: data.paymentStatus || null,
          paymentRejectionNote: data.paymentRejectionNote || null,
          vaultActivationRequired: Boolean(data.vaultActivationRequired),
          vaultProvenance: data.vaultImportProvenance || null,
          offlineLeaseValid: true,
          offlineHoursRemaining: 72,
          loading: false,
          trialExpiresAt: data.trialExpiresAt || null,
          trialStartedAt: data.trialStartedAt || null,
          isTrialAuthoritative: Boolean(data.trialExpiresAt),
        });
      } else {
        localStorage.removeItem(\`beta_access_\${uid}\`);
        revokeOfflineLease(uid);
        updateSingleton({
          hasAccess: false,
          paymentStatus: null,
          paymentRejectionNote: null,
          vaultActivationRequired: false,
          vaultProvenance: null,
          loading: false,
          trialExpiresAt: null,
          trialStartedAt: null,
          isTrialAuthoritative: false,
        });
      }
    },
    (error) => {
      console.warn("Singleton Firestore access listener error (offline):", error);
      updateSingleton({ loading: false });
    }
  );
}`;

const onSnapshotNew = `  // Execute one-shot fetch
  forceFetchEntitlements(uid, userObj);
}`;
content = content.replace(onSnapshotOld, onSnapshotNew);

const returnOld = `    isSoftLocked: state.isSoftLocked,
    clearVaultActivationFlag
  };
}`;
const returnNew = `    isSoftLocked: state.isSoftLocked,
    clearVaultActivationFlag,
    refetchAccess: () => {
      if (user && user.uid) {
        updateSingleton({ loading: true });
        forceFetchEntitlements(user.uid, user);
      }
    }
  };
}`;
content = content.replace(returnOld, returnNew);

fs.writeFileSync(p, content, 'utf8');
console.log('patched useBetaAccess');
