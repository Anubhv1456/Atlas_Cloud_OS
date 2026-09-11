import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { firestoreDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface ReferredCandidate {
  id: string;
  displayName: string;
  emailMasked: string;
  joinedAt: Date | null;
  status: 'active' | 'trial' | 'expired';
}

export interface AffiliateStats {
  totalReferrals: number;
  activeSeats: number;
  pendingSeats: number;
}

interface ReferralCodeStats {
  totalClaims: number;
  totalQualified: number;
  totalConversions: number;
  activeSeats: number;
}

export function useAffiliate() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const [isAffiliate, setIsAffiliate] = useState<boolean>(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [referralsLoading, setReferralsLoading] = useState<boolean>(false);
  const [referredCandidates, setReferredCandidates] = useState<ReferredCandidate[]>([]);
  const [codeStats, setCodeStats] = useState<ReferralCodeStats | null>(null);

  // Real-time Affiliate Config State
  const [config, setConfig] = useState({ cookieWindowDays: 60 });

  // 1. Resolve Affiliate Status & Code (Supporting Observer Mode)
  useEffect(() => {
    if (isImpersonating && impersonatedUser) {
      setIsAffiliate(Boolean(impersonatedUser.isAffiliate));
      setAffiliateCode(impersonatedUser.affiliateCode || null);
      setLoading(false);
      return;
    }

    if (!user) {
      setIsAffiliate(false);
      setAffiliateCode(null);
      setLoading(false);
      setReferredCandidates([]);
      setCodeStats(null);
      return;
    }

    if (!firestoreDb) {
      setIsAffiliate(false);
      setAffiliateCode(null);
      setLoading(false);
      return;
    }

    // Subscribe to admin configuration
    const configRef = doc(firestoreDb, 'config', 'affiliate_config');
    getDoc(configRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({ cookieWindowDays: data.cookieWindowDays ?? 60 });
      }
    }).catch(() => {});

    const userRef = doc(firestoreDb, 'users', user.uid);
    getDoc(userRef).then(
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const isAff = Boolean(data.isAffiliate || data.attribution?.isPartner);
          const resolvedCode = data.affiliateCode || data.attribution?.ownedCode || (isAff ? `affiliate_${user.uid.slice(0, 6)}` : null);
          setIsAffiliate(isAff);
          setAffiliateCode(resolvedCode);
        } else {
          setIsAffiliate(false);
          setAffiliateCode(null);
        }
        setLoading(false);
      }).catch(
      (err) => {
        console.warn('Could not read affiliate state from Firestore:', err);
        setIsAffiliate(false);
        setAffiliateCode(null);
        setLoading(false);
      }
    );
  }, [user, isImpersonating, impersonatedUser]);

  // 2. Fetch Aggregated Counters & Masked Candidates
  const fetchReferrals = useCallback(async () => {
    if (!affiliateCode || !firestoreDb) {
      setReferredCandidates([]);
      setCodeStats(null);
      return;
    }

    setReferralsLoading(true);
    const cleanCode = affiliateCode.trim().toUpperCase();

    // Step A: Read aggregated counters directly from the user's active code document /referral_codes/{affiliateCode}
    // (authorized by allow read: if isAuthenticated(); without cross-user query)
    try {
      const codeRef = doc(firestoreDb, 'referral_codes', cleanCode);
      const codeSnap = await getDoc(codeRef);
      if (codeSnap.exists()) {
        const cd = codeSnap.data();
        if (cd.stats) {
          setCodeStats({
            totalClaims: cd.stats.totalClaims || 0,
            totalQualified: cd.stats.totalQualified || 0,
            totalConversions: cd.stats.totalConversions || 0,
            activeSeats: cd.stats.activeSeats || 0,
          });
        }
      }
    } catch (e) {
      console.warn('[useAffiliate] Could not read code document stats:', e);
    }

    // Step B: Fetch masked candidate list via authenticated serverless route (GET /api/referral/roster)
    if (user) {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/referral/roster?code=${encodeURIComponent(cleanCode)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.candidates)) {
            setReferredCandidates(data.candidates.map((c: any) => ({
              ...c,
              joinedAt: c.joinedAt ? new Date(c.joinedAt) : null,
            })));

            if (data.stats) {
              setCodeStats(prev => prev || data.stats);
            }
          }
        }
      } catch (e) {
        console.warn('[useAffiliate] Roster API call deferred:', e);
      } finally {
        setReferralsLoading(false);
      }
    } else {
      setReferralsLoading(false);
    }
  }, [affiliateCode, user]);

  useEffect(() => {
    if (isAffiliate && affiliateCode) {
      fetchReferrals();
    } else {
      setReferredCandidates([]);
      setCodeStats(null);
    }
  }, [isAffiliate, affiliateCode, fetchReferrals]);

  // 3. Computed Aggregate Statistics (combining authoritative code counters with masked roster)
  const stats: AffiliateStats = useMemo(() => {
    const totalReferrals = codeStats?.totalClaims ?? referredCandidates.length;
    const activeSeats = codeStats?.activeSeats ?? codeStats?.totalConversions ?? referredCandidates.filter(c => c.status === 'active').length;
    const pendingSeats = Math.max(0, totalReferrals - activeSeats);

    return {
      totalReferrals,
      activeSeats,
      pendingSeats,
    };
  }, [codeStats, referredCandidates]);

  // 4. Link Generators
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://atlas.app';
  const referralLinks = useMemo(() => {
    if (!affiliateCode) {
      return {
        primaryLink: `${origin}/`,
        betaAccessLink: `${origin}/beta-access`
      };
    }
    return {
      primaryLink: `${origin}/?via=${encodeURIComponent(affiliateCode)}`,
      betaAccessLink: `${origin}/beta-access?via=${encodeURIComponent(affiliateCode)}`
    };
  }, [origin, affiliateCode]);

  return {
    isAffiliate,
    affiliateCode,
    loading,
    referralsLoading,
    stats,
    referredCandidates,
    referralLinks,
    config,
    refresh: fetchReferrals
  };
}
