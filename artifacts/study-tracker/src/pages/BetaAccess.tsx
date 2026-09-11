import { useLexicon } from '@/lib/lexicon';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Check, ArrowRight, Loader2, Users, LogOut, 
  Brain, Target, Sparkles, CreditCard, RefreshCw
} from 'lucide-react';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useAuth } from '@/hooks/useAuth';
import { useExamProfile } from '@/hooks/useExamProfile';
import { useLocation } from 'wouter';
import { AtlasEmblem } from '@/components/AtlasEmblem';
import { AtlasLoadingScreen } from '@/components/AtlasLoadingScreen';
import { getPaymentConfig, PaymentConfig, DEFAULT_PAYMENT_CONFIG } from '@/lib/admin';
import { toast } from 'sonner';

export default function BetaAccess() {
  const lexicon = useLexicon();
  const { 
    hasAccess, 
    paymentStatus, 
    loading: accessLoading 
  } = useBetaAccess();
  
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { profile } = useExamProfile();

  const [payConfig, setPayConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

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

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Sign-in required to continue to checkout.');
      return;
    }

    setLoadingCheckout(true);
    try {
      const idToken = await user.getIdToken();
      const currentAffiliate = localStorage.getItem('atlas_affiliate_id') || sessionStorage.getItem('atlas_pending_ref_code') || '';

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ affiliateId: currentAffiliate }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Checkout session creation failed (${response.status})`);
      }

      const { checkout_url, session_id } = await response.json();

      if (!checkout_url) {
        throw new Error('Payment gateway did not return a valid checkout URL');
      }

      if (session_id) {
        localStorage.setItem('pending_dodo_session_id', session_id);
      }

      window.location.href = checkout_url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Failed to initialize secure checkout. Please try again.');
      setLoadingCheckout(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setLocation('/login');
  };

  if (accessLoading || authLoading || configLoading) {
    return <AtlasLoadingScreen fullScreen />;
  }

  // If user already has beta access (paid), redirect them back to the app immediately
  if (hasAccess) {
    setLocation('/');
    return null; // Return null so we don't render a flash of the checkout page
  }

  const cohortHeaderTitle = payConfig.cohortHeaderTitle || 'LIFETIME ACCESS • MEDICAL COHORT';

  return (
    <div className="min-h-[100dvh] bg-[#030303] text-zinc-100 flex flex-col items-center justify-center p-4 relative font-sans selection:bg-teal-500/30 overflow-x-hidden">
      
      {/* Navbar with sign out */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2 text-zinc-400">
          <Users className="w-4 h-4" />
          <span className="text-xs font-medium font-mono">{user?.email}</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10 my-12"
      >
        <div className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-[28px] p-6 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] text-center space-y-8 relative overflow-hidden">
          
          {/* Ambient inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-sm h-32 bg-teal-500/10 blur-[60px] pointer-events-none" />
          
          {/* Header */}
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] text-zinc-400 text-[11px] font-mono font-medium tracking-wide">
              <span>{cohortHeaderTitle}</span>
            </div>
            
            <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-zinc-100 leading-tight">
              Unlock the <span className="text-teal-400">Atlas Engine</span>
            </h1>
            <p className="text-[13px] text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
              You have reached your milestone capacity. Upgrade to secure lifetime access to the complete medical platform.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-3 text-left relative z-10">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-200">Unlimited Active Systems</div>
                <div className="text-[11px] text-zinc-500">Track all {profile.targetExam?.includes('USMLE') ? 'organ systems' : '19 disciplines'} simultaneously.</div>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-200">Infinite Mistake Vault</div>
                <div className="text-[11px] text-zinc-500">Recover from unlimited clinical and theoretical errors.</div>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-200">Advanced SDSR Tuning</div>
                <div className="text-[11px] text-zinc-500">Unlimited recalibrations to your exact exam date.</div>
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="pt-2 space-y-4 relative z-10">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">One-Time Secure Payment</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl text-zinc-500 line-through font-medium">
                  {payConfig.currencySymbol}{payConfig.strikePriceCents / 100}
                </span>
                <span className="text-3xl font-medium tracking-tight text-white">
                  {payConfig.currencySymbol}{payConfig.priceCents / 100}
                </span>
              </div>
            </div>
            
            {paymentStatus === 'pending' ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-xs text-amber-400 font-medium">Payment verification pending...</span>
                <span className="text-[10px] text-amber-400/70 text-center">Your bank is processing the transaction. Refresh if you have completed payment.</span>
              </div>
            ) : (
              <button 
                onClick={handleCheckout}
                disabled={loadingCheckout}
                className="w-full h-12 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer group"
              >
                {loadingCheckout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Purchase Lifetime Access</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}
            
            <p className="text-[10px] text-zinc-500 px-4 leading-relaxed">
              By proceeding, you agree to our Terms of Service. Secure payments processed via Dodo Payments. Your seat is fully protected under our 7-day refund guarantee; contact us anytime for assistance.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
