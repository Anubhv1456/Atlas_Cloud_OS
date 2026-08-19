import { useEffect, Suspense } from 'react';
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
import { OfflineLeaseBanner } from '@/components/OfflineLeaseBanner';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { repairAndRehydrateRevisionDates } from '@/lib/vaultSync';
import { mergeAndDeduplicateAllSubjects, findDuplicateSubjectGroups } from '@/lib/subjectDeduplication';
import { AutoSyncEngine } from '@/components/AutoSyncEngine';
import { db, dbEvents } from '@/db';

import NotFound from '@/pages/not-found';

import Home from '@/features/dashboard/Home';
import Landing from '@/pages/Landing';
import AcceptInvitation from '@/pages/AcceptInvitation';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import Contact from '@/pages/Contact';
import BetaAccess from '@/pages/BetaAccess';
import AdminDashboard from '@/features/admin/AdminDashboard';
import Analytics from '@/features/analytics/Analytics';
import Settings from '@/features/settings/Settings';
import Timeline from '@/features/timeline/Timeline';
import SubjectDetail from '@/features/subjects/SubjectDetail';
import MistakeRecoveryQueue from '@/features/mistakes/MistakeRecoveryQueue';


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

  // Intercept incoming ?ref=... parameter and save to session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
        sessionStorage.setItem('atlas_pending_ref_code', refCode.trim().toUpperCase());
      }
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !accessLoading) {
      const isPublic = ['/privacy', '/terms', '/contact', '/accept-invitation', '/join'].includes(location);
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
          if (location !== '/beta-access' && location !== '/accept-invitation' && location !== '/join') {
            setLocation('/beta-access');
          }
        } else if (hasAccess && (location === '/beta-access' || location === '/accept-invitation' || location === '/join')) {
          setLocation('/');
        }
      }
    }
  }, [user, authLoading, hasAccess, paymentStatus, accessLoading, location, setLocation]);

  if (authLoading || accessLoading) {
    return <AtlasLoadingScreen fullScreen message="Calibrating study schedule..." />;
  }

  if (location === '/privacy') {
    return (
      <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
        <PrivacyPolicy />
      </Suspense>
    );
  }

  if (location === '/terms') {
    return (
      <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
        <TermsOfService />
      </Suspense>
    );
  }

  if (location === '/contact') {
    return (
      <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
        <Contact />
      </Suspense>
    );
  }

  if (location.startsWith('/admin')) {
    return (
      <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  if (location === '/accept-invitation' || location === '/join') {
    return (
      <Suspense fallback={<AtlasLoadingScreen fullScreen message="Verifying study pass..." />}>
        <AcceptInvitation />
      </Suspense>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
        <Landing />
      </Suspense>
    );
  }

  if (location === '/beta-access' || !hasAccess) {
    return (
      <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
        <BetaAccess />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full relative">
      <div className="pointer-events-none fixed inset-0 z-0 bg-meridian opacity-40 mix-blend-overlay dark:opacity-20 max-w-full overflow-hidden" />
      <div className="pointer-events-none fixed top-[50%] left-[50%] w-[100vw] h-[100vw] max-w-[600px] max-h-[600px] meridian-ring opacity-20" />
      <div className="pointer-events-none fixed top-[50%] left-[50%] w-[80vw] h-[80vw] max-w-[450px] max-h-[450px] meridian-ring opacity-30" />
      <GlobalAnnouncements />
      <AutoSyncEngine />
      <BottomNav />
      <div className="flex-1 w-full relative z-10 md:pl-64 lg:pl-72 transition-all duration-300 flex flex-col min-h-screen">
        <OfflineLeaseBanner />
        <motion.main
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full flex-1 flex flex-col"
        >
          <Suspense fallback={<AtlasLoadingScreen />}>
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
    let hasRun = false;
    const checkOntologyAndRehydrate = async () => {
      try {
        // Wait for Firestore initial snapshot load to avoid cold-boot race conditions
        await db.subjects.ready;
        const count = await db.subjects.count();
        if (count === 0) {
          await loadUniversalOntology();
        } else {
          // Check if there are any residual duplicate subjects from earlier sessions and safely merge
          const dups = await findDuplicateSubjectGroups();
          if (dups.length > 0) {
            await mergeAndDeduplicateAllSubjects();
          }
          if (!hasRun) {
            hasRun = true;
            await repairAndRehydrateRevisionDates();
          }
        }
      } catch (err) {
        console.warn('Initial ontology verification or schedule rehydration deferred:', err);
      }
    };

    checkOntologyAndRehydrate();

    const handleInitialSync = (table?: string) => {
      if (!hasRun && (table === 'subjects' || table === 'curriculumSets')) {
        checkOntologyAndRehydrate();
      }
    };
    dbEvents.on('change', handleInitialSync);

    return () => {
      dbEvents.off('change', handleInitialSync);
    };
  }, []);

  useEffect(() => {
    // 1. Initial trigger attempt on app launch
    triggerSpacedRepetitionNotification(false).catch((err) => {
      console.warn('Initial background notification check suppressed:', err);
    });

    // 2. Trigger check when student returns to the tab/PWA window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerSpacedRepetitionNotification(false).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Periodic check every 30 minutes while app is alive
    const interval = setInterval(() => {
      triggerSpacedRepetitionNotification(false).catch(() => {});
    }, 30 * 60 * 1000);

    // 4. Trigger immediately if settings were updated
    const handleSettingsUpdated = () => {
      triggerSpacedRepetitionNotification(false).catch(() => {});
    };
    window.addEventListener('notification-settings-updated', handleSettingsUpdated);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
      window.removeEventListener('notification-settings-updated', handleSettingsUpdated);
    };
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
