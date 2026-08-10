import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ArrowRight, Loader2, Key, Users, Activity, LogOut, 
  Copy, Upload, QrCode, CreditCard, ShieldCheck, Clock, RefreshCw, AlertCircle, FileImage, Sparkles, ChevronRight, ExternalLink
} from 'lucide-react';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { AtlasEmblem } from '@/components/AtlasEmblem';
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
  const { hasAccess, paymentStatus, paymentRejectionNote, loading: accessLoading } = useBetaAccess();
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
  const [activeTab, setActiveTab] = useState<'upi' | 'qr' | 'link'>('upi');

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

      // Adjust active tab based on enabled methods
      if (cfg.enableUpiTab) {
        setActiveTab('upi');
      } else if (cfg.enableQrTab) {
        setActiveTab('qr');
      } else if (cfg.enableLinkTab) {
        setActiveTab('link');
      }
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

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(payConfig.upiId || 'atlas@upi');
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
        // Compress image using canvas
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
          toast.success('Payment screenshot uploaded');
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
      toast.error('Please enter your UPI Reference Number / UTR');
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
        amount: payConfig.price,
        plan: `${payConfig.planTitle} (${payConfig.durationText})`
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
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#030303]">
        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
      </div>
    );
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
      {/* Sign Out Header Control */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors border border-white/5">
              <LogOut className="w-3.5 h-3.5" />
              Sign out
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

      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-teal-500/[0.025] rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-[560px] flex flex-col items-center my-8"
      >
        {/* Atlas Emblem Logo */}
        <div className="relative mb-8 flex items-center justify-center">
          <motion.div 
            animate={{ opacity: [0.1, 0.25, 0.1] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full scale-150"
          />
          <div className="w-16 h-16 rounded-[1.25rem] border border-white/10 bg-white/[0.02] flex items-center justify-center backdrop-blur-md relative z-10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
            <AtlasEmblem className="w-8 h-8" glow={true} />
          </div>
        </div>

        {/* Dynamic State View */}
        {(submitted || paymentStatus === 'pending') && !isResubmitting ? (
          /* ==================== STATE: PAYMENT SUBMITTED / AWAITING APPROVAL ==================== */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-[28px] p-6 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.7)] text-center space-y-6"
          >
            {/* Pulsing Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Payment Submitted — Verification Pending</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
                Payment Submitted
              </h1>
              <p className="text-[15px] text-zinc-300 font-medium leading-relaxed">
                Thank you.
              </p>
              <p className="text-[14px] text-zinc-400 leading-relaxed max-w-md mx-auto">
                Your payment is being verified. Most invitations are activated within a few hours. You'll receive access automatically once approved.
              </p>
            </div>

            {/* Submission Summary Card */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-left space-y-2 text-xs text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Account:</span>
                <span className="text-zinc-200 font-medium">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-zinc-500">Plan:</span>
                <span className="text-teal-400 font-medium">{payConfig.planTitle} ({payConfig.currencySymbol}{payConfig.price} / {payConfig.durationText})</span>
              </div>
              {upiReference && (
                <div className="flex items-center justify-between border-t border-white/5 pt-2 font-mono">
                  <span className="text-zinc-500 font-sans">UPI Reference:</span>
                  <span className="text-zinc-300">{upiReference}</span>
                </div>
              )}
            </div>

            {/* Re-check button & Return to Login */}
            <div className="pt-2 flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full h-12 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check Access Status</span>
              </button>

              <button 
                onClick={handleSignOut}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
              >
                Return to Login
              </button>
            </div>
          </motion.div>
        ) : paymentStatus === 'rejected' && !isResubmitting ? (
          /* ==================== STATE: REJECTED PAYMENT / RE-TRY ==================== */
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[#0a0a0a] border border-rose-500/20 rounded-[28px] p-6 sm:p-8 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.7)] text-center space-y-6"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-medium text-zinc-100">Verification Unsuccessful</h1>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                {paymentRejectionNote || 'We could not verify your UPI transaction reference or payment screenshot. Please double-check your payment details and re-submit.'}
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
              className="w-full h-12 rounded-2xl bg-teal-900/40 border border-teal-500/30 text-teal-200 font-medium text-xs hover:bg-teal-900/60 transition-all flex items-center justify-center gap-2"
            >
              <span>Re-submit Payment Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          /* ==================== DEFAULT STATE: COMPLETE YOUR INVITATION ==================== */
          <div className="w-full space-y-8">
            {/* Main Header */}
            <div className="text-center space-y-3">
              <h1 className="text-2xl sm:text-[30px] font-medium tracking-tight text-zinc-100">
                Complete Your Invitation
              </h1>
              <p className="text-[14px] text-zinc-400 leading-[1.6] max-w-[450px] mx-auto">
                {payConfig.instructionsText || "You're one step away from joining Atlas Closed Beta. Complete your membership payment below. Access is manually reviewed and usually activated within a few hours."}
              </p>
            </div>

            {/* Signed-in pill */}
            {user?.email && (
              <div className="flex justify-center">
                <div className="px-3.5 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-xs text-zinc-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>Signed in as <strong className="text-zinc-200 font-medium">{user.email}</strong></span>
                </div>
              </div>
            )}

            {/* Membership Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-[28px] p-6 sm:p-8 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.7)] space-y-8"
            >
              {/* Membership Pricing Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">{payConfig.planTitle || 'Closed Beta Membership'}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{payConfig.durationText} Cohort Pass</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-teal-400">{payConfig.currencySymbol}{payConfig.price}</div>
                  <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">{payConfig.durationText}</div>
                </div>
              </div>

              {/* Includes checklist */}
              <div className="space-y-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">Includes</span>
                <ul className="space-y-2.5">
                  {(payConfig.benefits && payConfig.benefits.length > 0 ? payConfig.benefits : [
                    "Full Atlas access",
                    "Continuous beta updates",
                    "Direct influence on future development"
                  ]).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </div>
                      <span className="text-[14px] text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Methods Section */}
              <div className="space-y-4 pt-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 block">Payment Method</span>
                
                {/* Method Tabs */}
                <div className="flex items-center gap-2 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-x-auto">
                  {payConfig.enableUpiTab && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('upi')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeTab === 'upi'
                          ? 'bg-zinc-800 text-teal-300 border border-teal-500/30'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      UPI ID
                    </button>
                  )}
                  {payConfig.enableQrTab && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('qr')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeTab === 'qr'
                          ? 'bg-zinc-800 text-teal-300 border border-teal-500/30'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      UPI QR Code
                    </button>
                  )}
                  {payConfig.enableLinkTab && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('link')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        activeTab === 'link'
                          ? 'bg-zinc-800 text-teal-300 border border-teal-500/30'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Card / Net Banking
                    </button>
                  )}
                </div>

                {/* Tab 1: UPI ID */}
                {activeTab === 'upi' && payConfig.enableUpiTab && (
                  <motion.div 
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[11px] text-zinc-500 block font-medium">UPI VPA</span>
                      <span className="text-base font-mono font-semibold text-zinc-100 tracking-wide">{payConfig.upiId || 'atlas@upi'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy UPI ID</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Tab 2: UPI QR Code */}
                {activeTab === 'qr' && payConfig.enableQrTab && (
                  <motion.div 
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex flex-col items-center text-center space-y-3"
                  >
                    <div className="p-3 bg-white rounded-2xl shadow-lg border border-zinc-200 relative group cursor-pointer" onClick={() => setShowQrModal(true)}>
                      {payConfig.upiQrUrl ? (
                        <img src={payConfig.upiQrUrl} alt="UPI QR" className="w-32 h-32 object-contain" />
                      ) : (
                        <svg viewBox="0 0 100 100" className="w-32 h-32">
                          <rect width="100" height="100" fill="#FFFFFF" />
                          <path d="M10 10h25v25H10zM15 15v15h15V15zM20 20h5v5h-5zM65 10h25v25H65zM70 15v15h15V15zM75 20h5v5h-5zM10 65h25v25H10zM15 70v15h15V70zM20 75h5v5h-5z" fill="#000000" />
                          <path d="M40 10h5v15h-5zm10 5h10v5H50zm-5 10h15v5H45zm-5 10h10v10H40zm15 0h10v5H55zm20 0h15v5H75zm-30 10h10v15H45zm15 5h10v10H60zm15-5h10v5H75zm10 10h5v15h-5zm-45 10h5v10h-5zm10-5h15v5H55zm20 0h10v10H75zm-15 10h10v5H60z" fill="#0D9488" />
                        </svg>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-medium">
                        Click to Expand
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-300 font-medium block">Scan using any UPI app</span>
                      <span className="text-[11px] text-zinc-500">Google Pay, PhonePe, Paytm, or BHIM ({payConfig.upiId || 'atlas@upi'})</span>
                    </div>
                  </motion.div>
                )}

                {/* Tab 3: Payment Link */}
                {activeTab === 'link' && payConfig.enableLinkTab && (
                  <motion.div 
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-medium text-zinc-200 block">Card / Net Banking / Payment Link</span>
                      <span className="text-[11px] text-zinc-500">Pay using credit/debit card, net banking, or Razorpay</span>
                    </div>
                    {payConfig.paymentLinkUrl ? (
                      <a
                        href={payConfig.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-xs font-medium flex items-center gap-1 shrink-0 transition-all"
                      >
                        <span>Open Payment Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopyUpi()}
                        className="px-3.5 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-xs font-medium flex items-center gap-1 shrink-0"
                      >
                        <span>Pay via UPI ID</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Form: Payment Proof & Ref */}
              <form onSubmit={handleSubmitPayment} className="space-y-5 pt-4 border-t border-white/[0.06]">
                {/* Upload Payment Proof */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                    <span>Payment Screenshot</span>
                    <span className="text-[11px] text-zinc-500 font-normal">Optional but speeds up verification</span>
                  </label>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {proofImage ? (
                    <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img src={proofImage} alt="Uploaded Proof" className="w-10 h-10 rounded-lg object-cover border border-teal-500/30 shrink-0" />
                        <div className="truncate">
                          <span className="text-xs font-medium text-teal-300 block truncate">{proofFileName || 'payment_proof.jpg'}</span>
                          <span className="text-[10px] text-teal-400/70">Screenshot attached</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProofImage(null);
                          setProofFileName(null);
                        }}
                        className="text-xs text-zinc-400 hover:text-rose-400 transition-colors px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-24 rounded-2xl border border-dashed border-white/15 bg-white/[0.01] hover:bg-white/[0.03] hover:border-teal-500/40 transition-all flex flex-col items-center justify-center gap-1.5 text-zinc-400 group"
                    >
                      <Upload className="w-5 h-5 text-zinc-500 group-hover:text-teal-400 transition-colors" />
                      <span className="text-xs font-medium text-zinc-300">[ Upload Payment Screenshot ]</span>
                      <span className="text-[10px] text-zinc-500">PNG, JPG or WEBP up to 10MB</span>
                    </button>
                  )}
                </div>

                {/* Transaction Reference */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block">
                    Transaction Reference <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={upiReference}
                    onChange={(e) => setUpiReference(e.target.value)}
                    placeholder="12-digit UPI Reference / UTR Number"
                    className="w-full h-12 rounded-2xl bg-white/[0.03] border border-white/10 px-4 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30 transition-all"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Enter the UTR or UPI Reference Number shown in your payment app summary.
                  </p>
                </div>

                {/* Submit CTA */}
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full h-[54px] rounded-[20px] bg-teal-900/40 border border-teal-500/30 text-teal-100 font-medium text-[15px] transition-all duration-300 hover:bg-teal-900/60 hover:border-teal-500/50 hover:text-white active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  ) : (
                    <>
                      <span>I've Completed Payment</span>
                      <ArrowRight className="w-4 h-4 opacity-70" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Footer Trust Markers */}
            <div className="w-full flex items-start justify-between px-2 sm:px-4 text-center">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <Key className="w-4 h-4 text-zinc-500 mb-0.5" strokeWidth={1.5} />
                <span className="text-[12px] text-zinc-300 font-medium">Invite Only</span>
                <span className="text-[11px] text-zinc-500">Manual review & fast activation</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1 border-x border-white/5">
                <Users className="w-4 h-4 text-zinc-500 mb-0.5" strokeWidth={1.5} />
                <span className="text-[12px] text-zinc-300 font-medium">50 Seats</span>
                <span className="text-[11px] text-zinc-500">First Closed Beta cohort</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <Activity className="w-4 h-4 text-zinc-500 mb-0.5" strokeWidth={1.5} />
                <span className="text-[12px] text-zinc-300 font-medium">{payConfig.durationText} Access</span>
                <span className="text-[11px] text-zinc-500">Includes all updates</span>
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
                className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm"
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
                  <path d="M10 10h25v25H10zM15 15v15h15V15zM20 20h5v5h-5zM65 10h25v25H65zM70 15v15h15V15zM75 20h5v5h-5zM10 65h25v25H10zM15 70v15h15V70zM20 75h5v5h-5z" fill="#000000" />
                  <path d="M40 10h5v15h-5zm10 5h10v5H50zm-5 10h15v5H45zm-5 10h10v10H40zm15 0h10v5H55zm20 0h15v5H75zm-30 10h10v15H45zm15 5h10v10H60zm15-5h10v5H75zm10 10h5v15h-5zm-45 10h5v10h-5zm10-5h15v5H55zm20 0h10v10H75zm-15 10h10v5H60z" fill="#0D9488" />
                </svg>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-sm font-mono font-semibold text-teal-400 block">{payConfig.upiId || 'atlas@upi'}</span>
              <span className="text-xs text-zinc-400 block">Amount: {payConfig.currencySymbol}{payConfig.price} ({payConfig.durationText})</span>
            </div>

            <button 
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
