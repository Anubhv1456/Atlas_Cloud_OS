import { motion } from 'framer-motion';
import { Check, ArrowRight, Loader2, Key, Users, Activity, LogOut } from 'lucide-react';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { AtlasEmblem } from '@/components/AtlasEmblem';
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
  const { hasAccess, loading: accessLoading, grantAccess } = useBetaAccess();
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activating, setActivating] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionStep, setTransitionStep] = useState(0);

  useEffect(() => {
    if (hasAccess && !accessLoading) {
      setLocation('/migration');
    }
  }, [hasAccess, accessLoading, setLocation]);

  const handleActivate = async () => {
    setActivating(true);
    setTransitioning(true);
    
    // Sequence the steps
    setTimeout(() => setTransitionStep(1), 600);
    setTimeout(() => setTransitionStep(2), 1400);
    setTimeout(() => setTransitionStep(3), 2200);
    
    setTimeout(async () => {
      await grantAccess();
    }, 3200);
  };

  if (accessLoading || authLoading || (hasAccess && !transitioning)) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#030303]">
        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await logout();
    setLocation('/login');
  };

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
              <span>Invitation Accepted</span>
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
              <span className="text-[13px] text-zinc-400">Setting up your curriculum</span>
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
              <span className="text-[13px] text-zinc-400">Configuring your study profile</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#030303] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-teal-500/30">
      {/* Sign Out */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                You'll return to the Atlas login page.
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

      {/* Subtle radial teal glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/[0.03] rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-[540px] flex flex-col items-center"
      >
        {/* Glowing Atlas Emblem with Subtle Grid */}
        <div className="relative mb-12 flex items-center justify-center">
          {/* Subtle Grid/Constellation */}
          <div className="absolute inset-0 -m-16 opacity-30 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 3" className="text-teal-500" />
              <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.2" strokeDasharray="1 3" className="text-teal-500" />
              <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.2" className="text-teal-500/50" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.2" className="text-teal-500/50" />
            </svg>
          </div>

          <motion.div 
            animate={{ opacity: [0.1, 0.25, 0.1] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full scale-150"
          />
          <div className="w-16 h-16 rounded-[1.25rem] border border-white/10 bg-white/[0.02] flex items-center justify-center backdrop-blur-md relative z-10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
            <AtlasEmblem className="w-8 h-8" glow={true} />
          </div>
        </div>

        {/* Header Text */}
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-zinc-100">Access Atlas</h1>
          <p className="text-[15px] text-zinc-400 leading-[1.6] max-w-[420px] mx-auto">
            Atlas is available through a limited Closed Beta. Your invitation grants full access while helping shape the future of medical learning.
          </p>
        </div>

        {/* Scarcity Capsule & Personalization */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.01] text-[11px] font-medium tracking-wider text-zinc-500 uppercase">
            Invitations Open
          </span>
          {user?.email && (
            <div className="text-[13px] text-zinc-500">
              Signed in as <span className="text-zinc-300 font-medium">{user.email}</span>
            </div>
          )}
        </div>

        {/* Access Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="w-full bg-[#0a0a0a] border border-white/[0.06] rounded-[28px] p-6 sm:p-8 shadow-[0_16px_64px_-16px_rgba(0,0,0,0.6)]"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-base font-medium text-zinc-200">Closed Beta Invitation</h2>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/10">
              <span className="text-sm font-medium text-teal-400/90">₹499</span>
              <span className="text-[11px] text-teal-400/60 uppercase tracking-widest">/ 3 Months</span>
            </div>
          </div>

          {/* Bullet Points */}
          <ul className="space-y-4 mb-10">
            {[
              "Full access to Atlas Closed Beta",
              "Continuous feature updates during beta",
              "Help influence future product direction",
              "Limited to a small cohort of early members"
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-zinc-500 shrink-0" strokeWidth={2} />
                <span className="text-[15px] text-zinc-300">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Primary CTA */}
          <button 
            onClick={handleActivate}
            disabled={activating}
            className="w-full h-[54px] rounded-[18px] bg-teal-900/40 border border-teal-500/20 text-teal-100/90 font-medium text-[15px] transition-all duration-300 hover:bg-teal-900/60 hover:border-teal-500/30 hover:text-teal-50 active:bg-teal-950 flex items-center justify-center gap-2 group"
          >
            {activating ? (
               <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            ) : (
              <>
                <span>Accept Invitation</span>
                <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
          
          {/* Secondary Info */}
          <p className="text-center text-[12px] text-zinc-500 mt-5">
            Your study workspace is created immediately after activation.
          </p>
        </motion.div>

        {/* Trust Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full mt-10 flex items-start justify-between px-2 sm:px-4 text-center"
        >
          <div className="flex flex-col items-center gap-2 flex-1">
            <Key className="w-4 h-4 text-zinc-500 mb-1" strokeWidth={1.5} />
            <span className="text-[12px] text-zinc-300 font-medium">Invite Only</span>
            <span className="text-[11px] text-zinc-500">Carefully selected members</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1 border-x border-white/5">
            <Users className="w-4 h-4 text-zinc-500 mb-1" strokeWidth={1.5} />
            <span className="text-[12px] text-zinc-300 font-medium">20 Seats</span>
            <span className="text-[11px] text-zinc-500">Small beta cohort</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <Activity className="w-4 h-4 text-zinc-500 mb-1" strokeWidth={1.5} />
            <span className="text-[12px] text-zinc-300 font-medium">Built Together</span>
            <span className="text-[11px] text-zinc-500">Your feedback shapes Atlas</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
