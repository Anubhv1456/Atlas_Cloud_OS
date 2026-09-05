import React from 'react';
import { motion } from 'framer-motion';

interface AtlasNorthStarProps {
  globalHealth?: number;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  glowing?: boolean;
}

export function AtlasNorthStar({ globalHealth = 0, size = 'md' }: AtlasNorthStarProps) {
  // Scale the entire SVG based on health and base size
  const sizeMultiplier = size === 'sm' ? 0.6 : size === 'lg' ? 1.2 : 1;
  const baseScale = 2.5 * sizeMultiplier; 
  const scale = baseScale + ((globalHealth || 0) / 100) * 1.5 * sizeMultiplier; 

  const isHighHealth = (globalHealth || 0) >= 90;
  
  // Azure Blue for normal, Amber for high health. Azure gives a highly piercing, ethereal contrast against the teal nebula.
  const starColor = isHighHealth ? "#fbbf24" : "#38bdf8"; 
  const ringStroke = isHighHealth ? "rgba(251,191,36,0.3)" : "rgba(56,189,248,0.3)";
  const glowId = isHighHealth ? "glow-high" : "glow-normal";

  // Calculate rotation speed based on syllabus completion (globalHealth)
  const health = globalHealth || 0;
  let rotationDuration = 60; // Default 0-32%
  if (health >= 100) {
    rotationDuration = 15;
  } else if (health >= 67) {
    rotationDuration = 30;
  } else if (health >= 33) {
    rotationDuration = 45;
  }

  return (
    <div 
      className="relative flex items-center justify-center transition-all duration-1000"
      style={{
        transform: `scale(${scale})`
      }}
    >
      <svg 
        viewBox="-12 -12 24 24" 
        className="w-12 h-12 overflow-visible"
        style={{ width: '48px', height: '48px' }}
      >
        <defs>
          <radialGradient id={`star-flare-${glowId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="10%" stopColor={starColor} stopOpacity="0.9" />
            <stop offset="40%" stopColor={starColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={starColor} stopOpacity="0" />
          </radialGradient>
          
          <radialGradient id={`core-glow-${glowId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor={starColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={starColor} stopOpacity="0" />
          </radialGradient>

          <filter id={`blur-${glowId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        {/* Outer Dashed Bearing Ring */}
        <circle r="7.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.15" strokeDasharray="0.5 1" />
        <circle r="5.8" fill="none" stroke={ringStroke} strokeWidth="0.15" className="transition-colors duration-1000" />
        
        {/* Rotating Compass Bearing Ring with Ticks */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        >
          <circle r="6.8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.1" strokeDasharray="0.2 1.2" />
          <line x1="0" y1="-7.2" x2="0" y2="-6.2" stroke={starColor} strokeWidth="0.2" opacity="0.6" className="transition-colors duration-1000" />
          <line x1="7.2" y1="0" x2="6.2" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.15" />
          <line x1="0" y1="7.2" x2="0" y2="6.2" stroke="rgba(255,255,255,0.2)" strokeWidth="0.15" />
          <line x1="-7.2" y1="0" x2="-6.2" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.15" />
        </motion.g>

        {/* Fine Hairline Bearing Extension Lines */}
        <line x1="-11" y1="0" x2="-8.5" y2="0" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />
        <line x1="8.5" y1="0" x2="11" y2="0" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />
        <line x1="0" y1="-11" x2="0" y2="-8.5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />
        <line x1="0" y1="11" x2="0" y2="8.5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />

        {/* --- CINEMATIC LIGHT FLARE CORE --- */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: rotationDuration, repeat: Infinity, ease: "linear" }}
        >
          <motion.g
            initial={{ scale: 0.95 }}
            animate={{ scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
          {/* Ambient Glow (Background Blur) */}
          <path
            d="M 0 -8 L 0.8 -0.8 L 8 0 L 0.8 0.8 L 0 8 L -0.8 0.8 L -8 0 L -0.8 -0.8 Z"
            fill={`url(#star-flare-${glowId})`}
            filter={`url(#blur-${glowId})`}
            opacity="0.8"
            className="transition-colors duration-1000"
          />

          {/* Concentrated Light Beam (Foreground Sharp) */}
          <path
            d="M 0 -7 L 0.2 -0.2 L 7 0 L 0.2 0.2 L 0 7 L -0.2 0.2 L -7 0 L -0.2 -0.2 Z"
            fill={`url(#star-flare-${glowId})`}
            className="transition-colors duration-1000"
          />

          {/* The Hot Core */}
          <circle 
            r="1.2" 
            fill={`url(#core-glow-${glowId})`}
            className="transition-colors duration-1000" 
          />
          <circle 
            r="0.5" 
            fill="#ffffff" 
          />
          </motion.g>
        </motion.g>

      </svg>
    </div>
  );
}
