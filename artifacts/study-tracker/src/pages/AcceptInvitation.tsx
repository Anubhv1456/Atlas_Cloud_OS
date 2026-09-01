import { useLexicon } from '@/lib/lexicon';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Check, Sparkles, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { getPaymentConfig, PaymentConfig, DEFAULT_PAYMENT_CONFIG } from '@/lib/admin';
import { getReferralCodeDetails, claimReferralCode, ReferralCodeDoc, getReferralConfig } from '@/lib/referral';
import { toast } from 'sonner';

export default function AcceptInvitation() {
  const lexicon = useLexicon();

  const { user, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const [payConfig, setPayConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [referralDoc, setReferralDoc] = useState<ReferralCodeDoc | null>(null);
  const [refCode, setRefCode] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    getPaymentConfig().then(cfg => {
      if (mounted && cfg) setPayConfig(cfg);
    }).catch(console.error);

    // Parse referral code from URL search or sessionStorage
    let detectedRef = '';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      detectedRef = params.get('ref') || sessionStorage.getItem('atlas_pending_ref_code') || '';
    }

    if (detectedRef) {
      setRefCode(detectedRef.trim().toUpperCase());
      getReferralCodeDetails(detectedRef).then(doc => {
        if (mounted && doc) setReferralDoc(doc);
      }).catch(console.error);
    }

    return () => { mounted = false; };
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    try {
      if (!user) {
        // Authenticate with Google first
        await signInWithGoogle();
        return; // onAuthStateChanged will update user and re-render
      }

      const activeCode = refCode || sessionStorage.getItem('atlas_pending_ref_code');
      if (activeCode) {
        const res = await claimReferralCode(activeCode, user);
        if (res.success) {
          toast.success('15-Day Study Pass Activated 🎉', {
            description: `${res.trialDaysAwarded || 15}-Day full access granted for your exam preparation.`
          });
          localStorage.setItem(`invitation_accepted_${user.uid}`, 'true');
          setTimeout(() => {
            setLocation('/');
          }, 500);
        } else {
          toast.error(res.message || 'Invalid or expired invite pass');
          setLoading(false);
          return;
        }
      } else {
        localStorage.setItem(`invitation_accepted_${user.uid}`, 'true');
        setTimeout(() => {
          setLocation('/');
        }, 500);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to activate study pass: ' + (e.message || 'Unknown error'));
      setLoading(false);
    }
  };

  // Generate static starfield
  const stars = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      size: Math.random() * 2 + 1 + 'px',
      opacity: Math.random() * 0.4 + 0.1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 4
    }));
  }, []);

  const inviterName = referralDoc?.ownerDisplayName || 'A Medical Batchmate';
  const badgeText = referralDoc 
    ? `Pass from ${inviterName}` 
    : (payConfig.cohortBadgeText || `${payConfig.totalSeats || 200} Study Passes Available`);

  return (
    <div className="min-h-[100dvh] bg-[#030303] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-teal-500/30">
      
      {/* Starfield Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-[#030303] to-[#030303] opacity-80" />
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{ 
              top: star.top, 
              left: star.left, 
              width: star.size, 
              height: star.size, 
              opacity: star.opacity 
            }}
            animate={{ opacity: [star.opacity, star.opacity + 0.5, star.opacity] }}
            transition={{ 
              duration: star.duration, 
              repeat: Infinity, 
              ease: "easeInOut", 
              delay: star.delay 
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay z-0" />
      
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10 flex flex-col items-center"
      >
        {/* Prominent Logo */}
        <div className="relative mb-8 flex items-center justify-center">
          <motion.div 
            animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.15, 1] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-teal-500/30 blur-[40px] rounded-full"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="w-20 h-20 rounded-[1.5rem] border border-white/10 bg-[#0a0a0a]/80 flex items-center justify-center backdrop-blur-xl relative z-10 shadow-[0_0_80px_-12px_rgba(20,184,166,0.3)]"
          >
             <svg className="w-10 h-10 text-teal-400" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="atlasNavEmblemGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="12" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <g transform="translate(0, 15)">
                <path d="M256,60 C256,105 263.5,112.5 308.5,112.5 C263.5,112.5 256,120 256,165 C256,120 248.5,112.5 203.5,112.5 C248.5,112.5 256,105 256,60 Z" fill="#84f6d4" filter="url(#atlasNavEmblemGlow)" />
                <path d="M256,112.5 L76,390 L256,315 Z" fill="#20b59b" />
                <path d="M256,112.5 L436,390 L256,315 Z" fill="#64748b" />
              </g>
             </svg>
          </motion.div>
        </div>

        {/* Content Card */}
        <div className="w-full bg-[#0a0a0a]/75 backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-7 sm:p-9 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-5 max-w-[320px] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <span className="truncate">{badgeText}</span>
          </div>
          
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-100 mb-2.5">
            {referralDoc ? '15-Day Study Pass' : 'Batchmate Pass Verified'}
          </h1>
          
          <p className="text-[14px] text-zinc-400 leading-relaxed mb-8 max-w-[340px]">
            {referralDoc ? (
              <>
                You've been invited by <strong className="text-zinc-100 font-semibold">{inviterName}</strong> to join Atlas. Your 15-day study pass unlocks the SDSR recommendation engine and custom revision schedules for your medical exam.
              </>
            ) : user ? (
              <>
                Welcome, <strong className="text-zinc-200 font-medium">{user.email}</strong>. Your study pass has been activated.
              </>
            ) : (
              <>
                Sign in with your Google account to claim your 15-day pass and activate your personalized medical revision schedule.
              </>
            )}
          </p>

          {/* Key Value Bullets for Invited Peers */}
          {referralDoc && (
            <div className="w-full mb-8 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>15 Days Full Access to SDSR Spaced Recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{lexicon.mistakesJournal} Mistake Extraction & Flash Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Calibrated for NEET PG, INICET, NEXT & USMLE</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-4 rounded-2xl text-[14.5px] font-semibold transition-all shadow-[0_2px_12px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" />
            ) : (
              <>
                {user ? (
                  <>
                    <Check className="w-[18px] h-[18px] relative z-10 text-teal-700" />
                    <span className="relative z-10 tracking-wide">
                      {referralDoc ? 'Activate 15-Day Study Pass' : 'Enter Atlas'}
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 relative z-10" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="relative z-10 tracking-wide">Continue with Google to Claim Pass</span>
                  </>
                )}
              </>
            )}
          </button>
          
          <p className="text-[11.5px] text-zinc-500 mt-5 max-w-[280px]">
            No credit card required. Free 15-day pass for medical students & doctors.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
