import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Check } from 'lucide-react';

export default function AcceptInvitation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleAccept = () => {
    setLoading(true);
    if (user) {
      localStorage.setItem(`invitation_accepted_${user.uid}`, 'true');
    }
    setTimeout(() => {
      setLocation('/beta-access');
    }, 600);
  };

  // Generate static starfield to avoid hydration/render mismatches
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

      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.15] pointer-events-none mix-blend-overlay z-0" />
      
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] relative z-10 flex flex-col items-center"
      >
        {/* Prominent Logo */}
        <div className="relative mb-10 flex items-center justify-center">
          <motion.div 
            animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.15, 1] }} 
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-teal-500/30 blur-[40px] rounded-full"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="w-24 h-24 rounded-[1.75rem] border border-white/10 bg-[#0a0a0a]/80 flex items-center justify-center backdrop-blur-xl relative z-10 shadow-[0_0_80px_-12px_rgba(20,184,166,0.3)]"
          >
             <svg className="w-12 h-12 text-teal-400" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <div className="w-full bg-[#0a0a0a]/70 backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-8 sm:p-10 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            50 Closed Beta Seats
          </div>
          
          <h1 className="text-2xl sm:text-[28px] font-medium tracking-tight text-zinc-100 mb-3">
            Invitation Verified
          </h1>
          
          <p className="text-[14.5px] text-zinc-400 leading-relaxed mb-10 max-w-[340px]">
            Welcome, <strong className="text-zinc-200 font-medium">{user?.email}</strong>. Your access to the Atlas closed beta has been confirmed.
          </p>
          
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-4 rounded-2xl text-[14.5px] font-semibold transition-all shadow-[0_2px_12px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-[18px] h-[18px] relative z-10" />
                <span className="relative z-10 tracking-wide">Complete Enrollment</span>
              </>
            )}
          </button>
          
          <p className="text-[12px] text-zinc-500 mt-6 max-w-[280px]">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
