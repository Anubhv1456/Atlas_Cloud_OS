import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AtlasLoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

export function AtlasLoadingScreen({
  fullScreen = false,
  message,
  className
}: AtlasLoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center select-none',
        fullScreen
          ? 'fixed inset-0 z-50 min-h-[100dvh] w-full bg-[#030303] text-zinc-100'
          : 'w-full h-full min-h-[55vh] py-16 text-zinc-100',
        className
      )}
    >
      {/* Soft Ambient Radial Aura */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{
            opacity: [0.25, 0.5, 0.25],
            scale: [0.95, 1.08, 0.95],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-44 h-44 rounded-full bg-teal-500/15 blur-3xl pointer-events-none"
        />

        {/* Celestial Celestial Instrument / Compass Loader */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg
            viewBox="-30 -30 60 60"
            className="w-20 h-20 overflow-visible"
          >
            {/* Outer Static Cardinal Guide Ring */}
            <circle
              r="24"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.8"
              strokeDasharray="1 3"
            />

            {/* Cardinal Tick Marks */}
            <line x1="0" y1="-26" x2="0" y2="-22" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <line x1="26" y1="0" x2="22" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <line x1="0" y1="26" x2="0" y2="22" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <line x1="-26" y1="0" x2="-22" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />

            {/* Inner Precision Hairline Track */}
            <circle
              r="17"
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="0.75"
            />

            {/* Smooth Orbiting Celestial Tracer Arc */}
            <motion.g
              animate={{ rotate: 360 }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <circle
                r="17"
                fill="none"
                stroke="#20b59b"
                strokeWidth="1.6"
                strokeDasharray="24 85"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 4px rgba(32,181,155,0.7))' }}
              />
            </motion.g>

            {/* Counter-rotating Secondary Fine Harmonic Pulse */}
            <motion.g
              animate={{ rotate: -360 }}
              transition={{
                duration: 5.2,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <circle
                r="20.5"
                fill="none"
                stroke="rgba(132, 246, 212, 0.3)"
                strokeWidth="0.6"
                strokeDasharray="8 60"
                strokeLinecap="round"
              />
            </motion.g>

            {/* Center Atlas Diamond Star */}
            <motion.path
              d="M 0 -8 L 2.4 -1.4 L 8 0 L 2.4 1.4 L 0 8 L -2.4 1.4 L -8 0 L -2.4 -1.4 Z"
              fill="#20b59b"
              animate={{
                scale: [0.94, 1.06, 0.94],
                opacity: [0.85, 1, 0.85],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(32,181,155,0.85))' }}
            />

            {/* Luminous Central Core Point */}
            <circle
              r="1.2"
              fill="#ffffff"
              style={{ filter: 'drop-shadow(0 0 2px #fff)' }}
            />
          </svg>
        </div>
      </div>

      {/* Typography & Shimmer Micro-Bar */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-6 flex flex-col items-center gap-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] font-semibold tracking-[0.28em] text-zinc-400 uppercase">
            Atlas
          </span>
        </div>

        {/* Precision Micro-Progress Shimmer */}
        <div className="relative w-14 h-[1.5px] bg-zinc-800/80 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 bottom-0 w-6 bg-gradient-to-r from-transparent via-teal-400 to-transparent"
            animate={{
              x: [-24, 56],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {message && (
          <p className="text-[11.5px] text-zinc-500 tracking-wide font-normal max-w-[240px] text-center mt-0.5">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
}
