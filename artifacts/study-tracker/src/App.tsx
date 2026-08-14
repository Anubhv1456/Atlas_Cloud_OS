import { useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { triggerSpacedRepetitionNotification } from '@/lib/pwaAndNotifications';
import { AuthProvider, useAuth } from '@/hooks/useAuth';


import { GlobalAnnouncements } from '@/components/GlobalAnnouncements';
import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { AutoSyncEngine } from '@/components/AutoSyncEngine';

import NotFound from '@/pages/not-found';

function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn('Dynamic import failed, retrying module fetch:', error);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return await componentImport();
      } catch (retryError) {
        const hasRefreshed = sessionStorage.getItem('atlas_chunk_retry_refreshed');
        if (!hasRefreshed) {
          sessionStorage.setItem('atlas_chunk_retry_refreshed', 'true');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem('atlas_chunk_retry_refreshed');
        throw retryError;
      }
    }
  });
}

const Home = lazyWithRetry(() => import('@/features/dashboard/Home'));
const Landing = lazyWithRetry(() => import('@/pages/Landing'));
const AcceptInvitation = lazyWithRetry(() => import('@/pages/AcceptInvitation'));
const PrivacyPolicy = lazyWithRetry(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('@/pages/TermsOfService'));
const Contact = lazyWithRetry(() => import('@/pages/Contact'));
const BetaAccess = lazyWithRetry(() => import('@/pages/BetaAccess'));
const AdminDashboard = lazyWithRetry(() => import('@/features/admin/AdminDashboard'));
const Analytics = lazyWithRetry(() => import('@/features/analytics/Analytics'));
const Settings = lazyWithRetry(() => import('@/features/settings/Settings'));
const Timeline = lazyWithRetry(() => import('@/features/timeline/Timeline'));
const SubjectDetail = lazyWithRetry(() => import('@/features/subjects/SubjectDetail'));
const MistakeRecoveryQueue = lazyWithRetry(() => import('@/features/mistakes/MistakeRecoveryQueue'));


import { useBetaAccess } from '@/hooks/useBetaAccess';

const queryClient = new QueryClient();

const initTheme = () => {
  if (typeof window !== 'undefined') {
    try {
      const isDark = localStorage.getItem('theme') === 'dark' || !('theme' in localStorage);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('localStorage access denied, fallback to dark theme', e);
      document.documentElement.classList.add('dark');
    }
  }
};
initTheme();

function ProtectedApp() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, paymentStatus, loading: accessLoading } = useBetaAccess();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !accessLoading) {
      const isPublic = ['/privacy', '/terms', '/contact', '/accept-invitation'].includes(location);
      const isAdminRoute = location.startsWith('/admin');

      if (!user && !isPublic) {
        if (location !== '/') {
          setLocation('/');
        }
      } else if (user) {
        // Admin routes are completely separate from student beta-access and onboarding flow
        if (isAdminRoute) {
          return;
        }
        if (!hasAccess) {
          if (location !== '/beta-access' && location !== '/accept-invitation') {
            setLocation('/beta-access');
          }
        } else if (hasAccess && (location === '/beta-access' || location === '/accept-invitation')) {
          setLocation('/');
        }
      }
    }
  }, [user, authLoading, hasAccess, paymentStatus, accessLoading, location, setLocation]);

  if (authLoading || accessLoading) {
    return (
      <div className="flex items-center justify-center w-full h-[100dvh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (location === '/privacy') {
    return (
      <Suspense fallback={null}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  if (location === '/terms') {
    return (
      <Suspense fallback={null}>
        <TermsOfService />
      </Suspense>
    );
  }

  if (location === '/contact') {
    return (
      <Suspense fallback={null}>
        <Contact />
      </Suspense>
    );
  }

  if (location.startsWith('/admin')) {
    return (
      <Suspense fallback={null}>
        <AdminDashboard />
      </Suspense>
    );
  }

  if (location === '/accept-invitation') {
    if (!user) {
      setLocation('/');
      return null;
    }
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center w-full h-[100dvh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <AcceptInvitation />
      </Suspense>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center w-full h-[100dvh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <Landing />
      </Suspense>
    );
  }

  if (location === '/beta-access' || !hasAccess) {
    return (
      <Suspense fallback={null}>
        <BetaAccess />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] w-full">
      <div className="pointer-events-none fixed inset-0 z-0 bg-meridian opacity-40 mix-blend-overlay dark:opacity-20" />
      <div className="pointer-events-none fixed top-[50%] left-[50%] w-[120vw] h-[120vw] max-w-[800px] max-h-[800px] meridian-ring opacity-20" />
      <div className="pointer-events-none fixed top-[50%] left-[50%] w-[90vw] h-[90vw] max-w-[600px] max-h-[600px] meridian-ring opacity-30" />
      <GlobalAnnouncements />
      <AutoSyncEngine />
      <BottomNav />
      <div className="flex-1 w-full relative z-10 overflow-x-hidden md:pl-64 lg:pl-72 transition-all duration-300">
        <motion.main
          key={location}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0, damping: 25, stiffness: 200 }}
          className="w-full h-full"
        >
          <Suspense fallback={
            <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/subjects/:id" component={SubjectDetail} />
              <Route path="/timeline" component={Timeline} />
              <Route path="/mistakes" component={MistakeRecoveryQueue} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/settings" component={Settings} />
              <Route path="/privacy" component={PrivacyPolicy} />
              <Route path="/terms" component={TermsOfService} />
              <Route path="/contact" component={Contact} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </motion.main>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    const checkOntology = async () => {
      if (!localStorage.getItem('ontology_psychiatry_fix')) {
        await loadUniversalOntology();
        localStorage.setItem('ontology_psychiatry_fix', 'true');
      }
    };
    checkOntology();
  }, []);

  useEffect(() => {
    triggerSpacedRepetitionNotification(false).catch(err => {
      console.warn('Background notification trigger suppressed:', err);
    });
  }, []);

  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <WouterRouter base={import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/' ? import.meta.env.BASE_URL.replace(/\/$/, '') : undefined}>
              <ProtectedApp />
            </WouterRouter>
          </ErrorBoundary>
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </TooltipProvider>
        </QueryClientProvider>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}

export default App;
