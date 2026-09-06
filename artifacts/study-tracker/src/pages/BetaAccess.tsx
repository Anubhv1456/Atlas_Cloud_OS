import { useLexicon } from '@/lib/lexicon';
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, ArrowRight, Loader2, Users, LogOut, 
  Copy, Upload, RefreshCw, AlertCircle, ExternalLink,
  Smartphone, Brain, Target, ShieldCheck, Sparkles, Zap
} from 'lucide-react';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { AtlasEmblem } from '@/components/AtlasEmblem';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { submitPaymentProof, getPaymentConfig, PaymentConfig, DEFAULT_PAYMENT_CONFIG } from '@/lib/admin';
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


  const { hasAccess, paymentStatus, paymentRejectionNote, vaultActivationRequired, vaultProvenance, loading: accessLoading } = useBetaAccess();
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Dynamic Payment Settings Config
  const [payConfig, setPayConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);

  // Local states for flow
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  // Payment form inputs
  const [upiReference, setUpiReference] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Transition animation state when access is approved
  const [transitioning, setTransitioning] = useState(false);
  const [transitionStep, setTransitionStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Sync state if user's payment is already pending in database
  useEffect(() => {
    if (paymentStatus === 'pending') {
      setSubmitted(true);
    }
  }, [paymentStatus]);

  const upiId = payConfig.upiId || 'atlas@upi';
  const price = payConfig.price || 499;
  const currency = payConfig.currencySymbol || '₹';
  const duration = payConfig.durationText || '3 Months';
  const totalSeats = payConfig.totalSeats ?? 200;
  const claimedSeats = payConfig.claimedSeats ?? 38;
  const cohortHeaderTitle = payConfig.cohortHeaderTitle || 'CLOSED BETA • 2026 MEDICAL COHORT';
  const fillPercentage = Math.min(100, Math.max(0, Math.round((claimedSeats / (totalSeats || 1)) * 100)));

  // Construct UPI deep link string for GPay / PhonePe / Paytm on mobile
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Atlas Medical OS')}&am=${price}&cu=INR&tn=${encodeURIComponent('Atlas Closed Beta Access')}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Image Upload Handler with Canvas Compression
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, or WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setProofFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setProofImage(compressedDataUrl);
          toast.success('Payment screenshot attached');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to complete invitation');
      return;
    }

    if (!upiReference.trim()) {
      toast.error('Please enter your 12-digit UPI Reference / UTR Number');
      return;
    }

    if (upiReference.trim().length < 6) {
      toast.error('Please enter a valid UPI Reference Number (at least 6 characters)');
      return;
    }

    setSubmitting(true);

    try {
      await submitPaymentProof({
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || '',
        upiReference: upiReference.trim(),
        proofUrl: proofImage || '',
        amount: price,
        plan: `${payConfig.planTitle || 'Closed Beta'} (${duration})`
      });

      setSubmitted(true);
      setIsResubmitting(false);
      toast.success('Payment submitted for manual verification!');
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      toast.error('Failed to submit payment proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
              className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full"
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
        {(submitted || paymentStatus === 'pending') && !isResubmitting ? (
          /* ==================== STATE: PAYMENT SUBMITTED / PENDING VERIFICATION ==================== */
          <div className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-[28px] p-6 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Verification Pending — Manual Review</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
                Payment Received
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                Your transaction proof has been logged for manual verification. Activation usually takes 1–3 hours during cohort enrollment window.
              </p>
            </div>

            {/* Transaction Brief */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-left space-y-2.5 text-xs text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Candidate Email</span>
                <span className="text-zinc-200 font-mono font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                <span className="text-zinc-500">Plan Activated</span>
                <span className="text-teal-400 font-medium">{payConfig.planTitle || 'Closed Beta'} ({currency}{price} / {duration})</span>
              </div>
              {upiReference && (
                <div className="flex items-center justify-between border-t border-white/5 pt-2.5">
                  <span className="text-zinc-500">UTR / Reference</span>
                  <span className="text-zinc-200 font-mono tracking-wider">{upiReference}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-all border border-white/10 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Access Status</span>
              </button>
              <button 
                onClick={handleSignOut}
                className="flex-1 h-12 rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-200 font-medium text-xs flex items-center justify-center transition-all border border-white/5 cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          </div>
        ) : paymentStatus === 'rejected' && !isResubmitting ? (
          /* ==================== STATE: REJECTED PAYMENT / RE-TRY ==================== */
          <div className="w-full bg-[#0a0a0a] border border-rose-500/20 rounded-[28px] p-6 sm:p-8 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-medium text-zinc-100">Verification Could Not Complete</h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                {paymentRejectionNote || 'We could not verify your UPI transaction reference or screenshot. Please verify your details and re-submit below.'}
              </p>
            </div>

            <button 
              type="button"
              onClick={() => {
                setIsResubmitting(true);
                setSubmitted(false);
                setUpiReference('');
                setProofImage(null);
                setProofFileName(null);
              }}
              className="w-full h-12 rounded-xl bg-teal-950/60 border border-teal-500/30 text-teal-200 font-medium text-xs hover:bg-teal-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Re-submit Payment Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* ==================== UNIFIED SINGLE-VIEW ENROLLMENT CANVAS ==================== */
          <div className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-[28px] p-6 sm:p-8 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.85)] space-y-6 relative overflow-hidden">
            
            {/* Vault Provenance Anti-Hopping Notice */}
            {vaultActivationRequired && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>High-Volume Study Vault Restored</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Your curriculum, custom notes, and {lexicon.mistakesJournal} mistakes ({vaultProvenance?.metrics?.subjectCount || 19} subjects, {vaultProvenance?.metrics?.totalStudyMinutes || 180}+ study minutes) are safely restored in your browser. To generate active recall recommendations and continuous SDSR scheduling, please activate your Atlas Pass.
                </p>
              </div>
            )}

            {/* Top Cohort Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  {cohortHeaderTitle}
                </div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
                  {vaultActivationRequired ? 'Activate Pass to Continue Study Streak' : 'Activate Your Medical OS'}
                </h1>
                <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
                  {vaultActivationRequired
                    ? 'Resume continuous automated spaced repetition, personalized weakness tracking, and NEET PG / INICET QBank analytics.'
                    : 'Join medical candidates using Atlas for automated spaced repetition, QBank analytics, and NEET PG / INICET preparation.'}
                </p>
              </div>

              {/* Price Tag & Seat Counter */}
              <div className="sm:text-right shrink-0 bg-white/[0.02] sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-white/5 sm:border-0 flex sm:flex-col justify-between items-center sm:items-end">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-teal-400 font-mono tracking-tight">
                    {currency}{price}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    {duration} Cohort Pass
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 mt-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                    <span>{claimedSeats} / {totalSeats} Seats Claimed</span>
                  </div>
                  <div className="w-28 sm:w-32 bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${fillPercentage}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Signed In User Pill */}
            {user?.email && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-zinc-400">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                  <span className="truncate">Enrolling candidate <strong className="text-zinc-200 font-mono font-medium">{user.email}</strong></span>
                </div>
                <span className="text-xs text-teal-400 font-semibold uppercase tracking-wider shrink-0 hidden sm:inline">Priority Queue</span>
              </div>
            )}

            {/* Main Unified Payment Canvas Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
              
              {/* Left Column (5/12): QR Code & Fast Mobile Intent */}
              <div className="lg:col-span-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col items-center text-center justify-between space-y-4">
                
                {/* QR Code Container */}
                <div 
                  className="p-3.5 bg-white rounded-2xl shadow-xl border border-zinc-200 group cursor-pointer relative" 
                  onClick={() => setShowQrModal(true)}
                  title="Click to view full screen"
                >
                  {payConfig.upiQrUrl ? (
                    <img src={payConfig.upiQrUrl} alt="UPI QR Code" className="w-36 h-36 object-contain" />
                  ) : (
                    <svg viewBox="0 0 100 100" className="w-36 h-36">
                      <rect width="100" height="100" fill="#FFFFFF" />
                      <path d="M10 10h25v25H10zM15 15v15h15V15zM20 20h5v5h-5zM65 10h25v25H65zM70 15v15h15V15zM75 20h5v5h-5zM10 65h25v25H10zM15 70v15h15V70zM20 75h5v5h-5z" fill="#000000" />
                      <path d="M40 10h5v15h-5zm10 5h10v5H50zm-5 10h15v5H45zm-5 10h10v10H40zm15 0h10v5H55zm20 0h15v5H75zm-30 10h10v15H45zm15 5h10v10H60zm15-5h10v5H75zm10 10h5v15h-5zm-45 10h5v10h-5zm10-5h15v5H55zm20 0h10v10H75zm-15 10h10v5H60z" fill="#0D9488" />
                    </svg>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                    Expand QR
                  </div>
                </div>

                {/* VPA Copy & Direct Mobile App Launch */}
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-xl border border-white/10 text-xs">
                    <span className="font-mono text-teal-300 font-semibold">{upiId}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Mobile Direct UPI Intent Link */}
                  <a
                    href={upiDeepLink}
                    className="w-full py-2.5 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/25 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pay via GPay / PhonePe App</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              </div>

              {/* Right Column (7/12): Verification Form */}
              <form onSubmit={handleSubmitPayment} className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                
                {/* Step 1: Transaction UTR / Ref Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-200 flex items-center justify-between">
                    <span>12-Digit Transaction UTR / Ref <span className="text-teal-400">*</span></span>
                    <span className="text-xs text-zinc-500 font-mono">Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={upiReference}
                    onChange={(e) => setUpiReference(e.target.value)}
                    placeholder="e.g. 423910842910"
                    className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/10 px-3.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
                  />
                  <p className="text-xs text-zinc-500 leading-tight">
                    Found in payment app receipt under UTR, Ref ID, or Transaction Reference.
                  </p>
                </div>

                {/* Step 2: Payment Screenshot Proof (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-200 flex items-center justify-between">
                    <span>Payment Screenshot</span>
                    <span className="text-xs text-zinc-500">Optional</span>
                  </label>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {proofImage ? (
                    <div className="p-2.5 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img src={proofImage} alt="Uploaded Proof" className="w-8 h-8 rounded-lg object-cover border border-teal-500/30 shrink-0" />
                        <div className="truncate">
                          <span className="text-xs font-medium text-teal-300 block truncate">{proofFileName || 'payment_proof.jpg'}</span>
                          <span className="text-xs text-teal-400/70">Screenshot attached</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProofImage(null);
                          setProofFileName(null);
                        }}
                        className="text-xs text-zinc-400 hover:text-rose-400 transition-colors px-2 py-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 rounded-xl border border-dashed border-white/15 bg-white/[0.01] hover:bg-white/[0.03] hover:border-teal-500/40 transition-all flex items-center justify-center gap-2 text-zinc-400 cursor-pointer group"
                    >
                      <Upload className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors" />
                      <span className="text-xs font-medium text-zinc-300">Attach Screenshot Proof</span>
                    </button>
                  )}
                </div>

                {/* Submit Action CTA */}
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-100 font-medium text-xs sm:text-sm transition-all duration-200 hover:bg-teal-900/80 hover:border-teal-500/60 hover:text-white active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-teal-400" />
                      <span>Complete Enrollment — Submit Payment</span>
                      <ArrowRight className="w-4 h-4 opacity-70" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* High-Yield Medical Value Highlights (Bottom Pillars) */}
            <div className="pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <Brain className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Spaced Repetition</div>
                  <div className="text-xs text-zinc-500">Automated memory decay</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <Target className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-zinc-200">QBank & PYQ Engine</div>
                  <div className="text-xs text-zinc-500">19 Subjects & systems</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-zinc-200">High-Yield Markers</div>
                  <div className="text-xs text-zinc-500">Peer pearls & clinical tips</div>
                </div>
              </div>
            </div>

          </div>
        )}
      </motion.div>

      {/* QR Modal Lightbox */}
      {showQrModal && (
        <div 
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Scan UPI QR Code</span>
              <button 
                onClick={() => setShowQrModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl flex items-center justify-center shadow-inner">
              {payConfig.upiQrUrl ? (
                <img src={payConfig.upiQrUrl} alt="UPI QR Code" className="w-48 h-48 object-contain" />
              ) : (
                <svg viewBox="0 0 100 100" className="w-48 h-48">
                  <rect width="100" height="100" fill="#FFFFFF" />
                  <path d="M10 10h25v25H10zM15 15v15h15V15zM20 20h5v5h-5zM65 10h25v25H65zM70 15v15h15V15zM75 20h5v5h-5zM10 65h25v25H10zM15 70v15h15V10zM20 75h5v5h-5z" fill="#000000" />
                  <path d="M40 10h5v15h-5zm10 5h10v5H50zm-5 10h15v5H45zm-5 10h10v10H40zm15 0h10v5H55zm20 0h15v5H75zm-30 10h10v15H45zm15 5h10v10H60zm15-5h10v5H75zm10 10h5v15h-5zm-45 10h5v10h-5zm10-5h15v5H55zm20 0h10v10H75zm-15 10h10v5H60z" fill="#0D9488" />
                </svg>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-sm font-mono font-semibold text-teal-400 block">{upiId}</span>
              <span className="text-xs text-zinc-400 block">Amount: {currency}{price} ({duration})</span>
            </div>

            <button 
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
