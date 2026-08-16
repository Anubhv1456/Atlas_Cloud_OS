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
        'flex flex-col items-center justify-center select-none w-full',
        fullScreen
          ? 'fixed inset-0 z-50 min-h-[100dvh] w-full bg-[#030303] text-zinc-100'
          : cn(
              'flex-1 text-zinc-100',
              offsetForBottomNav
                ? 'min-h-[calc(100dvh-5.5rem)] md:min-h-[calc(100dvh-2rem)] pb-8 md:pb-0'
                : 'min-h-[70vh]'
            ),
        className
      )}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Soft Ambient Respiratory Teal Aura */}
        <motion.div
          animate={{
            opacity: [0.18, 0.45, 0.18],
            scale: [0.9, 1.15, 0.9],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-36 h-36 rounded-full bg-teal-500/20 blur-3xl pointer-events-none"
        />

        {/* The Breathing North Star */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.svg
            viewBox="-20 -20 40 40"
            className="w-12 h-12 overflow-visible"
            animate={{
              scale: [0.93, 1.07, 0.93],
              opacity: [0.82, 1, 0.82],
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
              fill="#20b59b"
              opacity="0.25"
              style={{ filter: 'blur(3px)' }}
            />

            {/* Core Atlas 4-Point Diamond Star */}
            <path
              d="M 0 -13 L 3 -1.8 L 13 0 L 3 1.8 L 0 13 L -3 1.8 L -13 0 L -3 -1.8 Z"
              fill="#20b59b"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(32, 181, 155, 0.85)) drop-shadow(0 0 2px #20b59b)',
              }}
            />

            {/* High-Precision Inner Diamond Facet */}
            <path
              d="M 0 -7 L 1.8 -1.2 L 7 0 L 1.8 1.2 L 0 7 L -1.8 1.2 L -7 0 L -1.8 -1.2 Z"
              fill="#84f6d4"
              opacity="0.9"
            />

            {/* Luminous Pure White Center Spark */}
            <circle
              r="1.4"
              fill="#ffffff"
              style={{ filter: 'drop-shadow(0 0 3px #ffffff)' }}
            />
          </motion.svg>
        </div>

        {/* Understated Typographic Anchor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-5 flex flex-col items-center gap-1.5"
        >
          <span className="font-mono text-[10px] font-medium tracking-[0.32em] text-zinc-500 uppercase select-none">
            Atlas
          </span>

          {message && (
            <p className="text-[11px] text-zinc-400 font-normal tracking-wide max-w-[220px] text-center mt-0.5">
              {message}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

