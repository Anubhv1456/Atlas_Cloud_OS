import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logImpersonationEvent, getCandidateCloudProfile } from '@/lib/admin';
import { toast } from 'sonner';

export interface ImpersonationTarget {
  id: string;
  email: string;
  displayName?: string;
  betaAccess?: boolean;
  betaAccessExpiresAt?: any;
  isTrial?: boolean;
  referredBy?: string;
  paymentStatus?: string;
  createdAt?: any;
  lastLoginAt?: any;
  isAffiliate?: boolean;
  affiliateCode?: string;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonationTarget | null;
  startImpersonation: (target: ImpersonationTarget) => Promise<void>;
  exitImpersonation: () => Promise<void>;
  refreshCandidateProfile: () => Promise<void>;
  assertReadOnly: (actionName?: string) => boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  isImpersonating: false,
  impersonatedUser: null,
  startImpersonation: async () => {},
  exitImpersonation: async () => {},
  refreshCandidateProfile: async () => {},
  assertReadOnly: () => false,
});

const STORAGE_KEY = 'atlas_impersonated_target';

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonationTarget | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isImpersonating = Boolean(impersonatedUser);

  const startImpersonation = async (target: ImpersonationTarget) => {
    try {
      setImpersonatedUser(target);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
      if (user) {
        await logImpersonationEvent(user.uid, user.email || '', target.id, target.email, 'start');
      }
      toast.success(`Observer mode active: ${target.displayName || target.email} (Read-Only)`);
    } catch (e) {
      console.error('Failed to start impersonation', e);
      toast.error('Failed to initialize impersonation');
    }
  };

  const refreshCandidateProfile = async () => {
    if (!impersonatedUser?.id) return;
    try {
      const freshData = await getCandidateCloudProfile(impersonatedUser.id);
      if (freshData) {
        const updated = { ...impersonatedUser, ...freshData };
        setImpersonatedUser(updated);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to refresh candidate profile:', e);
    }
  };

  const exitImpersonation = async () => {
    try {
      if (impersonatedUser && user) {
        await logImpersonationEvent(user.uid, user.email || '', impersonatedUser.id, impersonatedUser.email, 'exit');
      }
    } catch (e) {
      console.warn('Failed to log impersonation exit event', e);
    } finally {
      setImpersonatedUser(null);
      sessionStorage.removeItem(STORAGE_KEY);
      toast.info('Exited Observer Mode. Welcome back to Admin Console.');
    }
  };

  // Helper for mutation handlers: returns true if in observer mode (blocked), false otherwise
  const assertReadOnly = (actionName?: string): boolean => {
    if (isImpersonating) {
      toast.warning(`Read-Only: Action disabled in Observer Mode${actionName ? ` (${actionName})` : ''}.`);
      return true;
    }
    return false;
  };

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedUser,
        startImpersonation,
        exitImpersonation,
        refreshCandidateProfile,
        assertReadOnly,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}
