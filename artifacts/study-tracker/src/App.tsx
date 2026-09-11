import { useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UpgradePaywallModal } from "@/components/UpgradePaywallModal";
import { ensurePersistentStorage } from '@/db/localDb';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags';
import { lazyWithRetry } from '@/lib/lazyWithRetry';
import { ImpersonationProvider, useImpersonation } from '@/contexts/ImpersonationContext';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

import { GlobalQuickEntry } from '@/components/ui/GlobalQuickEntry';
import { CurriculumInitializationEngine } from '@/components/CurriculumInitializationEngine';
import { AppUpdateCapsule } from '@/components/AppUpdateCapsule';
import { AutoSyncEngine } from '@/components/AutoSyncEngine';

const Landing = lazyWithRetry(() => import('@/pages/Landing'));
const AcceptInvitation = lazyWithRetry(() => import('@/pages/AcceptInvitation'));
const PrivacyPolicy = lazyWithRetry(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('@/pages/TermsOfService'));
const Contact = lazyWithRetry(() => import('@/pages/Contact'));
const BetaAccess = lazyWithRetry(() => import('@/pages/BetaAccess'));
const ProtectedApp = lazyWithRetry(() => import('@/features/app/ProtectedApp'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ensurePersistentStorage().catch(e => {
  console.warn('Failed to ensure persistent storage:', e);
});

function initTheme() {
  if (typeof window !== 'undefined') {
    try {
      const storedTheme = localStorage.getItem('atlas_theme');
      if (storedTheme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'atlas');
      }
    } catch (e) {
      console.warn('localStorage access fallback', e);
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'atlas');
    }
  }
}
initTheme();

function AppRouter() {
  const { user, loading } = useAuth();
  const { isImpersonating } = useImpersonation();
  const [location] = useLocation();

  if (loading) return <AtlasLoadingScreen fullScreen />;

  return (
    <Switch>
      <Route path="/privacy">
        <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
          <PrivacyPolicy />
        </Suspense>
      </Route>
      <Route path="/terms">
        <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
          <TermsOfService />
        </Suspense>
      </Route>
      <Route path="/contact">
        <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
          <Contact />
        </Suspense>
      </Route>
      <Route path="/accept-invitation">
        <div className="min-h-dvh flex flex-col w-full">
          {isImpersonating && <ImpersonationBanner />}
          <Suspense fallback={<AtlasLoadingScreen fullScreen message="Verifying study pass..." />}>
            <AcceptInvitation />
          </Suspense>
        </div>
      </Route>
      <Route path="/join">
        <div className="min-h-dvh flex flex-col w-full">
          {isImpersonating && <ImpersonationBanner />}
          <Suspense fallback={<AtlasLoadingScreen fullScreen message="Verifying study pass..." />}>
            <AcceptInvitation />
          </Suspense>
        </div>
      </Route>
      <Route path="/beta-access">
        <div className="min-h-dvh flex flex-col w-full">
          {isImpersonating && <ImpersonationBanner />}
          <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
            <BetaAccess />
          </Suspense>
        </div>
      </Route>
      
      {user ? (
        <Suspense fallback={<AtlasLoadingScreen fullScreen message="Loading secure workspace..." />}>
          <CurriculumInitializationEngine>
            <AutoSyncEngine />
            <ProtectedApp />
          </CurriculumInitializationEngine>
        </Suspense>
      ) : (
        <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
          <Route component={Landing} />
        </Suspense>
      )}
    </Switch>
  );
}

function App() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const via = url.searchParams.get('via') || url.searchParams.get('ref') || url.searchParams.get('affiliate');
        
        if (via) {
          localStorage.setItem('atlas_affiliate_id', via);
          
          url.searchParams.delete('via');
          url.searchParams.delete('ref');
          url.searchParams.delete('affiliate');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
        }
      } catch (err) {
        console.warn('[Referral Capture] Failed to parse parameters:', err);
      }
    }
  }, []);

  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <ImpersonationProvider>
          <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ErrorBoundary>
              <WouterRouter base={import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/' ? import.meta.env.BASE_URL.replace(/\/$/, '') : undefined}>
                <AppRouter />
              </WouterRouter>
            </ErrorBoundary>
            <GlobalQuickEntry />
            <AppUpdateCapsule />
            <Toaster />
            <UpgradePaywallModal />
            <SonnerToaster position="top-center" richColors />
          </TooltipProvider>
          </QueryClientProvider>
        </ImpersonationProvider>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}

export default App; // force reload
