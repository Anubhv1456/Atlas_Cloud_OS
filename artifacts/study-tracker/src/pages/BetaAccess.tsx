import { useLexicon } from '@/lib/lexicon';
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, ArrowRight, Loader2, Users, LogOut, 
  Copy, Upload, RefreshCw, AlertCircle, ExternalLink,
  Smartphone, Brain, Target, ShieldCheck, Sparkles, Zap, Clock,
  Calendar, Sliders
} from 'lucide-react';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useAuth } from '@/hooks/useAuth';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useLocation } from 'wouter';
import { AtlasEmblem } from '@/components/AtlasEmblem';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { getPaymentConfig, PaymentConfig, DEFAULT_PAYMENT_CONFIG } from '@/lib/admin';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BetaAccess() {
  const lexicon = useLexicon();


  const { 
    hasAccess, 
    paymentStatus, 
    paymentRejectionNote, 
    vaultActivationRequired, 
    vaultProvenance, 
    isTrial,
    hasClaimedTrial,
    isTrialExpired,
    trialDaysRemaining,
    claimTrial,
    loading: accessLoading 
  } = useBetaAccess();
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { profile } = useExamProfile();

  const daysUntilExam = React.useMemo(() => {
    if (!profile.targetExamDate) return null;
    const target = new Date(profile.targetExamDate);
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  }, [profile.targetExamDate]);

  const formattedExamDate = React.useMemo(() => {
    if (!profile.targetExamDate) return null;
    const d = new Date(profile.targetExamDate);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [profile.targetExamDate]);

  // Dynamic Payment Settings Config
  const [payConfig, setPayConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);

  const [transitioning, setTransitioning] = useState(false);
  const [transitionStep, setTransitionStep] = useState(0);
  const [claimingTrial, setClaimingTrial] = useState(false);

  const isAffiliateReferred = typeof window !== 'undefined' && Boolean(localStorage.getItem('atlas_affiliate_id'));
  const trialDays = isAffiliateReferred ? 14 : 7;

  const handleClaimTrial = async () => {
    setClaimingTrial(true);
    try {
      const ok = await claimTrial(trialDays);
      if (ok) {
        toast.success(`🎉 ${trialDays}-Day Clinical Trial Activated!`);
      } else {
        toast.error('Unable to activate trial right now. Please retry or contact support.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to activate trial');
    } finally {
      setClaimingTrial(false);
    }
  };

  // Load live Payment Config from Firestore
  useEffect(() => {
    let mounted = true;
    getPaymentConfig().then(cfg => {
      if (!mounted) return;
      setPayConfig(cfg);
      setConfigLoading(false);
    }).catch(err => {
      console.error('Failed to load payment config', err);
      setConfigLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // If user already has beta access granted, show setup transition then redirect to app
  useEffect(() => {
    if (hasAccess && !accessLoading) {
      if (!transitioning) {
        setTransitioning(true);
        setTimeout(() => setTransitionStep(1), 600);
        setTimeout(() => setTransitionStep(2), 1400);
        setTimeout(() => setTransitionStep(3), 2200);
        setTimeout(() => setLocation('/'), 3200);
      }
    }
  }, [hasAccess, accessLoading, setLocation, transitioning]);

  const cohortHeaderTitle = payConfig.cohortHeaderTitle || 'CLOSED BETA • 2026 MEDICAL COHORT';

  const handleSignOut = async () => {
    await logout();
    setLocation('/login');
  };

  if (accessLoading || authLoading || configLoading) {
    return <AtlasLoadingScreen fullScreen />;
  }

  // Approved Access Transition View
  if (transitioning) {
    return (
      <div className="min-h-[100dvh] bg-[#030303] text-zinc-100 flex flex-col items-center justify-center p-4 relative font-sans selection:bg-teal-500/30">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center max-w-md w-full"
        >
          <div className="relative mb-8 flex items-center justify-center">
            <motion.div 
              animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }} 
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-zinc-800/50 blur-xl rounded-full"
            />
            <div className="w-16 h-16 rounded-[1.25rem] border border-white/10 bg-white/[0.02] flex items-center justify-center backdrop-blur-md relative z-10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
              <AtlasEmblem className="w-8 h-8 text-teal-400" glow={true} />
            </div>
          </div>
          
          <div className="text-center space-y-2 mb-10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-2 text-teal-400 font-medium"
            >
              <Check className="w-4 h-4" />
              <span>Beta Access Granted</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[17px] text-zinc-300"
            >
              Preparing your Atlas workspace...
            </motion.h2>
          </div>

          <div className="space-y-3 w-full max-w-[280px]">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: transitionStep >= 1 ? 1 : 0, x: transitionStep >= 1 ? 0 : -10 }}
              className="flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
              <span className="text-[13px] text-zinc-400">Setting up medical curriculum</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: transitionStep >= 2 ? 1 : 0, x: transitionStep >= 2 ? 0 : -10 }}
              className="flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
              <span className="text-[13px] text-zinc-400">Initializing recommendation engine</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: transitionStep >= 3 ? 1 : 0, x: transitionStep >= 3 ? 0 : -10 }}
              className="flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
              <span className="text-[13px] text-zinc-400">Configuring active recall space</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#030303] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-teal-500/30">
      
      {/* Background Teal Aura Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Controls */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-6 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center backdrop-blur-md">
            <AtlasEmblem className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-300">Atlas OS</span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/10 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                You will return to the login screen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-transparent hover:bg-white/5 hover:text-white text-zinc-300">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSignOut}
                className="bg-zinc-800 text-white hover:bg-zinc-700"
              >
                Sign out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-2xl"
      >
        {isTrialExpired || (hasClaimedTrial && !hasAccess) ? (
          /* Trial Concluded Card */
          <div className="w-full bg-[#0a0a0a] border border-amber-500/20 rounded-[28px] p-6 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-32 bg-amber-500/10 blur-[60px] pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium relative z-10">
              <Clock className="w-3.5 h-3.5" />
              <span>Trial Concluded</span>
            </div>

            <div className="space-y-3 relative z-10">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
                Your Clinical Trial Has Concluded
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                All your logged study blocks, mistake bookmarks, and FSRS memory metrics are safely preserved in your Atlas Vault. To unlock lifetime access, connect with your campus representative or administrator.
              </p>
            </div>

            {/* Account Info Brief */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-left space-y-2.5 text-xs text-zinc-400 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Candidate Email</span>
                <span className="text-zinc-200 font-mono font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                <span className="text-zinc-500">Vault Data Status</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Study Metrics Encrypted & Intact
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 relative z-10">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-all border border-white/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Verification Status</span>
              </button>
            </div>
          </div>
        ) : !hasClaimedTrial ? (
          /* Instant Trial Claim Card - Calibrated & Personalized */
          <div className="w-full bg-[#0a0a0a] border border-teal-500/30 rounded-[28px] p-6 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-32 bg-teal-500/15 blur-[60px] pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/40 border border-teal-500/40 text-teal-300 text-xs font-semibold relative z-10">
              <Zap className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {isAffiliateReferred 
                  ? `AMBASSADOR INVITATION (${trialDays}-DAY PASS)` 
                  : profile.targetExam 
                    ? `${profile.targetExam.toUpperCase()} CALIBRATION READY` 
                    : 'INSTANT ACCESS AVAILABLE'}
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
                Start Your {trialDays}-Day Clinical Trial
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                {profile.targetExam ? (
                  <>Your personalized <span className="text-zinc-200 font-medium">{profile.targetExam}</span> study roadmap is calibrated and ready. Begin studying immediately with full unrestricted access to your medical syllabus and active recall engines.</>
                ) : (
                  <>Begin studying immediately with full unrestricted access to the medical syllabus, active recall engines, and progress tracker. No credit card required.</>
                )}
              </p>
            </div>

            {/* Personalized Calibration Snapshot */}
            {profile.targetExam && (
              <div className="bg-white/[0.02] border border-teal-500/20 rounded-2xl p-4 text-left grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Target Exam</span>
                  <span className="text-xs font-bold text-teal-300 truncate block">{profile.targetExam}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Timeline</span>
                  <span className="text-xs font-bold text-zinc-200 block">
                    {daysUntilExam ? `${daysUntilExam} Days Left` : 'Self-Paced'}
                  </span>
                  {formattedExamDate && (
                    <span className="text-[10px] text-zinc-500 block truncate">{formattedExamDate}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Academic Stage</span>
                  <span className="text-xs font-bold text-zinc-200 truncate block">{profile.currentYear || 'MBBS Candidate'}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Daily Target</span>
                  <span className="text-xs font-bold text-zinc-200 block">{profile.dailyQuestionGoal || 40} Qs / Day</span>
                </div>
              </div>
            )}

            {/* Trial Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left relative z-10">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-zinc-200">
                  {profile.targetExam?.includes('USMLE') ? 'Organ Systems & Sciences' : '19 Medical Disciplines'}
                </div>
                <div className="text-[11px] text-zinc-500">First Aid aligned question taxonomy and subject trackers.</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-zinc-200">Mistake Recovery</div>
                <div className="text-[11px] text-zinc-500">Auto-prioritizes high-yield knowledge gaps and review queues.</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs font-medium text-zinc-200">FSRS Repetition</div>
                <div className="text-[11px] text-zinc-500">Adaptive scheduling algorithm calibrated specifically for med students.</div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2 flex flex-col gap-3 relative z-10">
              <button 
                onClick={handleClaimTrial}
                disabled={claimingTrial}
                className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_rgba(20,184,166,0.3)] cursor-pointer"
              >
                {claimingTrial ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating {trialDays}-Day Pass...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-black" />
                    <span>Activate {trialDays}-Day {profile.targetExam ? `${profile.targetExam} ` : ''}Instant Trial</span>
                  </>
                )}
              </button>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                <button 
                  onClick={() => setLocation('/onboarding')}
                  className="text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-teal-400" />
                  <span>Adjust Calibration Settings</span>
                </button>

                <button 
                  onClick={() => window.location.reload()}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Already Purchased? Check Status</span>
                </button>
              </div>
            </div>
            
            <p className="text-[11px] text-zinc-500 relative z-10">
              Trial runs for {trialDays} days from activation. All progress transfers seamlessly upon upgrading.
            </p>
          </div>
        ) : (
          /* Default Pending Activation Card */
          <div className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-[28px] p-6 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] text-center space-y-6 relative overflow-hidden">
            {/* Ambient inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-32 bg-teal-500/10 blur-[60px] pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/30 border border-teal-500/30 text-teal-400 text-xs font-medium relative z-10">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>Pending Activation</span>
            </div>

            <div className="space-y-3 relative z-10">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
                Your account is ready.
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                Your Atlas account has been successfully created but is currently locked. If you secured a Closed Beta spot through an authorized partner, your account will be unlocked automatically once settlement is confirmed.
              </p>
            </div>

            {/* Account Info Brief */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-left space-y-2.5 text-xs text-zinc-400 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Candidate Email</span>
                <span className="text-zinc-200 font-mono font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                <span className="text-zinc-500">Access Cohort</span>
                <span className="text-teal-400 font-medium">{cohortHeaderTitle}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                <span className="text-zinc-500">Status</span>
                <span className="text-amber-400 font-medium flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Awaiting Partner Confirmation
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 relative z-10">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-all border border-white/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Access Status</span>
              </button>
            </div>
            
            <p className="text-xs text-zinc-500 mt-4 relative z-10">
              This page will automatically update as soon as your access is granted. Please allow up to 12 hours for manual verification.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
