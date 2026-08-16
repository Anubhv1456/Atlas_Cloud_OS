import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { useBetaAccess } from '@/hooks/useBetaAccess';
import { cn } from '@/lib/utils';

export function OfflineLeaseBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { offlineLeaseValid, offlineHoursRemaining } = useBetaAccess();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      // Fast ping check against static favicon or origin
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      setIsOnline(true);
    } catch {
      setIsOnline(navigator.onLine);
    } finally {
      setTimeout(() => setIsChecking(false), 500);
    }
  };

  // If online, no banner needed — zero visual noise
  if (isOnline) {
    return null;
  }

  const isLeaseCritical = !offlineLeaseValid || offlineHoursRemaining <= 6;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full relative z-40 bg-card/95 border-b border-border/80 backdrop-blur-md px-4 py-2 select-none"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 border',
                isLeaseCritical
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                  : 'bg-teal-500/10 border-teal-500/25 text-teal-400'
              )}
            >
              {isLeaseCritical ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
            </div>

            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-foreground">
                {isLeaseCritical ? 'Offline Sync Required' : 'Offline Vault Active'}
              </span>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <span className="text-muted-foreground truncate">
                {isLeaseCritical
                  ? offlineLeaseValid
                    ? `Lease expires in ${offlineHoursRemaining}h. Connect to internet to preserve SDSR recommendations.`
                    : 'Lease expired. Connect to internet to sync learning schedule.'
                  : `Full local access preserved (${offlineHoursRemaining}h offline lease)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-all duration-150 border border-border/50 disabled:opacity-50"
              title="Test connection"
            >
              <RefreshCw className={cn('w-3 h-3', isChecking && 'animate-spin')} />
              <span className="hidden xs:inline">Check Network</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
