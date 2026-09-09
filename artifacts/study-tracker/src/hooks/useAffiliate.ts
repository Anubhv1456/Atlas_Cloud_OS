import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { firestoreDb } from '@/lib/firebase';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

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

export function useAffiliate() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUser } = useImpersonation();

  const [isAffiliate, setIsAffiliate] = useState<boolean>(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [referralsLoading, setReferralsLoading] = useState<boolean>(false);
  const [referredCandidates, setReferredCandidates] = useState<ReferredCandidate[]>([]);
  
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
    const unsubscribeConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setConfig({
          
          
          cookieWindowDays: data.cookieWindowDays ?? 60
        });
      }
    });

    const userRef = doc(firestoreDb, 'users', user.uid);
    const unsubscribeUser = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setIsAffiliate(Boolean(data.isAffiliate));
          setAffiliateCode(data.affiliateCode || (data.isAffiliate ? `affiliate_${user.uid.slice(0, 6)}` : null));
        } else {
          setIsAffiliate(false);
          setAffiliateCode(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Could not read affiliate state from Firestore:', err);
        setIsAffiliate(false);
        setAffiliateCode(null);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeConfig();
      unsubscribeUser();
    };
  }, [user, isImpersonating, impersonatedUser]);

  // Helper to safely mask email (e.g., "alex.miller@gmail.com" -> "a***r@gmail.com")
  const maskEmail = (email?: string | null): string => {
    if (!email || !email.includes('@')) return 'Anonymous Scholar';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  };

  // Helper to mask name (e.g., "John Doe" -> "Dr. John D.")
  const maskName = (name?: string | null, email?: string | null): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0]} ${parts[1][0]}.`;
      }
      return parts[0];
    }
    if (email) {
      return `Scholar ${email.slice(0, 3).toUpperCase()}`;
    }
    return 'Candidate';
  };

  // 2. Fetch Referred Candidates for the given affiliateCode
  const fetchReferrals = useCallback(async () => {
    if (!affiliateCode || !firestoreDb) {
      setReferredCandidates([]);
      return;
    }

    setReferralsLoading(true);
    try {
      const usersRef = collection(firestoreDb, 'users');
      // Fetch users referred by this affiliate code
      const q = query(usersRef, where('referredBy', '==', affiliateCode));
      const snap = await getDocs(q);

      const targetId = isImpersonating ? impersonatedUser?.id : user?.uid;
      const candidates: ReferredCandidate[] = [];

      snap.forEach((docSnap) => {
        const d = docSnap.data();
        // Exclude the affiliate themselves and admins
        if (docSnap.id === targetId || d.role === 'admin' || d.isAdmin) return;

        const rawExp = d.betaAccessExpiresAt;
        const expTime = typeof rawExp === 'number' 
          ? rawExp 
          : rawExp?.toMillis 
          ? rawExp.toMillis() 
          : rawExp ? new Date(rawExp).getTime() : null;

        const isExpired = expTime && expTime < Date.now();
        const isActive = Boolean(d.betaAccess && !isExpired);
        const isTrial = Boolean(d.isTrial || (!d.betaAccess && d.paymentStatus === 'pending'));

        let joinedDate: Date | null = null;
        if (d.createdAt) {
          joinedDate = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
        }

        candidates.push({
          id: docSnap.id,
          displayName: maskName(d.displayName, d.email),
          emailMasked: maskEmail(d.email),
          joinedAt: joinedDate,
          status: isActive ? 'active' : isTrial ? 'trial' : 'expired',
          
        });
      });

      // Sort newest first
      candidates.sort((a, b) => {
        const timeA = a.joinedAt ? a.joinedAt.getTime() : 0;
        const timeB = b.joinedAt ? b.joinedAt.getTime() : 0;
        return timeB - timeA;
      });

      setReferredCandidates(candidates);
    } catch (e) {
      console.warn('[useAffiliate] Error fetching referral roster:', e);
    } finally {
      setReferralsLoading(false);
    }
  }, [affiliateCode, isImpersonating, impersonatedUser, user]);

  useEffect(() => {
    if (isAffiliate && affiliateCode) {
      fetchReferrals();
    } else {
      setReferredCandidates([]);
    }
  }, [isAffiliate, affiliateCode, fetchReferrals]);

  // 3. Computed Aggregate Statistics
  const stats: AffiliateStats = useMemo(() => {
    const totalReferrals = referredCandidates.length;
    const activeSeats = referredCandidates.filter(c => c.status === 'active').length;
    const pendingSeats = totalReferrals - activeSeats;
            
    return {
      totalReferrals,
      activeSeats,
      pendingSeats,
      };
  }, [referredCandidates, config.cookieWindowDays]);

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
