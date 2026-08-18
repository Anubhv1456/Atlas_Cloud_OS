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
  
  // Choose colors based on health
  const starColor = isHighHealth ? "#fbbf24" : "#20b59b"; // Amber-400 for high health, Teal for normal
  const starDropShadow = isHighHealth ? "drop-shadow(0 0 6px rgba(251,191,36,0.85))" : "drop-shadow(0 0 4px rgba(32,181,155,0.85))";
  const ringStroke = isHighHealth ? "rgba(251,191,36,0.35)" : "rgba(32,181,155,0.35)";

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
        {/* Outer Dashed Bearing Ring */}
        <circle r="7.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.15" strokeDasharray="0.5 1" />
        <circle r="5.8" fill="none" stroke={ringStroke} strokeWidth="0.15" className="transition-colors duration-1000" />
        
        {/* Rotating Compass Bearing Ring with Ticks */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        >
          <circle r="6.8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.1" strokeDasharray="0.2 1.2" />
          <line x1="0" y1="-7.2" x2="0" y2="-6.2" stroke={starColor} strokeWidth="0.25" className="transition-colors duration-1000" />
          <line x1="7.2" y1="0" x2="6.2" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" />
          <line x1="0" y1="7.2" x2="0" y2="6.2" stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" />
          <line x1="-7.2" y1="0" x2="-6.2" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" />
        </motion.g>

        {/* Fine Hairline Bearing Extension Lines */}
        <line x1="-11" y1="0" x2="-8.5" y2="0" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />
        <line x1="8.5" y1="0" x2="11" y2="0" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />
        <line x1="0" y1="-11" x2="0" y2="-8.5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />
        <line x1="0" y1="11" x2="0" y2="8.5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />

        {/* Compass Diamond Star Needle */}
        <motion.path
          d="M 0 -5 L 1.4 -0.8 L 5 0 L 1.4 0.8 L 0 5 L -1.4 0.8 L -5 0 L -1.4 -0.8 Z"
          fill={starColor}
          initial={{ scale: 0.95 }}
          animate={{ scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: starDropShadow }}
          className="transition-colors duration-1000"
        />

        {/* Center White Point */}
        <circle r="0.8" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 2px #fff)' }} />
      </svg>
    </div>
  );
}
