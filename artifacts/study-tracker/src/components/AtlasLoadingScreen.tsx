import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AtlasLoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
  offsetForBottomNav?: boolean;
}

export function AtlasLoadingScreen({
  fullScreen = false,
  message,
  className,
  offsetForBottomNav = true,
}: AtlasLoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center select-none w-full transition-colors duration-300',
        fullScreen
          ? 'fixed inset-0 z-50 min-h-[100dvh] w-full bg-background text-foreground'
          : cn(
              'flex-1 text-foreground',
              offsetForBottomNav
                ? 'min-h-[calc(100dvh-5.5rem)] md:min-h-[calc(100dvh-2rem)] pb-8 md:pb-0'
                : 'min-h-[70vh]'
            ),
        className
      )}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Dynamic Respiratory Aura adapted to Cognitive Accent Tint */}
        <motion.div
          animate={{
            opacity: [0.15, 0.38, 0.15],
            scale: [0.88, 1.15, 0.88],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-36 h-36 rounded-full bg-primary/25 blur-3xl pointer-events-none"
        />

        {/* The Breathing North Star - Dynamically Tinted with Primary Accent */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.svg
            viewBox="-20 -20 40 40"
            className="w-12 h-12 overflow-visible"
            animate={{
              scale: [0.93, 1.07, 0.93],
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Luminous Diffuse Star Layer */}
            <path
              d="M 0 -14 L 3.5 -2.2 L 14 0 L 3.5 2.2 L 0 14 L -3.5 2.2 L -14 0 L -3.5 -2.2 Z"
              className="fill-primary"
              opacity="0.25"
              style={{ filter: 'blur(3px)' }}
            />

            {/* Core Atlas 4-Point Diamond Star */}
            <path
              d="M 0 -13 L 3 -1.8 L 13 0 L 3 1.8 L 0 13 L -3 1.8 L -13 0 L -3 -1.8 Z"
              className="fill-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
            />

            {/* High-Precision Inner Diamond Facet */}
            <path
              d="M 0 -7 L 1.8 -1.2 L 7 0 L 1.8 1.2 L 0 7 L -1.8 1.2 L -7 0 L -1.8 -1.2 Z"
              fill="currentColor"
              className="text-primary-foreground opacity-80"
            />

            {/* Luminous Center Spark */}
            <circle
              r="1.4"
              fill="currentColor"
              className="text-primary-foreground"
            />
          </motion.svg>
        </div>

        {/* Typographic Minimalist Anchor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-5 flex flex-col items-center gap-1.5"
        >
          <span className="font-mono text-xs font-medium tracking-[0.32em] text-muted-foreground/80 uppercase select-none">
            Atlas
          </span>

          {message && (
            <p className="text-xs text-muted-foreground font-normal tracking-wide max-w-[220px] text-center mt-0.5">
              {message}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

