import { useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UpgradePaywallModal } from "@/components/UpgradePaywallModal";
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { BottomNav } from '@/components/BottomNav';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';
import { triggerSpacedRepetitionNotification } from '@/lib/pwaAndNotifications';
import { AuthProvider, useAuth } from '@/hooks/useAuth';


import { GlobalAnnouncements } from '@/components/GlobalAnnouncements';
import { OfflineLeaseBanner } from '@/components/OfflineLeaseBanner';
import { AudioPermissionBanner } from '@/components/AudioPermissionBanner';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { repairAndRehydrateRevisionDates } from '@/lib/vaultSync';
import { runFSRSMigration } from '@/lib/fsrs-engine';
import { mergeAndDeduplicateAllSubjects, findDuplicateSubjectGroups } from '@/lib/subjectDeduplication';
import { AutoSyncEngine } from '@/components/AutoSyncEngine';
import { db, dbEvents } from '@/db';

import { lazy } from 'react';

import Home from '@/features/dashboard/Home';
const NotFound = lazy(() => import('@/pages/not-found'));

const Landing = lazy(() => import('@/pages/Landing'));
const AcceptInvitation = lazy(() => import('@/pages/AcceptInvitation'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const Contact = lazy(() => import('@/pages/Contact'));
const BetaAccess = lazy(() => import('@/pages/BetaAccess'));
const AdminDashboard = lazy(() => import('@/features/admin/AdminDashboard'));
const Analytics = lazy(() => import('@/features/analytics/Analytics'));
const Settings = lazy(() => import('@/features/settings/Settings'));
const Timeline = lazy(() => import('@/features/timeline/Timeline'));
const SubjectDetail = lazy(() => import('@/features/subjects/SubjectDetail'));
const MistakeRecoveryQueue = lazy(() => import('@/features/mistakes/MistakeRecoveryQueue'));
const SubjectRadarPage = lazy(() => import('@/features/radar/SubjectRadarPage'));
import { DynamicIslandCapsule } from '@/components/ai/DynamicIslandCapsule';


import { useBetaAccess } from '@/hooks/useBetaAccess';

const queryClient = new QueryClient();

const initTheme = () => {
  if (typeof window !== 'undefined') {
    try {
      const isDark = localStorage.getItem('theme') === 'dark';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      const savedMode = localStorage.getItem('atlas_theme_mode') || 'atlas';
      document.documentElement.setAttribute('data-theme', savedMode);
    } catch (e) {
      console.warn('localStorage access fallback to light theme', e);
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'atlas');
    }
  }
};
initTheme();

function ProtectedApp() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, paymentStatus, loading: accessLoading } = useBetaAccess();
  const { isCollapsed } = useSidebar();
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
    <div className="flex flex-col md:flex-row min-h-dvh w-full relative bg-background text-foreground overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 bg-meridian opacity-40 mix-blend-overlay dark:opacity-20 max-w-full overflow-hidden" />
      <div className="pointer-events-none fixed top-[50%] left-[50%] w-[100vw] h-[100vw] max-w-[600px] max-h-[600px] meridian-ring opacity-20" />
      <div className="pointer-events-none fixed top-[50%] left-[50%] w-[80vw] h-[80vw] max-w-[450px] max-h-[450px] meridian-ring opacity-30" />
      <GlobalAnnouncements />
      <AutoSyncEngine />
      <DynamicIslandCapsule />
      <BottomNav />
      <div
        className={cn(
          "flex-1 min-w-0 w-full relative z-10 transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col min-h-dvh",
          isCollapsed ? "md:pl-[72px]" : "md:pl-64 lg:pl-72"
        )}
      >
        <AudioPermissionBanner />
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
              <Route path="/radar" component={SubjectRadarPage} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/mistakes" component={MistakeRecoveryQueue} />
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

import { GlobalQuickEntry } from '@/components/ui/GlobalQuickEntry';
import { CurriculumInitializationEngine } from '@/components/CurriculumInitializationEngine';
import { AppUpdateCapsule } from '@/components/AppUpdateCapsule';

function App() {
  useEffect(() => {
    let hasRun = false;
    const checkOntologyAndRehydrate = async () => {
      try {
        // Wait for Firestore initial snapshot load to avoid cold-boot race conditions
        await db.subjects.ready;
        const count = await db.subjects.count();
        if (count > 0) {
          // Check if there are any residual duplicate subjects from earlier sessions and safely merge
          const dups = await findDuplicateSubjectGroups();
          if (dups.length > 0) {
            await mergeAndDeduplicateAllSubjects();
          }
          if (!hasRun) {
            hasRun = true;
            await repairAndRehydrateRevisionDates();
            await runFSRSMigration();
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
              <CurriculumInitializationEngine>
                <ProtectedApp />
              </CurriculumInitializationEngine>
            </WouterRouter>
          </ErrorBoundary>
          <GlobalQuickEntry />
          <AppUpdateCapsule />
          <Toaster />
          <UpgradePaywallModal />
          <SonnerToaster position="top-center" richColors />
        </TooltipProvider>
        </QueryClientProvider>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
}

export default App;
