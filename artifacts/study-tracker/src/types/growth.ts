export type GrowthCodeType = 'batchmate' | 'ambassador' | 'affiliate';
export type GrowthCodeStatus = 'active' | 'suspended' | 'deprecating';
export type GrowthAttributionStatus = 'claimed' | 'qualified' | 'converted';
export type GrowthSourceParam = 'ref' | 'via' | 'affiliate';
export type PartnerType = 'ambassador' | 'affiliate';

/**
 * Aggregated growth & conversion counters maintained on the canonical referral code document.
 */
export interface ReferralCodeStats {
  /** Total referee accounts registered / claimed */
  totalClaims: number;
  /** Total peers who reached the study milestone (>=10 min study session) */
  totalQualified: number;
  /** Total referred candidates who completed paid license checkout */
  totalConversions: number;
  /** Currently active (unexpired) referred candidates */
  activeSeats: number;
}

/**
 * Entitlement and trial configuration attached to a referral / partner code.
 */
export interface ReferralCodeConfig {
  /** Maximum number of claims allowed, or null for unlimited partner codes */
  maxClaims: number | null;
  /** Length of trial granted to referee upon claiming pass (in days) */
  refereeTrialDays: number;
  /** Bonus subscription days awarded to referrer upon qualification */
  referrerBonusDays: number;
}

/**
 * Canonical unified referral & partner code entity stored at `/referral_codes/{code}`.
 * Replaces fragmented `/referralCodes/{code}`, raw `affiliateCode`, and ambassador forms.
 */
export interface ReferralCodeEntity {
  /** Normalized uppercase code (Document ID and primary key) */
  code: string;
  /** Classification of code */
  type: GrowthCodeType;
  /** Firebase Auth UID of code owner */
  ownerUid: string;
  /** Contact email of owner */
  ownerEmail: string;
  /** Display name of owner */
  ownerDisplayName: string;
  /** Lifecycle status of code */
  status: GrowthCodeStatus;
  /** Real-time aggregated metrics */
  stats: ReferralCodeStats;
  /** Configuration and reward policies */
  config: ReferralCodeConfig;
  /** Timestamp of initial creation */
  createdAt: any;
  /** Timestamp of most recent counter or metadata mutation */
  updatedAt: any;
}

/**
 * Unified attribution profile embedded on `/users/{uid}.attribution`.
 * Replaces disparate legacy fields (`referredByCode`, `referredByUid`, `referralStatus`, `isAffiliate`, `affiliateCode`, `referredBy`).
 */
export interface UserAttribution {
  // ── Inbound Attribution (How this user was referred) ────────────────────────
  /** Code used to register / claim access */
  code: string | null;
  /** Firebase Auth UID of the inviter or partner */
  referrerUid: string | null;
  /** Category of inviter code */
  type: GrowthCodeType | null;
  /** Current attribution lifecycle milestone */
  status: GrowthAttributionStatus;
  /** When code was claimed */
  claimedAt: any | null;
  /** When >=10 min study block was validated */
  qualifiedAt: any | null;
  /** When paid checkout was verified */
  convertedAt: any | null;
  /** URL query parameter captured at first touch */
  sourceParam: GrowthSourceParam;

  // ── Outbound Attribution (Code owned and distributed by this user) ──────────
  /** Primary canonical code issued to this user */
  ownedCode: string | null;
  /** Whether user is a verified ambassador or commercial affiliate */
  isPartner: boolean;
  /** Partner category */
  partnerType: PartnerType | null;
}

/**
 * Unified candidate user profile schema representing documents in `/users/{uid}`.
 */
export interface UserProfile {
  id?: string;
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  createdAt?: any;
  updatedAt?: any;
  lastLoginAt?: any;

  // Access & subscription state
  betaAccess?: boolean;
  betaAccessExpiresAt?: number | any;
  isTrial?: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
  paidAt?: string;
  hasPaidAccess?: boolean;

  // Consolidated Growth Attribution (Phase 1)
  attribution?: UserAttribution;

  // Legacy referral & affiliate fields (maintained for zero-downtime backward compatibility)
  referralCode?: string;
  passesRemaining?: number;
  referredByCode?: string;
  referredByUid?: string;
  referralStatus?: 'claimed' | 'qualified';
  isAffiliate?: boolean;
  affiliateCode?: string;
  referredBy?: string;

  // Role & Administrative flags
  isAdmin?: boolean;
  role?: string;
}
