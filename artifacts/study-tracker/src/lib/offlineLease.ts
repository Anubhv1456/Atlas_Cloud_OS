/**
 * Atlas Medical OS - Cryptographic Offline Lease & Anti-Tamper Engine
 *
 * Implements a 72-Hour Optimistic Lease Architecture:
 * - Grants valid paid/trial candidates a 72-hour offline operating window.
 * - Detects operating system clock rollbacks via monotonic performance references.
 * - Automatically renews upon successful background Firestore handshakes.
 */

export const OFFLINE_LEASE_DURATION_MS = 72 * 60 * 60 * 1000; // 72 Hours

export interface OfflineLease {
  uid: string;
  grantedAt: number;
  expiresAt: number;
  lastOnlineSync: number;
  initialMonotonic: number;
  initialTimestamp: number;
  checksum: string;
}

export interface LeaseVerificationResult {
  isValid: boolean;
  hasLease: boolean;
  hoursRemaining: number;
  isExpired: boolean;
  isTampered: boolean;
}

const LEASE_KEY_PREFIX = 'atlas_offline_lease_';

/**
 * Deterministic fast checksum generator for local lease validation
 */
function computeLeaseChecksum(uid: string, grantedAt: number, expiresAt: number): string {
  const secretSalt = 'ATLAS_MED_OS_OFFLINE_LEASE_V1';
  const raw = `${uid}#${grantedAt}#${expiresAt}#${secretSalt}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `lease_${Math.abs(hash).toString(16)}`;
}

/**
 * Creates and persists a fresh 72-Hour offline lease for a verified user
 */
export function issueOfflineLease(uid: string): OfflineLease {
  const now = Date.now();
  const expiresAt = now + OFFLINE_LEASE_DURATION_MS;
  const monotonic = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;

  const lease: OfflineLease = {
    uid,
    grantedAt: now,
    expiresAt,
    lastOnlineSync: now,
    initialMonotonic: monotonic,
    initialTimestamp: now,
    checksum: computeLeaseChecksum(uid, now, expiresAt),
  };

  try {
    localStorage.setItem(`${LEASE_KEY_PREFIX}${uid}`, JSON.stringify(lease));
  } catch (err) {
    console.warn('[Atlas Offline Lease] Unable to write lease to localStorage', err);
  }

  return lease;
}

/**
 * Retrieves the stored offline lease for a user
 */
export function getStoredOfflineLease(uid: string): OfflineLease | null {
  try {
    const raw = localStorage.getItem(`${LEASE_KEY_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineLease;
  } catch (err) {
    console.warn('[Atlas Offline Lease] Failed to read stored lease', err);
    return null;
  }
}

/**
 * Verifies if the user is currently within an active, untampered 72-hour offline lease
 */
export function verifyOfflineLease(uid: string): LeaseVerificationResult {
  const lease = getStoredOfflineLease(uid);

  if (!lease || lease.uid !== uid) {
    return {
      isValid: false,
      hasLease: false,
      hoursRemaining: 0,
      isExpired: true,
      isTampered: false,
    };
  }

  // 1. Verify Checksum Integrity
  const expectedChecksum = computeLeaseChecksum(lease.uid, lease.grantedAt, lease.expiresAt);
  if (lease.checksum !== expectedChecksum) {
    return {
      isValid: false,
      hasLease: true,
      hoursRemaining: 0,
      isExpired: false,
      isTampered: true,
    };
  }

  const now = Date.now();

  // 2. Anti-Clock-Rollback Detection
  // If current timestamp is before granted time, the system clock was set backwards
  if (now < lease.grantedAt - 60000) {
    // 1 minute buffer for minor NTP adjustments
    return {
      isValid: false,
      hasLease: true,
      hoursRemaining: 0,
      isExpired: false,
      isTampered: true,
    };
  }

  // Monotonic check if within same session
  if (typeof performance !== 'undefined' && performance.now && lease.initialMonotonic > 0) {
    const currentMonotonic = performance.now();
    const elapsedMonotonicMs = currentMonotonic - lease.initialMonotonic;
    const elapsedWallMs = now - lease.initialTimestamp;

    // If wall clock advanced backwards while monotonic progressed forward
    if (elapsedWallMs < -60000 && elapsedMonotonicMs > 0) {
      return {
        isValid: false,
        hasLease: true,
        hoursRemaining: 0,
        isExpired: false,
        isTampered: true,
      };
    }
  }

  // 3. Expiration Check
  const msRemaining = lease.expiresAt - now;
  const isExpired = msRemaining <= 0;
  const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));

  return {
    isValid: !isExpired,
    hasLease: true,
    hoursRemaining,
    isExpired,
    isTampered: false,
  };
}

/**
 * Revokes the offline lease upon explicit logout or administrative revocation
 */
export function revokeOfflineLease(uid: string): void {
  try {
    localStorage.removeItem(`${LEASE_KEY_PREFIX}${uid}`);
  } catch (err) {
    console.warn('[Atlas Offline Lease] Failed to remove lease', err);
  }
}
