import React from 'react';

export function AtlasEmblem({ className = "w-6 h-6", glow = true }: { className?: string, glow?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {glow && (
          <filter id="atlasNavEmblemGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>
      <g transform="translate(0, 15)">
        <path d="M256,60 C256,105 263.5,112.5 308.5,112.5 C263.5,112.5 256,120 256,165 C256,120 248.5,112.5 203.5,112.5 C248.5,112.5 256,105 256,60 Z" fill="#84f6d4" filter={glow ? "url(#atlasNavEmblemGlow)" : undefined} />
        <path d="M256,112.5 L76,390 L256,315 Z" fill="#20b59b" />
        <path d="M256,112.5 L436,390 L256,315 Z" fill="#64748b" />
      </g>
    </svg>
  );
}
