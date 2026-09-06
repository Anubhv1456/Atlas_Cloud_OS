import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';

export const AppUpdateCapsule: React.FC = () => {
  const {
    hasUpdate,
    latestVersion,
    isUpdating,
    applyUpdate,
    dismissUpdate,
  } = useAppUpdate();

  return (
    <AnimatePresence>
      {hasUpdate && (
        <div className="fixed top-4 sm:top-5 left-0 right-0 z-50 pointer-events-none flex justify-center px-3 sm:px-4">
          <motion.div
            key="atlas-update-capsule"
            role="region"
            aria-label="Software Update Notification"
            initial={{ opacity: 0, y: -28, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.94 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 26,
            }}
            className="w-full max-w-md pointer-events-auto shadow-2xl shadow-primary/10"
          >
            <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-primary/25 bg-background/90 dark:bg-card/90 backdrop-blur-2xl p-3 sm:p-3.5 transition-all">
              {/* Subtle ambient lighting */}
              <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 bg-primary/15 rounded-full blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl" />

              <div className="flex items-center gap-3 relative z-10">
                {/* Apple-style Icon badge */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0 shadow-inner">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </div>

                {/* Title & Version info */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground tracking-tight truncate">
                      Atlas Update Ready
                    </h4>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                      v{latestVersion}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    Tap to apply latest triage enhancements & fixes
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={applyUpdate}
                    disabled={isUpdating}
                    className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs tracking-tight shadow-md hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`}
                    />
                    <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={dismissUpdate}
                    disabled={isUpdating}
                    title="Snooze update"
                    aria-label="Snooze update"
                    className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
