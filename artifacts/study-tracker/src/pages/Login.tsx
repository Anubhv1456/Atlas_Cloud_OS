import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { Link } from 'wouter';
import { Flame, Award, Pencil, Plus, Star } from 'lucide-react';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background relative selection:bg-primary/30">
      
      {/* Left side - Branding / UI Showcase */}
      <div className="hidden lg:flex w-1/2 bg-background relative overflow-hidden flex-col border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
        
        {/* Logo */}
        <div className="absolute top-12 left-12 z-20">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <img src="/logo-mark.svg" alt="Atlas" className="w-6 h-6" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-foreground">Atlas</span>
          </Link>
        </div>

        {/* Abstract UI Component */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-12">
          <motion.div 
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg aspect-square lg:aspect-[4/5] xl:aspect-square rounded-[32px] border border-white/10 bg-[#111318]/90 backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-white/5"
          >
            {/* Fake Header */}
            <div className="h-12 flex items-center px-6 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>
            
            {/* Realistic Dashboard Mockup */}
            <div className="p-8 space-y-8 h-full bg-[#0a0a0c] text-[#f8fafc] overflow-hidden rounded-t-3xl border-t border-white/5">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-[10px] tracking-[0.2em] uppercase">
                  <Star className="w-3 h-3" /> Medical Study Tracker
                </div>
                <h1 className="text-3xl font-medium tracking-tight">Good Morning</h1>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-between h-36 relative overflow-hidden group hover:bg-white/[0.05] transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest leading-tight w-2/3">Study Streak</span>
                    <div className="w-8 h-8 rounded-full border border-amber-500/20 bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <div className="z-10">
                    <div className="flex items-baseline gap-1.5"><span className="text-3xl font-medium tracking-tight">12</span><span className="text-white/40 text-sm font-medium">days</span></div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-between h-36 relative overflow-hidden group hover:bg-white/[0.05] transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest leading-tight w-2/3">Mastered</span>
                    <div className="w-8 h-8 rounded-full border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  <div className="z-10">
                    <div className="flex items-baseline gap-1.5"><span className="text-3xl font-medium tracking-tight">42</span><span className="text-white/40 text-sm font-medium">/ 120</span></div>
                  </div>
                </div>
              </div>

              {/* Focus Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-[10px] font-semibold text-white/40 tracking-widest uppercase">Today's Focus</span>
                </div>
                
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 flex flex-col justify-center hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Primary Focus</span>
                    <Pencil className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  <div className="border border-dashed border-white/10 rounded-xl h-12 flex items-center justify-center gap-2 text-white/40 hover:text-white/60 hover:bg-white/[0.02] transition-colors cursor-pointer text-sm font-medium">
                    <Plus className="w-4 h-4" /> Select Focus
                  </div>
                </div>
              </div>

            </div>
            
            {/* Glow */}
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 text-center max-w-[400px] mx-auto"
          >
            <h3 className="text-2xl font-medium text-foreground mb-3 tracking-tight">Master the curriculum.</h3>
            <p className="text-muted-foreground font-medium text-base leading-relaxed">Join medical students organizing their syllabus and studying smarter.</p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 relative">
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none" />
        
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 lg:hidden z-20">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <img src="/logo-mark.svg" alt="Atlas" className="w-6 h-6" />
            </div>
            <span className="font-semibold text-xl tracking-tight text-foreground">Atlas</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm z-10 flex flex-col items-center px-4"
        >
          <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-8 border border-primary/10 shadow-sm relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-50" />
            <img src="/logo-mark.svg" alt="Atlas" className="w-8 h-8 relative z-10" />
          </div>
          
          <h1 className="text-3xl font-medium mb-3 tracking-tight text-foreground text-center">Welcome back</h1>
          <p className="text-muted-foreground text-center mb-10 font-medium leading-relaxed text-sm">
            Sign in to continue your journey.<br />
            Your progress is always saved.
          </p>
          
          <Button 
             variant="outline" 
             size="lg" 
             className="w-full h-12 text-base font-medium rounded-xl shadow-sm border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
            ) : (
              <FcGoogle className="w-5 h-5 mr-3 bg-white rounded-full p-0.5" />
            )}
            Continue with Google
          </Button>

          <p className="mt-10 text-center text-sm text-muted-foreground font-medium">
            Don't have an account? <span className="text-primary hover:underline cursor-pointer" onClick={() => window.location.href = '/'}>Sign up</span>
          </p>
        </motion.div>
      </div>

    </div>
  );
}

