import { useEffect, Suspense, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { motion } from 'framer-motion';

import { BottomNav } from '@/components/BottomNav';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';
import { triggerSpacedRepetitionNotification } from '@/lib/pwaAndNotifications';
import { useAuth } from '@/hooks/useAuth';
import { syncEngine } from '@/db/syncEngine';
import { GlobalAnnouncements } from '@/components/GlobalAnnouncements';
import { OfflineLeaseBanner } from '@/components/OfflineLeaseBanner';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { repairAndRehydrateRevisionDates } from '@/lib/vaultSync';
import { runFSRSMigration } from '@/lib/fsrs-engine';
import { mergeAndDeduplicateAllSubjects, findDuplicateSubjectGroups } from '@/lib/subjectDeduplication';
import { db, dbEvents } from '@/db';
import { lazyWithRetry } from '@/lib/lazyWithRetry';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { DynamicIslandCapsule } from '@/components/ai/DynamicIslandCapsule';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const NotFound = lazyWithRetry(() => import('@/pages/not-found'));
const Timeline = lazyWithRetry(() => import('@/features/timeline/Timeline'));
const Settings = lazyWithRetry(() => import('@/features/settings/Settings'));
const SubjectDetail = lazyWithRetry(() => import('@/features/subjects/SubjectDetail'));
const MistakeRecoveryQueue = lazyWithRetry(() => import('@/features/mistakes/MistakeRecoveryQueue'));
const SubjectRadarPage = lazyWithRetry(() => import('@/features/radar/SubjectRadarPage'));
const AdminDashboard = lazyWithRetry(() => import('@/features/admin/AdminDashboard'));
const Onboarding = lazyWithRetry(() => import('@/pages/Onboarding'));
const BetaAccess = lazyWithRetry(() => import('@/pages/BetaAccess'));
const Analytics = lazyWithRetry(() => import('@/features/analytics/Analytics'));
const AffiliatePartnerPage = lazyWithRetry(() => import('@/features/affiliate/AffiliatePartnerPage'));
import Home from '@/features/dashboard/Home';
import { GlobalQuickEntry } from '@/components/ui/GlobalQuickEntry';

export default function ProtectedApp() {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, paymentStatus, isTrialExpired, loading: accessLoading } = useBetaAccess();
  const { hasOnboarded, loading: onboardingLoading } = useOnboardingStatus();
  const { isImpersonating } = useImpersonation();
  const { isCollapsed } = useSidebar();
  const [location, setLocation] = useLocation();
  const [syncLoading, setSyncLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    syncEngine.coldBootPromise.then(() => {
      if (isMounted) {
        setSyncLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let hasRun = false;
    const checkOntologyAndRehydrate = async () => {
      try {
        await db.subjects.ready;
        const count = await db.subjects.count();
        if (count > 0) {
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
    triggerSpacedRepetitionNotification(false).catch((err) => {
      console.warn('Initial background notification check suppressed:', err);
    });
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerSpacedRepetitionNotification(false).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(() => {
      triggerSpacedRepetitionNotification(false).catch(() => {});
    }, 30 * 60 * 1000);
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

  useEffect(() => {
    if (!authLoading && !accessLoading && !onboardingLoading) {
      const isAdminRoute = location.startsWith('/admin');

      if (!user) {
        if (location !== '/') {
          setLocation('/');
        }
      } else if (user) {
        if (isAdminRoute && !isImpersonating) {
          // If not impersonating, ensure admin has access, else redirect (omitted here as backend rules handle read access, but we can allow admin routes to load)
        }

        if (hasOnboarded === false && location !== '/onboarding' && !isAdminRoute) {
          setLocation('/onboarding');
          return;
        }

        if (hasOnboarded === true && location === '/onboarding') {
          setLocation('/');
          return;
        }

        if (!accessLoading && !hasAccess && isTrialExpired) {
          window.dispatchEvent(new CustomEvent('open-paywall-modal', {
            detail: { trigger: 'trial_expired' }
          }));
        }

        if (location === '/beta-access' || location === '/accept-invitation' || location === '/join') {
          setLocation('/');
        }
      }
    }
  }, [user, authLoading, hasAccess, paymentStatus, isTrialExpired, accessLoading, onboardingLoading, hasOnboarded, location, setLocation, isImpersonating]);

  if (authLoading || accessLoading || onboardingLoading || (user && syncLoading)) {
    return <AtlasLoadingScreen fullScreen message="Synchronizing clinical database..." />;
  }

  if (location.startsWith('/admin')) {
    return (
      <div className="min-h-dvh flex flex-col w-full">
        {isImpersonating && <ImpersonationBanner />}
        <Suspense fallback={<AtlasLoadingScreen fullScreen />}>
          <AdminDashboard />
        </Suspense>
      </div>
    );
  }

  if (location === '/onboarding' || (user && hasOnboarded === false && !location.startsWith('/admin'))) {
    return (
      <div className="min-h-dvh flex flex-col w-full">
        {isImpersonating && <ImpersonationBanner />}
        <Suspense fallback={<AtlasLoadingScreen fullScreen message="Loading calibration wizard..." />}>
          <Onboarding />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh w-full relative bg-background text-foreground overflow-x-hidden">
      {isImpersonating && <ImpersonationBanner />}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 w-full relative">
        <div className="pointer-events-none fixed inset-0 z-0 bg-meridian opacity-40 mix-blend-overlay dark:opacity-20 max-w-full overflow-hidden" />
        <div className="pointer-events-none fixed top-[50%] left-[50%] w-[100vw] h-[100vw] max-w-[600px] max-h-[600px] meridian-ring opacity-20" />
        <div className="pointer-events-none fixed top-[50%] left-[50%] w-[80vw] h-[80vw] max-w-[450px] max-h-[450px] meridian-ring opacity-30" />
        
        <GlobalQuickEntry />
        <GlobalAnnouncements />
        <DynamicIslandCapsule />
        <BottomNav />
        
        <div
          className={cn(
            "flex-1 min-w-0 w-full relative z-10 transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col min-h-dvh",
            isCollapsed ? "md:pl-[72px]" : "md:pl-64 lg:pl-72"
          )}
        >          
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
                <Route path="/partner" component={AffiliatePartnerPage} />
                <Route path="/affiliate" component={AffiliatePartnerPage} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
