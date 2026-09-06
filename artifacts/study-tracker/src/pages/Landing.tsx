import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import { ChevronRight, Play, Compass, ArrowRight, Cloud, Smartphone, Sparkles, Map, BookOpen, Brain, Shield, Activity, Clock, Users, ArrowUpRight, Github, Twitter, Mail, Network, Target } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';


// --- Layout Components ---
function MacMockup({ children, className }: { children?: React.ReactNode, className?: string }) {
  return (
    <div className={cn("relative rounded-xl border border-white/10 bg-[#111318] shadow-2xl overflow-hidden flex flex-col aspect-[16/10]", className)}>
       <div className="h-4 sm:h-6 border-b border-white/10 flex items-center px-2 sm:px-3 gap-1 sm:gap-1.5 bg-[#0a0c10] shrink-0">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/20" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/20" />
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/20" />
       </div>
       <div className="flex-1 w-full relative overflow-hidden bg-[#0a0c10]">
         {children}
       </div>
    </div>
  )
}

function PhoneMockup({ children, className }: { children?: React.ReactNode, className?: string }) {
  return (
    <div className={cn("relative rounded-[2rem] sm:rounded-[2.5rem] border-[4px] sm:border-[6px] border-[#1a1c23] bg-black shadow-2xl overflow-hidden aspect-[9/19.5] flex flex-col", className)}>
       <div className="absolute top-0 inset-x-0 h-4 sm:h-5 flex justify-center z-20">
          <div className="w-16 sm:w-20 h-full bg-[#1a1c23] rounded-b-xl sm:rounded-b-2xl" />
       </div>
       <div className="flex-1 w-full relative overflow-hidden bg-[#0a0c10] pt-6 sm:pt-8">
          {children}
       </div>
    </div>
  )
}

// --- Illustration UIs ---
const HomeDashboardUI = () => (
  <div className="flex flex-col w-full h-full p-2.5 sm:p-4 bg-[#0a0c10] text-white text-left font-sans select-none overflow-hidden justify-between">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#111318] border border-white/10 flex items-center justify-center p-1 shrink-0">
          <Compass className="w-full h-full text-[#20b59b]" />
        </div>
        <div>
          <div className="text-[7px] sm:text-[9px] font-semibold text-[#20b59b] tracking-wider uppercase leading-none">MEDICAL STUDY TRACKER</div>
          <div className="text-xs sm:text-base font-medium text-white tracking-tight leading-tight">Good Morning</div>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 bg-[#12141a] border border-white/10 rounded-full px-2.5 py-1 text-[9px] text-slate-400">
        <svg viewBox="0 0 24 24" fill="none" className="w-2.5 h-2.5 stroke-current" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span>Search...</span>
        <kbd className="bg-white/10 px-1 rounded text-[8px] text-slate-300">⌘K</kbd>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 my-1">
      <div className="bg-[#111318] border border-white/5 rounded-lg p-1.5 sm:p-2.5 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
        <div className="flex items-center justify-between text-[7px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wider relative z-10">
          <span>STUDY STREAK</span>
        </div>
        <div className="my-0.5 relative z-10"><span className="text-sm sm:text-xl font-medium text-white">12</span> <span className="text-[8px] sm:text-xs text-slate-400">days</span></div>
      </div>

      <div className="bg-[#111318] border border-white/5 rounded-lg p-1.5 sm:p-2.5 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#20b59b]/5 to-transparent" />
        <div className="flex items-center justify-between text-[7px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wider relative z-10">
          <span>COMPLETION</span>
        </div>
        <div className="my-0.5 text-sm sm:text-xl font-medium text-white relative z-10">16%</div>
      </div>

      <div className="bg-[#111318] border border-white/5 rounded-lg p-1.5 sm:p-2.5 flex flex-col justify-between relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
        <div className="flex items-center justify-between text-[7px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wider relative z-10">
          <span>MASTERED</span>
        </div>
        <div className="my-0.5 relative z-10"><span className="text-sm sm:text-xl font-medium text-white">42</span> <span className="text-[8px] sm:text-xs text-slate-400">/ 152</span></div>
      </div>

      <div className="bg-[#111318] border border-white/5 rounded-lg p-1.5 sm:p-2.5 flex flex-col justify-between relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="flex items-center justify-between text-[7px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-wider relative z-10">
          <span>REVISIONS DUE</span>
        </div>
        <div className="my-0.5 text-sm sm:text-xl font-medium text-white relative z-10">14</div>
      </div>
    </div>

    <div className="my-1">
      <div className="text-[7px] sm:text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-[#20b59b]" /> TODAY'S PRIMARY FOCUS
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
        <div className="bg-[#111318] border border-[#20b59b]/20 rounded-lg p-1.5 sm:p-2.5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#20b59b]/10 to-transparent" />
          <div className="flex items-center gap-1 text-[7px] sm:text-[8px] text-[#20b59b] font-semibold uppercase mb-0.5 relative z-10">
            <span>RECOMMENDED</span>
          </div>
          <div className="text-xs sm:text-sm font-medium text-white relative z-10">Cardiology</div>
          <div className="text-[7px] sm:text-[9px] text-slate-400 relative z-10">Medicine</div>
        </div>
        <div className="bg-[#111318] border border-amber-500/20 rounded-lg p-1.5 sm:p-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-[7px] sm:text-[8px] text-slate-400 uppercase mb-0.5">
            <span>SECONDARY FOCUS</span>
            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[6px] sm:text-[8px] px-1 rounded font-medium">Overdue 2d</span>
          </div>
          <div className="text-xs sm:text-sm font-medium text-white">Glaucoma</div>
          <div className="text-[7px] sm:text-[9px] text-slate-400">Ophthalmology</div>
        </div>
      </div>
    </div>
  </div>
);

const MobileHomeUI = () => (
  <div className="flex flex-col w-full h-full p-2.5 bg-[#0a0c10] text-white text-left font-sans select-none overflow-hidden justify-between">
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded bg-[#111318] border border-white/10 flex items-center justify-center p-0.5 shrink-0">
          <Compass className="w-full h-full text-[#20b59b]" />
        </div>
        <div>
          <div className="text-[6px] font-semibold text-[#20b59b] tracking-wider uppercase leading-none">MEDICAL STUDY TRACKER</div>
          <div className="text-xs font-medium text-white leading-tight">Good Morning</div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-1.5 my-1">
      <div className="bg-[#111318] border border-white/5 rounded-lg p-1.5 flex flex-col justify-between">
        <div className="text-[6px] font-medium text-slate-400 uppercase">STUDY STREAK</div>
        <div className="my-0.5 text-xs font-medium text-white">12 <span className="text-[7px] text-slate-400">days</span></div>
      </div>
      <div className="bg-[#111318] border border-white/5 rounded-lg p-1.5 flex flex-col justify-between">
        <div className="text-[6px] font-medium text-slate-400 uppercase">COMPLETION</div>
        <div className="my-0.5 text-xs font-medium text-white">16%</div>
      </div>
    </div>

    <div className="my-1">
      <div className="text-[6px] font-semibold text-slate-400 uppercase mb-1 flex items-center gap-1">
         <div className="w-1 h-1 rounded-full bg-[#20b59b]" /> TODAY'S PRIMARY FOCUS
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        <div className="bg-[#111318] border border-[#20b59b]/20 rounded-lg p-1.5">
          <div className="text-[6px] text-[#20b59b] font-semibold uppercase">RECOMMENDED</div>
          <div className="text-xs font-medium text-white">Cardiology</div>
          <div className="text-[6px] text-slate-400">Medicine</div>
        </div>
      </div>
    </div>
  </div>
);

const CurriculumVisualization = () => {
  return (
    <div className="relative w-full aspect-[4/3] rounded-[32px] bg-[#06080A] border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(32,181,155,0.06)] flex flex-col justify-between p-5 sm:p-7 select-none font-sans">
       {/* Background glow and subtle grid */}
       <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
             backgroundImage: 'radial-gradient(ellipse at 50% 90%, rgba(32,181,155,0.14) 0%, rgba(56,189,248,0.06) 45%, transparent 80%), linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', 
             backgroundSize: '100% 100%, 2rem 2rem, 2rem 2rem' 
          }} 
       />

       {/* Top Header HUD Identifier */}
       <div className="relative z-10 flex items-center justify-between text-xs font-mono tracking-widest text-slate-400 uppercase">
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-[#20b59b] animate-ping" />
             <span className="text-white font-medium">Knowledge Architecture</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-500">
             <span className="text-slate-400 font-mono">BLUEPRINT v2.4</span>
             <span>·</span>
             <span className="text-[#20b59b]/90 font-mono">1,240 NODES INDEXED</span>
          </div>
       </div>

       {/* SVG Knowledge Blueprint */}
       <div className="relative w-full h-full flex items-center justify-center my-2">
          <svg className="w-full h-full" viewBox="-12 -12 124 124" preserveAspectRatio="xMidYMid meet">
             <defs>
                <filter id="archGlow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="0.8" result="blur" />
                   <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                   </feMerge>
                </filter>
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="0.6" result="blur" />
                   <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                   </feMerge>
                </filter>
                <radialGradient id="rootAnchorGlow" cx="50%" cy="50%" r="50%">
                   <stop offset="0%" stopColor="#20b59b" stopOpacity="0.85" />
                   <stop offset="50%" stopColor="#20b59b" stopOpacity="0.25" />
                   <stop offset="100%" stopColor="#20b59b" stopOpacity="0" />
                </radialGradient>
             </defs>

             {/* --- ARCHITECTURAL HORIZON GUIDES & BLUEPRINT LABELS --- */}
             {[
               { y: 88, label: 'MEDICINE', code: 'SYS.ROOT' },
               { y: 70, label: 'SUBJECTS', code: 'TIER.01' },
               { y: 50, label: 'SYSTEMS', code: 'TIER.02' },
               { y: 30, label: 'TOPICS', code: 'TIER.03' },
               { y: 12, label: 'SUBTOPICS', code: 'TIER.04' },
             ].map((lvl) => (
                <g key={lvl.label}>
                   <line x1="4" y1={lvl.y} x2="96" y2={lvl.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.15" strokeDasharray="0.8 1.5" />
                   {/* Left code marker */}
                   <text x="5" y={lvl.y - 1.2} fill="rgba(255,255,255,0.25)" fontSize="1.3" fontFamily="monospace" textAnchor="start">
                      [{lvl.code}]
                   </text>
                   {/* Right level label */}
                   <text x="95" y={lvl.y - 1.2} fill="rgba(255,255,255,0.4)" fontSize="1.6" fontFamily="monospace" fontWeight="600" textAnchor="end" letterSpacing="0.05em">
                      {lvl.label}
                   </text>
                </g>
             ))}

             {/* --- 3. UNEXPLORED BRANCHES (Subtle Hairline Grid Paths) --- */}
             <g stroke="rgba(255,255,255,0.12)" strokeWidth="0.18" fill="none" strokeDasharray="0.8 1.2">
                {/* L0 -> L1 Right (Unexplored Subject) */}
                <path d="M 50 88 L 50 81 L 74 73 L 76 70" />
                {/* L1 -> L2 Right (Unexplored Systems) */}
                <path d="M 76 70 L 76 62 L 70 54 L 68 50" />
                <path d="M 76 70 L 76 62 L 82 54 L 84 50" />
                {/* L2 -> L3 Right (Unexplored Topics) */}
                <path d="M 68 50 L 68 42 L 66 34 L 65 30" />
                <path d="M 68 50 L 68 42 L 73 34 L 74 30" />
                <path d="M 84 50 L 84 42 L 83 34 L 83 30" />
                <path d="M 84 50 L 84 42 L 91 34 L 92 30" />
                {/* L3 -> L4 Unexplored Subtopics */}
                <path d="M 65 30 L 65 22 L 63 15 L 62 12" />
                <path d="M 65 30 L 65 22 L 68 15 L 69 12" />
                <path d="M 74 30 L 74 22 L 75 15 L 76 12" />
                <path d="M 83 30 L 83 22 L 82 15 L 81 12" />
                <path d="M 83 30 L 83 22 L 86 15 L 87 12" />
                <path d="M 92 30 L 92 22 L 91 15 L 90 12" />
                <path d="M 92 30 L 92 22 L 94 15 L 95 12" />
                
                {/* Secondary Uncharted Spreads */}
                <path d="M 57 50 L 57 42 L 56 34 L 56 30" />
                <path d="M 56 30 L 56 22 L 55 15 L 55 12" />
             </g>

             {/* --- 2. IN-PROGRESS BRANCHES (Electric Cyan #38bdf8) --- */}
             <g fill="none">
                {/* Cyan Glow Backdrop */}
                <g stroke="#38bdf8" strokeWidth="0.6" opacity="0.45" style={{ filter: 'url(#cyanGlow)' }}>
                   {/* L0 -> L1 Center (In-Progress Subject) */}
                   <path d="M 50 88 L 50 70" />
                   {/* L1 -> L2 Center (In-Progress Systems) */}
                   <path d="M 50 70 L 50 62 L 45 54 L 43 50" />
                   <path d="M 50 70 L 50 62 L 55 54 L 57 50" />
                   {/* L2 -> L3 (In-Progress Topics) */}
                   <path d="M 43 50 L 43 42 L 39 34 L 38 30" />
                   <path d="M 43 50 L 43 42 L 47 34 L 48 30" />
                   {/* L3 -> L4 (In-Progress Subtopics) */}
                   <path d="M 38 30 L 38 22 L 36 15 L 35 12" />
                   <path d="M 38 30 L 38 22 L 40 15 L 41 12" />
                   <path d="M 48 30 L 48 12" />
                </g>

                {/* Crisp Cyan Core Line */}
                <g stroke="#38bdf8" strokeWidth="0.28" opacity="0.9">
                   <path d="M 50 88 L 50 70" />
                   <path d="M 50 70 L 50 62 L 45 54 L 43 50" />
                   <path d="M 50 70 L 50 62 L 55 54 L 57 50" />
                   <path d="M 43 50 L 43 42 L 39 34 L 38 30" />
                   <path d="M 43 50 L 43 42 L 47 34 L 48 30" />
                   <path d="M 38 30 L 38 22 L 36 15 L 35 12" />
                   <path d="M 38 30 L 38 22 L 40 15 L 41 12" />
                   <path d="M 48 30 L 48 12" />
                </g>
             </g>

             {/* --- 1. COMPLETED BRANCHES (Bright Teal #20b59b & White) --- */}
             <g fill="none">
                {/* Glow Backdrop Lines */}
                <g stroke="#20b59b" strokeWidth="0.8" opacity="0.5" style={{ filter: 'url(#archGlow)' }}>
                   {/* L0 -> L1 Left (Completed Subject) */}
                   <path d="M 50 88 L 50 81 L 26 73 L 24 70" />
                   {/* L1 -> L2 Left (Completed Systems) */}
                   <path d="M 24 70 L 24 62 L 14 54 L 12 50" />
                   <path d="M 24 70 L 24 62 L 28 54 L 30 50" />
                   {/* L2 -> L3 Left (Completed Topics) */}
                   <path d="M 12 50 L 12 42 L 8 34 L 6 30" />
                   <path d="M 12 50 L 12 42 L 16 34 L 18 30" />
                   <path d="M 30 50 L 30 42 L 28 34 L 27 30" />
                   {/* L3 -> L4 Left (Completed Subtopics) */}
                   <path d="M 6 30 L 6 22 L 4 15 L 3 12" />
                   <path d="M 6 30 L 6 22 L 8 15 L 9 12" />
                   <path d="M 18 30 L 18 22 L 16 15 L 15 12" />
                   <path d="M 18 30 L 18 22 L 20 15 L 21 12" />
                   <path d="M 27 30 L 27 12" />
                </g>

                {/* Crisp White Core Lines */}
                <g stroke="#ffffff" strokeWidth="0.3" opacity="0.95">
                   <path d="M 50 88 L 50 81 L 26 73 L 24 70" />
                   <path d="M 24 70 L 24 62 L 14 54 L 12 50" />
                   <path d="M 24 70 L 24 62 L 28 54 L 30 50" />
                   <path d="M 12 50 L 12 42 L 8 34 L 6 30" />
                   <path d="M 12 50 L 12 42 L 16 34 L 18 30" />
                   <path d="M 30 50 L 30 42 L 28 34 L 27 30" />
                   <path d="M 6 30 L 6 22 L 4 15 L 3 12" />
                   <path d="M 6 30 L 6 22 L 8 15 L 9 12" />
                   <path d="M 18 30 L 18 22 L 16 15 L 15 12" />
                   <path d="M 18 30 L 18 22 L 20 15 L 21 12" />
                   <path d="M 27 30 L 27 12" />
                </g>
             </g>

             {/* --- 12-SECOND PERIODIC INFORMATION PROPAGATION PULSES --- */}
             {/* Main Completed Branch Pulse */}
             <motion.circle
                r="0.9"
                fill="#ffffff"
                style={{ filter: 'drop-shadow(0 0 4px #20b59b)' }}
                animate={{
                   cx: [50, 50, 26, 24, 24, 14, 12, 12, 8, 6, 6, 4, 3],
                   cy: [88, 81, 73, 70, 62, 54, 50, 42, 34, 30, 22, 15, 12],
                   opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
             />

             {/* Secondary In-Progress Branch Pulse */}
             <motion.circle
                r="0.8"
                fill="#38bdf8"
                style={{ filter: 'drop-shadow(0 0 4px #38bdf8)' }}
                animate={{
                   cx: [50, 50, 50, 45, 43, 43, 39, 38, 38, 36, 35],
                   cy: [88, 70, 62, 54, 50, 42, 34, 30, 22, 15, 12],
                   opacity: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, repeatDelay: 6, ease: "easeInOut", delay: 0.8 }}
             />

             {/* Right Split Secondary Pulse */}
             <motion.circle
                r="0.7"
                fill="#ffffff"
                style={{ filter: 'drop-shadow(0 0 3px #ffffff)' }}
                animate={{
                   cx: [50, 50, 26, 24, 24, 28, 30, 30, 28, 27, 27],
                   cy: [88, 81, 73, 70, 62, 54, 50, 42, 34, 30, 12],
                   opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, repeatDelay: 6, ease: "easeInOut", delay: 0.4 }}
             />

             {/* --- NODES --- */}

             {/* 3. UNEXPLORED NODES (Dim Subtle Dots) */}
             {[
               { x: 76, y: 70 }, { x: 68, y: 50 }, { x: 84, y: 50 },
               { x: 57, y: 50 }, { x: 56, y: 30 }, { x: 65, y: 30 }, { x: 74, y: 30 }, { x: 83, y: 30 }, { x: 92, y: 30 },
               { x: 55, y: 12 }, { x: 62, y: 12 }, { x: 69, y: 12 }, { x: 76, y: 12 },
               { x: 81, y: 12 }, { x: 87, y: 12 }, { x: 90, y: 12 }, { x: 95, y: 12 }
             ].map((node, i) => (
                <circle key={`unexplored-node-${i}`} cx={node.x} cy={node.y} r="0.45" fill="rgba(255,255,255,0.2)" />
             ))}

             {/* 2. IN-PROGRESS NODES (Electric Cyan #38bdf8) */}
             {[
               { x: 50, y: 70 }, { x: 43, y: 50 }, { x: 38, y: 30 }, { x: 48, y: 30 },
               { x: 35, y: 12 }, { x: 41, y: 12 }, { x: 48, y: 12 }
             ].map((node, i) => (
                <g key={`inprogress-node-${i}`}>
                   <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r="1.3"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="0.18"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0.9, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
                   />
                   <circle cx={node.x} cy={node.y} r="0.75" fill="#06080A" stroke="#38bdf8" strokeWidth="0.25" />
                   <circle cx={node.x} cy={node.y} r="0.35" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 2px #38bdf8)' }} />
                </g>
             ))}

             {/* 1. COMPLETED NODES (Glowing Bright Teal & White) */}
             {[
               { x: 24, y: 70 }, { x: 12, y: 50 }, { x: 30, y: 50 },
               { x: 6, y: 30 }, { x: 18, y: 30 }, { x: 27, y: 30 },
               { x: 3, y: 12 }, { x: 9, y: 12 }, { x: 15, y: 12 }, { x: 21, y: 12 }, { x: 27, y: 12 }
             ].map((node, i) => (
                <g key={`completed-node-${i}`}>
                   {/* Outer Pulse Halo */}
                   <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r="1.4"
                      fill="none"
                      stroke="#20b59b"
                      strokeWidth="0.18"
                      animate={{ scale: [1, 2.2, 1], opacity: [0.2, 0.8, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.18 }}
                   />
                   {/* Station Outer Ring */}
                   <circle cx={node.x} cy={node.y} r="0.8" fill="#06080A" stroke="#20b59b" strokeWidth="0.3" />
                   {/* Bright Center Dot */}
                   <circle cx={node.x} cy={node.y} r="0.35" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #20b59b)' }} />
                </g>
             ))}

             {/* --- L0 ROOT ANCHOR: MEDICINE FOUNDATION --- */}
             <g transform="translate(50, 88)">
                {/* Core Radial Glow */}
                <circle r="9" fill="url(#rootAnchorGlow)" />
                
                {/* Rotating Outer Dial with Ticks */}
                <motion.g
                   animate={{ rotate: 360 }}
                   transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                >
                   <circle r="4.8" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.12" strokeDasharray="0.4 1.2" />
                   <line x1="0" y1="-5.5" x2="0" y2="-4.4" stroke="#20b59b" strokeWidth="0.25" />
                   <line x1="5.5" y1="0" x2="4.4" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="0.18" />
                   <line x1="0" y1="5.5" x2="0" y2="4.4" stroke="rgba(255,255,255,0.4)" strokeWidth="0.18" />
                   <line x1="-5.5" y1="0" x2="-4.4" y2="0" stroke="rgba(255,255,255,0.4)" strokeWidth="0.18" />
                </motion.g>

                {/* Inner Precision Blueprint Rings */}
                <circle r="3.4" fill="none" stroke="#20b59b" strokeWidth="0.22" opacity="0.8" />
                <circle r="2.0" fill="#06080A" stroke="rgba(255,255,255,0.6)" strokeWidth="0.15" />

                {/* Starburst Diamond Center */}
                <polygon points="0,-2.2 1.6,0 0,2.2 -1.6,0" fill="#20b59b" style={{ filter: 'drop-shadow(0 0 5px #20b59b)' }} />
                <circle r="0.6" fill="#ffffff" />
             </g>
          </svg>
       </div>

       {/* Bottom Legend / Minimal Status */}
       <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-[9px] font-mono tracking-wider">
          <div className="flex items-center gap-2 text-slate-200">
             <span className="w-2 h-2 rounded-full bg-[#20b59b] shadow-[0_0_8px_#20b59b]" />
             <span>COMPLETED</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
             <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] animate-pulse" />
             <span>IN PROGRESS</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
             <span className="w-2 h-2 rounded-full bg-white/20 border border-white/20" />
             <span>UNEXPLORED</span>
          </div>
       </div>
    </div>
  );
};

const AdaptiveRevisionVisualization = () => {
  return (
    <div className="relative w-full aspect-[4/3] rounded-[32px] bg-[#06080A] border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(32,181,155,0.06)] flex flex-col justify-between p-5 sm:p-7 select-none font-sans">
       {/* Background glow and subtle scientific grid */}
       <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
             backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(56,189,248,0.12) 0%, rgba(32,181,155,0.06) 45%, transparent 80%), linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', 
             backgroundSize: '100% 100%, 2rem 2rem, 2rem 2rem' 
          }} 
       />

       {/* Top Header HUD Identifier */}
       <div className="relative z-10 flex items-center justify-between text-xs font-mono tracking-widest text-slate-400 uppercase">
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping" />
             <span className="text-white font-medium">Memory Retention Synthesis</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-500">
             <span className="text-slate-400 font-mono">EBBINGHAUS-ATLAS v3.1</span>
             <span>·</span>
             <span className="text-[#38bdf8]/90 font-mono">ADAPTIVE DECAY DECK</span>
          </div>
       </div>

       {/* SVG Scientific Memory Visualization */}
       <div className="relative w-full h-full flex items-center justify-center my-2">
          <svg className="w-full h-full" viewBox="-12 -12 124 124" preserveAspectRatio="xMidYMid meet">
             <defs>
                <filter id="memoryGlow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="0.8" result="blur" />
                   <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                   </feMerge>
                </filter>
                <filter id="pulseBeamGlow" x="-30%" y="-10%" width="160%" height="120%">
                   <feGaussianBlur stdDeviation="1.2" result="blur" />
                   <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                   </feMerge>
                </filter>
                <linearGradient id="beamGradient1" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                   <stop offset="60%" stopColor="#20b59b" stopOpacity="0.5" />
                   <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="beamGradient2" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                   <stop offset="70%" stopColor="#20b59b" stopOpacity="0.4" />
                   <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </linearGradient>
             </defs>

             {/* --- AXIS GUIDES & THRESHOLDS --- */}
             {/* 100% Peak Memory Strength Axis */}
             <line x1="8" y1="20" x2="92" y2="20" stroke="rgba(255,255,255,0.08)" strokeWidth="0.15" strokeDasharray="0.8 1.5" />
             <text x="7" y="18.5" fill="rgba(255,255,255,0.3)" fontSize="1.3" fontFamily="monospace" textAnchor="start">PEAK ENCODING [100%]</text>

             {/* 50% Intermediate Reference */}
             <line x1="8" y1="46" x2="92" y2="46" stroke="rgba(255,255,255,0.03)" strokeWidth="0.1" strokeDasharray="0.5 2" />

             {/* 25% Critical Retention Threshold */}
             <line x1="8" y1="72" x2="92" y2="72" stroke="rgba(56,189,248,0.25)" strokeWidth="0.2" strokeDasharray="1 1.5" />
             <rect x="8" y="71.5" width="84" height="1" fill="rgba(56,189,248,0.03)" />
             <text x="93" y="70.5" fill="#38bdf8" opacity="0.8" fontSize="1.3" fontFamily="monospace" fontWeight="600" textAnchor="end">CRITICAL THRESHOLD [25%]</text>

             {/* Timeline Horizontal Axis Ticks */}
             <line x1="8" y1="88" x2="92" y2="88" stroke="rgba(255,255,255,0.12)" strokeWidth="0.2" />
             {[
               { x: 10, label: 'T0' },
               { x: 32, label: 'T + 2d' },
               { x: 55, label: 'T + 7d' },
               { x: 78, label: 'T + 18d' },
               { x: 90, label: 'T + 30d' }
             ].map((tick) => (
                <g key={tick.label}>
                   <line x1={tick.x} y1="87" x2={tick.x} y2="89" stroke="rgba(255,255,255,0.25)" strokeWidth="0.2" />
                   <text x={tick.x} y="92" fill="rgba(255,255,255,0.25)" fontSize="1.2" fontFamily="monospace" textAnchor="middle">{tick.label}</text>
                </g>
             ))}

             {/* --- LAYERED GRAPH CURVES (CLEAR OPACITY HIERARCHY) --- */}

             {/* FAINTEST LAYER: Projected / Unrevitalized Ghost Decay Paths (0.12 Opacity) */}
             <path d="M 32 72 Q 40 86 48 92" stroke="rgba(255,255,255,0.12)" strokeWidth="0.15" strokeDasharray="0.5 1" fill="none" />
             <path d="M 55 72 Q 62 85 70 92" stroke="rgba(255,255,255,0.12)" strokeWidth="0.15" strokeDasharray="0.5 1" fill="none" />

             {/* INACTIVE LAYER: Highly Consolidated Long-Term Memory Strand 3 (35% Opacity) */}
             <path
                d="M 8 20 Q 45 28 92 34"
                stroke="rgba(255,255,255,0.35)" strokeWidth="0.2" fill="none"
             />

             {/* SECONDARY ACTIVE LAYER: Secondary Memory Strand 2 (55% Opacity) */}
             <g fill="none">
                <path
                   d="M 22 20 Q 38 48 55 72 L 55 20 Q 75 32 92 38"
                   stroke="#38bdf8" strokeWidth="0.6" opacity="0.2" style={{ filter: 'url(#memoryGlow)' }}
                />
                <path
                   d="M 22 20 Q 38 48 55 72"
                   stroke="#38bdf8" strokeWidth="0.22" opacity="0.55"
                />
                <path
                   d="M 55 20 Q 75 32 92 38"
                   stroke="#38bdf8" strokeWidth="0.22" opacity="0.65"
                />
             </g>

             {/* MONITORED DECAY STRAND 4: Currently Decaying Strand (60% Opacity) */}
             <path
                d="M 60 20 Q 72 45 88 72"
                stroke="#f59e0b" strokeWidth="0.22" strokeDasharray="1 0.8" fill="none" opacity="0.6"
             />

             {/* PRIMARY BRIGHTEST LAYER: Primary Active Memory Strand 1 (100% Opacity & Full Teal Glow) */}
             <g fill="none">
                {/* Full Glow Backdrop */}
                <path
                   d="M 10 20 Q 20 52 32 72 L 32 20 Q 55 38 90 48"
                   stroke="#20b59b" strokeWidth="0.9" opacity="0.55" style={{ filter: 'url(#memoryGlow)' }}
                />
                {/* Crisp Line 1 (Decay to threshold) */}
                <path
                   d="M 10 20 Q 20 52 32 72"
                   stroke="url(#beamGradient1)" strokeWidth="0.35" opacity="0.95"
                />
                {/* Crisp Line 2 (Revitalized Jump & Flattened Long-term Curve) */}
                <path
                   d="M 32 20 Q 55 38 90 48"
                   stroke="#20b59b" strokeWidth="0.38" opacity="1.0"
                />
             </g>

             {/* --- INTELLIGENT REVITALIZATION BEAMS & RECOVERY RIPPLES --- */}

             {/* REVITALIZATION INTERVENTION 01 (At X = 32) */}
             <g>
                {/* Faint Expanding Recovery Ripple on Intervention */}
                <motion.circle
                   cx="32" cy="72" r="1.8" fill="none" stroke="#20b59b" strokeWidth="0.2"
                   animate={{ r: [1.8, 10, 14], opacity: [0.7, 0.25, 0] }}
                   transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.circle
                   cx="32" cy="72" r="1.8" fill="none" stroke="#38bdf8" strokeWidth="0.15"
                   animate={{ r: [1.8, 6, 9], opacity: [0.8, 0.3, 0] }}
                   transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                />

                {/* Vertical Beam */}
                <line x1="32" y1="12" x2="32" y2="76" stroke="url(#beamGradient1)" strokeWidth="0.6" style={{ filter: 'url(#pulseBeamGlow)' }} />
                <line x1="32" y1="12" x2="32" y2="76" stroke="#ffffff" strokeWidth="0.2" opacity="0.95" />

                {/* Impact Intersection Dot */}
                <circle cx="32" cy="72" r="0.65" fill="#38bdf8" />

                {/* Restored Memory Peak Point (Top 100%) */}
                <motion.circle
                   cx="32" cy="20" r="2.2" fill="none" stroke="#20b59b" strokeWidth="0.2"
                   animate={{ scale: [1, 2.5, 1], opacity: [0.2, 0.9, 0.2] }}
                   transition={{ duration: 3, repeat: Infinity, delay: 0.2 }}
                />
                <circle cx="32" cy="20" r="0.85" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px #20b59b)' }} />

                {/* Blueprint Micro-Annotation */}
                <rect x="22" y="7.5" width="20" height="4.2" rx="0.8" fill="#06080A" stroke="#20b59b" strokeWidth="0.15" />
                <text x="32" y="10.3" fill="#20b59b" fontSize="1.1" fontFamily="monospace" fontWeight="600" textAnchor="middle" letterSpacing="0.05em">[01 · INTERVENTION]</text>
             </g>

             {/* REVITALIZATION INTERVENTION 02 (At X = 55) */}
             <g>
                <motion.circle
                   cx="55" cy="72" r="1.8" fill="none" stroke="#38bdf8" strokeWidth="0.2"
                   animate={{ r: [1.8, 9, 13], opacity: [0.6, 0.2, 0] }}
                   transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
                />

                <line x1="55" y1="12" x2="55" y2="76" stroke="url(#beamGradient2)" strokeWidth="0.5" style={{ filter: 'url(#pulseBeamGlow)' }} />
                <line x1="55" y1="12" x2="55" y2="76" stroke="#ffffff" strokeWidth="0.2" opacity="0.8" />

                <circle cx="55" cy="72" r="0.6" fill="#38bdf8" />

                <motion.circle
                   cx="55" cy="20" r="2.0" fill="none" stroke="#38bdf8" strokeWidth="0.2"
                   animate={{ scale: [1, 2.5, 1], opacity: [0.2, 0.8, 0.2] }}
                   transition={{ duration: 3, repeat: Infinity, delay: 1.7 }}
                />
                <circle cx="55" cy="20" r="0.75" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #38bdf8)' }} />

                <rect x="45" y="7.5" width="20" height="4.2" rx="0.8" fill="#06080A" stroke="#38bdf8" strokeWidth="0.15" />
                <text x="55" y="10.3" fill="#38bdf8" fontSize="1.1" fontFamily="monospace" fontWeight="600" textAnchor="middle" letterSpacing="0.05em">[02 · RE-ENCODING]</text>
             </g>

             {/* --- INTELLIGENT HESITATING ORBS (SLOW NEAR THRESHOLD -> INTENSE REVITALIZATION -> PROPEL) --- */}

             {/* Orb 1: Primary Strand (Slows at threshold at time 0.45, brightens, shoots up at 0.52) */}
             <motion.g
                animate={{
                   x: [0, 22, 22, 22, 80],
                   y: [0, 52, 52, 0, 28],
                   scale: [1, 0.8, 1.8, 1.2, 0.9],
                   opacity: [1, 0.4, 1, 0.95, 0.85]
                }}
                transition={{
                   duration: 7,
                   times: [0, 0.42, 0.48, 0.54, 1],
                   repeat: Infinity,
                   ease: "easeInOut"
                }}
             >
                <circle cx="10" cy="20" r="1.1" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 4px #20b59b)' }} />
                <circle cx="10" cy="20" r="0.5" fill="#20b59b" />
             </motion.g>

             {/* Orb 2: Secondary Strand (Hesitates at threshold X=55, brightens, shoots up) */}
             <motion.g
                animate={{
                   x: [0, 33, 33, 33, 70],
                   y: [0, 52, 52, 0, 18],
                   scale: [0.9, 0.7, 1.6, 1.1, 0.85],
                   opacity: [0.9, 0.35, 1, 0.9, 0.8]
                }}
                transition={{
                   duration: 7,
                   times: [0, 0.42, 0.48, 0.54, 1],
                   repeat: Infinity,
                   ease: "easeInOut",
                   delay: 2.2
                }}
             >
                <circle cx="22" cy="20" r="1.0" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #38bdf8)' }} />
                <circle cx="22" cy="20" r="0.4" fill="#38bdf8" />
             </motion.g>

             {/* Orb 3: Consolidated Long-Term Strand 3 (Calm, steady motion) */}
             <motion.g
                animate={{
                   x: [0, 84],
                   y: [0, 14],
                   opacity: [0.5, 0.35]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
             >
                <circle cx="8" cy="20" r="0.8" fill="#ffffff" opacity="0.8" />
             </motion.g>

             {/* Mathematical Model Footnote Annotation */}
             <text x="88" y="32" fill="rgba(255,255,255,0.2)" fontSize="1.1" fontFamily="monospace" textAnchor="end">S(t) = e^(-t / S)</text>
             <text x="88" y="35" fill="rgba(255,255,255,0.18)" fontSize="1.0" fontFamily="monospace" textAnchor="end">STABILITY MULTIPLIER: 3.4x</text>
          </svg>
       </div>

       {/* Bottom Legend / Status */}
       <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-[9px] font-mono tracking-wider">
          <div className="flex items-center gap-2 text-slate-200">
             <span className="w-2 h-2 rounded-full bg-[#20b59b] shadow-[0_0_8px_#20b59b]" />
             <span>STABILIZED STRAND</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
             <span className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8] animate-pulse" />
             <span>ADAPTIVE INTERVENTION</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400/80">
             <span className="w-2 h-2 rounded-full bg-amber-400/80 stroke-amber-400/40" />
             <span>MONITORED DECAY</span>
          </div>
       </div>
    </div>
  );
};

const PerformanceTrajectoryVisualization = () => {
  return (
    <div className="relative w-full aspect-[4/3] rounded-[32px] bg-[#06080A] border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(245,158,11,0.06)] flex flex-col justify-between p-5 sm:p-7 select-none font-sans">
       {/* Ambient gradient glow and blueprint grid */}
       <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
             backgroundImage: 'radial-gradient(ellipse at 70% 30%, rgba(245,158,11,0.12) 0%, rgba(32,181,155,0.06) 40%, transparent 80%), linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', 
             backgroundSize: '100% 100%, 2rem 2rem, 2rem 2rem' 
          }} 
       />

       {/* HUD Header */}
       <div className="relative z-10 flex items-center justify-between text-xs font-mono tracking-widest text-slate-400 uppercase">
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
             <span className="text-white font-medium">Trajectory Synthesis</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-500">
             <span className="text-slate-400 font-mono">VECTOR ACCELERATION</span>
             <span>·</span>
             <span className="text-amber-400/90 font-mono">MASTERY TRAJECTORY</span>
          </div>
       </div>

       {/* SVG Trajectory Canvas */}
       <div className="relative w-full h-full flex items-center justify-center my-2">
          <svg className="w-full h-full" viewBox="-12 -12 124 124" preserveAspectRatio="xMidYMid meet">
             <defs>
                <filter id="amberTrajectoryGlow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="1.0" result="blur" />
                   <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                   </feMerge>
                </filter>
                <linearGradient id="atlasTrajectoryGrad" x1="0" y1="1" x2="1" y2="0">
                   <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                   <stop offset="50%" stopColor="#20b59b" stopOpacity="0.9" />
                   <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                </linearGradient>
             </defs>

             {/* Background Threshold Reference Lines */}
             <line x1="35" y1="18" x2="92" y2="18" stroke="rgba(255,255,255,0.06)" strokeWidth="0.15" strokeDasharray="0.8 1.5" />
             <text x="92" y="16" fill="rgba(255,255,255,0.25)" fontSize="1.3" fontFamily="monospace" textAnchor="end">MASTERY THRESHOLD [100%]</text>

             <line x1="35" y1="62" x2="92" y2="62" stroke="rgba(255,255,255,0.04)" strokeWidth="0.15" strokeDasharray="0.5 1.5" />
             <text x="92" y="60.5" fill="rgba(255,255,255,0.2)" fontSize="1.2" fontFamily="monospace" textAnchor="end">PLATEAU CEILING [55%]</text>

             {/* --- MULTIDIMENSIONAL SKILL RADAR (LEFT SIDE) --- */}
             <g transform="translate(18, 50) scale(0.35)">
                {/* Radar Grid */}
                <polygon points="0,-40 34.6,-20 34.6,20 0,40 -34.6,20 -34.6,-20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <polygon points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <polygon points="0,-20 17.3,-10 17.3,10 0,20 -17.3,10 -17.3,-10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                
                {/* Axis lines */}
                <line x1="0" y1="0" x2="0" y2="-40" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="34.6" y2="-20" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="34.6" y2="20" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="0" y2="40" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="-34.6" y2="20" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="-34.6" y2="-20" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                {/* Animated Skill Polygon (Expanding) */}
                <motion.polygon
                   points="0,-10 12,-15 15,8 0,18 -20,12 -15,-8"
                   fill="rgba(32,181,155,0.15)"
                   stroke="#20b59b"
                   strokeWidth="0.8"
                   animate={{
                      points: [
                         "0,-10 12,-15 15,8 0,18 -20,12 -15,-8",
                         "0,-32 28,-12 30,15 0,36 -28,18 -24,-15",
                         "0,-10 12,-15 15,8 0,18 -20,12 -15,-8"
                      ]
                   }}
                   transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                   style={{ filter: 'drop-shadow(0 0 5px #20b59b)' }}
                />
                <circle cx="0" cy="0" r="1.5" fill="#20b59b" />
             </g>

             {/* Annotation for Radar */}
             <text x="18" y="70" fill="rgba(32,181,155,0.4)" fontSize="1.1" fontFamily="monospace" textAnchor="middle" letterSpacing="0.1em">CAPABILITY EXPANSION</text>

             {/* --- TRAJECTORY 1: UNSTRUCTURED / FAIL (CRIMSON/DIM DRIFT) --- */}
             <path
                d="M 35 82 C 45 78, 52 86, 60 83 C 70 80, 80 89, 92 92"
                stroke="rgba(239,68,68,0.3)" strokeWidth="0.22" strokeDasharray="0.8 0.8" fill="none"
             />

             {/* --- TRAJECTORY 2: CRAM & DECAY (SPIKE AND COLLAPSE) --- */}
             <path
                d="M 35 82 C 45 52, 55 42, 65 48 C 75 56, 80 78, 90 86"
                stroke="rgba(245,158,11,0.35)" strokeWidth="0.22" strokeDasharray="1 1" fill="none"
             />

             {/* --- TRAJECTORY 3: PASSIVE PLATEAU (FLATTENS OUT PERMANENTLY) --- */}
             <path
                d="M 35 82 C 45 75, 55 62, 70 62 L 95 62"
                stroke="rgba(255,255,255,0.28)" strokeWidth="0.22" fill="none"
             />

             {/* --- TRAJECTORY 4: THE ATLAS MASTERY TRAJECTORY (STEADILY ACCELERATES UPWARD) --- */}
             <g fill="none">
                {/* Glow Backdrop */}
                <path
                   d="M 35 82 C 48 78, 55 64, 65 46 C 75 30, 85 18, 92 12"
                   stroke="url(#atlasTrajectoryGrad)" strokeWidth="0.9" opacity="0.55" style={{ filter: 'url(#amberTrajectoryGlow)' }}
                />
                {/* Main Crisp Accelerating Vector Line */}
                <path
                   d="M 35 82 C 48 78, 55 64, 65 46 C 75 30, 85 18, 92 12"
                   stroke="url(#atlasTrajectoryGrad)" strokeWidth="0.38" opacity="1.0"
                />
             </g>

             {/* --- ILLUMINATED MILESTONE POINTS ALONG THE ATLAS TRAJECTORY --- */}

             {/* Milestone 1: Foundational (X=45, Y=70) */}
             <g>
                <motion.circle
                   cx="45" cy="73.5" r="1.5" fill="none" stroke="#f59e0b" strokeWidth="0.2"
                   animate={{ r: [1.5, 6, 9], opacity: [0.7, 0.2, 0] }}
                   transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut" }}
                />
                <circle cx="45" cy="73.5" r="0.6" fill="#f59e0b" />
             </g>

             {/* Milestone 2: Clinical Synthesis (X=65, Y=46) */}
             <g>
                <motion.circle
                   cx="65" cy="46" r="1.5" fill="none" stroke="#20b59b" strokeWidth="0.2"
                   animate={{ r: [1.5, 6, 9], opacity: [0.7, 0.2, 0] }}
                   transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
                />
                <circle cx="65" cy="46" r="0.65" fill="#20b59b" />
                <rect x="56" y="50" width="18" height="3.8" rx="0.8" fill="#06080A" stroke="#20b59b" strokeWidth="0.12" />
                <text x="65" y="52.6" fill="#20b59b" fontSize="1.0" fontFamily="monospace" fontWeight="600" textAnchor="middle">[ M2 · ACCELERATION ]</text>
             </g>

             {/* Milestone 3: Mastery Apex (X=92, Y=12) */}
             <g>
                <motion.circle
                   cx="92" cy="12" r="2.0" fill="none" stroke="#38bdf8" strokeWidth="0.2"
                   animate={{ scale: [1, 2.5, 1], opacity: [0.3, 0.9, 0.3] }}
                   transition={{ duration: 3, repeat: Infinity }}
                />
                <circle cx="92" cy="12" r="0.85" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 5px #38bdf8)' }} />
                <rect x="78" y="5" width="22" height="4.2" rx="0.8" fill="#06080A" stroke="#38bdf8" strokeWidth="0.15" />
                <text x="89" y="7.8" fill="#38bdf8" fontSize="1.1" fontFamily="monospace" fontWeight="600" textAnchor="middle">[ MASTERY · 100% ]</text>
             </g>

             {/* --- ACCELERATING PULSE NODE (PROPELLS ALONG TRAJECTORY) --- */}
             <motion.g
                animate={{
                   x: [0, 10, 30, 57],
                   y: [0, -8.5, -36, -70],
                   scale: [1, 1.2, 1.5, 1.2],
                   opacity: [0.85, 0.95, 1, 0.9]
                }}
                transition={{
                   duration: 6,
                   times: [0, 0.35, 0.7, 1],
                   repeat: Infinity,
                   ease: "easeInOut"
                }}
             >
                <circle cx="35" cy="82" r="1.3" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 5px #f59e0b)' }} />
                <circle cx="35" cy="82" r="0.55" fill="#f59e0b" />
             </motion.g>

             {/* Connecting Line Between Radar and Trajectory Start */}
             <line x1="28" y1="50" x2="35" y2="82" stroke="rgba(32,181,155,0.2)" strokeWidth="0.15" strokeDasharray="1 1" />


             {/* Minimal Mathematical Annotation */}
             <text x="8" y="32" fill="rgba(255,255,255,0.18)" fontSize="1.1" fontFamily="monospace" textAnchor="start">dM/dt = k · (1 - M)</text>
          </svg>
       </div>

       {/* Bottom Legend */}
       <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-[9px] font-mono tracking-wider">
          <div className="flex items-center gap-2 text-slate-200">
             <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
             <span>ATLAS MASTERY TRAJECTORY</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
             <span className="w-2 h-2 rounded-full bg-slate-500" />
             <span>PLATEAU CEILING</span>
          </div>
          <div className="flex items-center gap-2 text-amber-500/70">
             <span className="w-2 h-2 rounded-full bg-amber-500/50 stroke-amber-500/30" />
             <span>CRAMMING COLLAPSE</span>
          </div>
       </div>
    </div>
  );
};

const HeroVisualization = () => {
  const [pulseState, setPulseState] = useState({ active: false, sourceIndex: 0 });

  useEffect(() => {
    // Sequence triggers every 14 seconds
    const interval = setInterval(() => {
      setPulseState({ active: true, sourceIndex: Math.floor(Math.random() * 300) });
      
      // Reset after narrative completes (8.5s)
      setTimeout(() => {
        setPulseState({ active: false, sourceIndex: 0 });
      }, 8500);
    }, 14000);
    
    return () => clearInterval(interval);
  }, []);

  const nodes = useMemo(() => {
    return Array.from({ length: 300 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      // Clustered towards edges but with some spread
      const radius = 15 + Math.pow(Math.random(), 0.6) * 50; 
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      
      const layer = Math.random();
      const size = layer > 0.9 ? 0.3 : layer > 0.6 ? 0.15 : 0.08;
      const opacity = layer > 0.9 ? 0.6 : layer > 0.6 ? 0.25 : 0.1;
      
      const duration = 20 + Math.random() * 20; // slower drift
      const delay = Math.random() * -30;
      
      return { id: i, x, y, size, opacity, duration, delay, radius };
    });
  }, []);

  const sourceNode = nodes[pulseState.sourceIndex] || nodes[0];
  const destX = 50;
  const destY = 85;

  return (
    <div className="relative w-full aspect-square max-w-[540px] flex items-center justify-center mx-auto pointer-events-none select-none [mask-image:radial-gradient(circle_at_center,black_60%,transparent_98%)]">
       {/* Ambient celestial backdrop glow */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(32,181,155,0.09)_0%,rgba(32,181,155,0.02)_45%,transparent_75%)] pointer-events-none" />
       
       <svg className="absolute inset-0 w-full h-full" viewBox="-12 -12 124 124" preserveAspectRatio="xMidYMid meet">
          <defs>
             {/* Glow for the core */}
             <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#20b59b" stopOpacity="0.8" />
                <stop offset="30%" stopColor="#20b59b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#20b59b" stopOpacity="0" />
             </radialGradient>
             
             {pulseState.active && (
               <>
                 <linearGradient id="pulseTrace" x1={sourceNode.x} y1={sourceNode.y} x2="50" y2="50" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#20b59b" stopOpacity="0.1" />
                 </linearGradient>

                 <linearGradient id="destTrace" x1="50" y1="50" x2={destX} y2={destY} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#20b59b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0.9" />
                 </linearGradient>
               </>
             )}
          </defs>

          {/* Concentric Navigation Rings */}
          <g stroke="rgba(255,255,255,0.03)" strokeWidth="0.1" fill="none">
             <circle cx="50" cy="50" r="10" strokeDasharray="0.2 0.8" />
             <circle cx="50" cy="50" r="18" />
             <circle cx="50" cy="50" r="28" strokeDasharray="1 2" strokeOpacity="0.04" />
             <circle cx="50" cy="50" r="40" strokeOpacity="0.02" />
             <circle cx="50" cy="50" r="55" strokeDasharray="1 4" strokeOpacity="0.015" />
          </g>

          {/* Radial Geometry */}
          <g stroke="rgba(255,255,255,0.02)" strokeWidth="0.1">
             <line x1="50" y1="5" x2="50" y2="95" strokeDasharray="1 3" />
             <line x1="5" y1="50" x2="95" y2="50" strokeDasharray="1 3" />
             <line x1="18.18" y1="18.18" x2="81.82" y2="81.82" strokeOpacity="0.01" />
             <line x1="18.18" y1="81.82" x2="81.82" y2="18.18" strokeOpacity="0.01" />
          </g>

          {/* Parallax Particle Layers */}
          {nodes.map((node) => (
             <motion.circle
                key={node.id}
                r={node.size}
                fill="#fff"
                initial={{ cx: node.x, cy: node.y, opacity: node.opacity * 0.5 }}
                animate={{
                   cx: [node.x, 50 + (node.x - 50) * 0.95, node.x],
                   cy: [node.y, 50 + (node.y - 50) * 0.95, node.y],
                   opacity: [node.opacity * 0.4, node.opacity, node.opacity * 0.4],
                }}
                transition={{
                   duration: node.duration,
                   repeat: Infinity,
                   delay: node.delay,
                   ease: "easeInOut"
                }}
             />
          ))}

          {/* Destination Node (Idle state) */}
          <circle cx={destX} cy={destY} r="0.6" fill="rgba(255,255,255,0.2)" />

          {/* Pulse Sequence */}
          {pulseState.active && (
            <>
              {/* 1. Source Node Brightens */}
              <motion.circle
                cx={sourceNode.x}
                cy={sourceNode.y}
                r="0.8"
                fill="#fff"
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: [0, 1, 0], scale: [1, 2.5, 1] }}
                transition={{ duration: 1.5, times: [0, 0.5, 1] }}
                style={{ filter: 'drop-shadow(0 0 2px #fff)' }}
              />
              
              {/* Trace to Core */}
              <motion.path
                d={`M ${sourceNode.x} ${sourceNode.y} Q ${50 + (sourceNode.x - 50)*0.7} ${50 + (sourceNode.y - 50)*0.7} 50 50`}
                stroke="url(#pulseTrace)"
                strokeWidth="0.2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 2, times: [0, 0.7, 1], delay: 0.8, ease: "easeInOut" }}
              />
              
              {/* 2. Core Glows */}
              <motion.circle
                cx="50"
                cy="50"
                r="12"
                fill="url(#coreGlow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2.5, delay: 2.2, ease: "easeInOut" }}
              />

              {/* 3. Trace to Destination */}
              <motion.path
                d={`M 50 50 Q 50 65 ${destX} ${destY}`}
                stroke="url(#destTrace)"
                strokeWidth="0.3"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 2, times: [0, 0.7, 1], delay: 3.8, ease: "easeInOut" }}
              />

              {/* 4. Destination Node Illuminates */}
              <motion.g
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.8] }}
                transition={{ duration: 3.5, times: [0, 0.1, 0.8, 1], delay: 4.8 }}
                style={{ transformOrigin: `${destX}px ${destY}px` }}
              >
                <circle cx={destX} cy={destY} r="1.2" fill="#fff" style={{ filter: 'drop-shadow(0 0 3px #20b59b)' }} />
                <circle cx={destX} cy={destY} r="3" fill="none" stroke="#20b59b" strokeWidth="0.2" />
                <path d={`M ${destX-4} ${destY} L ${destX-2} ${destY} M ${destX+2} ${destY} L ${destX+4} ${destY} M ${destX} ${destY-4} L ${destX} ${destY-2} M ${destX} ${destY+2} L ${destX} ${destY+4}`} stroke="#20b59b" strokeWidth="0.1" />
              </motion.g>
            </>
          )}

          {/* Elegant Compass-Inspired Core (Idle) */}
          <circle cx="50" cy="50" r="10" fill="url(#coreGlow)" opacity="0.3" />
          
          <circle cx="50" cy="50" r="5" stroke="rgba(32,181,155,0.4)" strokeWidth="0.1" fill="none" strokeDasharray="0.5 1" />
          
          <motion.path
             d="M 50 45 L 51 49 L 55 50 L 51 51 L 50 55 L 49 51 L 45 50 L 49 49 Z"
             fill="#20b59b"
             initial={{ scale: 0.9, opacity: 0.5 }}
             animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.5, 0.8, 0.5] }}
             transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
             style={{ filter: 'drop-shadow(0 0 2px rgba(32,181,155,0.5))' }}
          />
          
          <circle cx="50" cy="50" r="0.6" fill="#fff" style={{ filter: 'drop-shadow(0 0 1px #fff)' }} />
       </svg>
    </div>
  )
}

const HowAtlasThinksVisualization = () => {
  const [stage, setStage] = useState<'idle' | 'ingest' | 'compute' | 'illuminate' | 'focus'>('idle');

  useEffect(() => {
    const runCycle = () => {
      setStage('ingest');
      const t1 = setTimeout(() => setStage('compute'), 2200);
      const t2 = setTimeout(() => setStage('illuminate'), 5200);
      const t3 = setTimeout(() => setStage('focus'), 7500);
      const t4 = setTimeout(() => setStage('idle'), 11000);
      
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    };

    const cleanup = runCycle();
    const interval = setInterval(runCycle, 13000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  // Generate 180 scattered knowledge nodes on the left side (x: 4% to 33%)
  const leftNodes = useMemo(() => {
    return Array.from({ length: 180 }).map((_, i) => {
      const x = 4 + Math.random() * 28;
      const y = 8 + Math.random() * 84;
      const size = Math.random() > 0.85 ? 0.4 : Math.random() > 0.5 ? 0.22 : 0.12;
      const opacity = Math.random() > 0.85 ? 0.65 : Math.random() > 0.5 ? 0.35 : 0.15;
      const duration = 12 + Math.random() * 16;
      const delay = Math.random() * -20;
      return { id: i, x, y, size, opacity, duration, delay };
    });
  }, []);

  // 4 specific input nodes that trigger ingestion in 'ingest' stage
  const activeInputNodes = useMemo(() => [
    leftNodes[12] || { x: 8, y: 22 },
    leftNodes[45] || { x: 18, y: 48 },
    leftNodes[88] || { x: 14, y: 76 },
    leftNodes[134] || { x: 26, y: 34 }
  ], [leftNodes]);

  const destNode = { x: 84, y: 50 };

  return (
    <div className="relative w-full h-[360px] md:h-[440px] bg-[#06080A] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl my-12">
       {/* Background Grid & Glows */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(32,181,155,0.05)_0%,transparent_75%)]" />
       
       {/* Section Column Indicators / Subdued Lines */}
       <div className="absolute inset-0 pointer-events-none flex justify-between px-[15%] opacity-20">
          <div className="w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="w-px h-full bg-gradient-to-b from-transparent via-[#20b59b]/20 to-transparent" />
          <div className="w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
       </div>

       {/* Top Minimal Headers */}
       <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-20 text-xs uppercase font-mono tracking-widest text-slate-500">
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
             <span>Scattered Curriculum (300+ Nodes)</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[#20b59b]/80">
             <span className="w-1.5 h-1.5 rounded-full bg-[#20b59b] animate-ping" />
             <span>Atlas Computation Engine</span>
          </div>
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-white" />
             <span>Singular Direction</span>
          </div>
       </div>

       <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
             {/* Gradient for input rays from left to center */}
             <linearGradient id="ingestRay" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#20b59b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#20b59b" stopOpacity="0.05" />
             </linearGradient>

             {/* Gradient for single output ray from center to right */}
             <linearGradient id="outputRay" x1="50%" y1="50%" x2="84%" y2="50%">
                <stop offset="0%" stopColor="#20b59b" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#20b59b" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#fff" stopOpacity="1" />
             </linearGradient>

             {/* Center Engine Glow */}
             <radialGradient id="engineGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#20b59b" stopOpacity="0.7" />
                <stop offset="40%" stopColor="#20b59b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#20b59b" stopOpacity="0" />
             </radialGradient>
          </defs>

          {/* --- LEFT: SCATTERED NODES --- */}
          {leftNodes.map((node) => (
             <motion.circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill="#fff"
                initial={{ opacity: node.opacity }}
                animate={{
                   opacity: [node.opacity * 0.5, node.opacity, node.opacity * 0.5],
                   cy: [node.y, node.y + (Math.sin(node.id) * 1.5), node.y]
                }}
                transition={{
                   duration: node.duration,
                   repeat: Infinity,
                   delay: node.delay,
                   ease: "easeInOut"
                }}
             />
          ))}

          {/* Active Input Nodes Highlight during 'ingest' & 'compute' */}
          {(stage === 'ingest' || stage === 'compute' || stage === 'illuminate') && activeInputNodes.map((node, i) => (
             <g key={`active-input-${i}`}>
                <motion.circle
                   cx={node.x}
                   cy={node.y}
                   r="0.8"
                   fill="#fff"
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: [1, 2, 1.2], opacity: [0.3, 1, 0.9] }}
                   transition={{ duration: 1.2, delay: i * 0.15 }}
                   style={{ filter: 'drop-shadow(0 0 3px #fff)' }}
                />
                <motion.circle
                   cx={node.x}
                   cy={node.y}
                   r="2.5"
                   fill="none"
                   stroke="#20b59b"
                   strokeWidth="0.15"
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.8, 2.5] }}
                   transition={{ duration: 1.8, delay: i * 0.15, repeat: 1 }}
                />
             </g>
          ))}

          {/* Trajectories from Active Input Nodes to Center (Compute Stage) */}
          {(stage === 'compute' || stage === 'illuminate' || stage === 'focus') && activeInputNodes.map((node, i) => (
             <motion.path
                key={`ray-${i}`}
                d={`M ${node.x} ${node.y} C ${node.x + 15} ${node.y}, 35 50, 50 50`}
                stroke="url(#ingestRay)"
                strokeWidth="0.25"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.8, 0.1] }}
                transition={{ duration: 2, times: [0, 0.7, 1], delay: i * 0.1 }}
             />
          ))}

          {/* --- CENTER: GEOMETRIC COMPUTATION ENGINE --- */}
          <g transform="translate(50, 50)">
             {/* Concentric Precision Circles */}
             <circle r="18" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.15" strokeDasharray="1 2" />
             <circle r="12" fill="none" stroke="rgba(32,181,155,0.15)" strokeWidth="0.1" />
             <circle r="7" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.15" />

             {/* Rotating Geometric Dial */}
             <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
             >
                <circle r="14" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.1" strokeDasharray="0.3 1.5" />
                <path d="M -14 0 L 14 0 M 0 -14 L 0 14" stroke="rgba(255,255,255,0.03)" strokeWidth="0.1" />
                {/* Diamond Geometry */}
                <polygon points="0,-7 7,0 0,7 -7,0" fill="none" stroke="rgba(32,181,155,0.2)" strokeWidth="0.15" />
             </motion.g>

             {/* Computation Pulse Glow during 'compute' & 'illuminate' */}
             {(stage === 'compute' || stage === 'illuminate' || stage === 'focus') && (
                <>
                   <motion.circle
                      r="16"
                      fill="url(#engineGlow)"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0.2, 0.9, 0.4], scale: [0.9, 1.15, 1] }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                   />
                   <motion.polygon
                      points="0,-9 9,0 0,9 -9,0"
                      fill="none"
                      stroke="#20b59b"
                      strokeWidth="0.25"
                      initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
                      animate={{ scale: [0.8, 1.2, 1], opacity: [0, 1, 0.6], rotate: [0, 90, 180] }}
                      transition={{ duration: 2.5, ease: "easeOut" }}
                      style={{ filter: 'drop-shadow(0 0 3px #20b59b)' }}
                   />
                </>
             )}

             {/* Central Focal Diamond Point */}
             <path d="M 0 -4 L 3 0 L 0 4 L -3 0 Z" fill="#20b59b" opacity="0.8" />
             <circle r="0.6" fill="#fff" />
          </g>

          {/* --- RIGHT: SINGULAR DESTINATION NODE --- */}
          {/* Target Reticle & Node backdrop */}
          <g transform={`translate(${destNode.x}, ${destNode.y})`}>
             <circle r="10" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.1" strokeDasharray="1 3" />
             <circle r="5" fill="none" stroke="rgba(32,181,155,0.15)" strokeWidth="0.1" />
             <line x1="-7" y1="0" x2="-3" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="0.15" />
             <line x1="3" y1="0" x2="7" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="0.15" />
             <line x1="0" y1="-7" x2="0" y2="-3" stroke="rgba(255,255,255,0.1)" strokeWidth="0.15" />
             <line x1="0" y1="3" x2="0" y2="7" stroke="rgba(255,255,255,0.1)" strokeWidth="0.15" />
             <circle r="0.4" fill="rgba(255,255,255,0.3)" />
          </g>

          {/* Output Beam (Illuminate & Focus stages) */}
          {(stage === 'illuminate' || stage === 'focus') && (
             <motion.path
                d={`M 50 50 L ${destNode.x} ${destNode.y}`}
                stroke="url(#outputRay)"
                strokeWidth="0.4"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0.8] }}
                transition={{ duration: 1.8, times: [0, 0.7, 1], ease: "easeOut" }}
                style={{ filter: 'drop-shadow(0 0 4px rgba(32,181,155,0.8))' }}
             />
          )}

          {/* Destination Node Brilliantly Illuminated ('focus' stage) */}
          {(stage === 'illuminate' || stage === 'focus') && (
             <g transform={`translate(${destNode.x}, ${destNode.y})`}>
                {/* Aura Glow */}
                <motion.circle
                   r="8"
                   fill="rgba(32,181,155,0.25)"
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: [0.5, 1.8, 1.4], opacity: [0, 0.8, 0.4] }}
                   transition={{ duration: 2, ease: "easeOut" }}
                   style={{ filter: 'drop-shadow(0 0 8px rgba(32,181,155,0.8))' }}
                />

                {/* Reticle Pulse */}
                <motion.circle
                   r="4"
                   fill="none"
                   stroke="#20b59b"
                   strokeWidth="0.3"
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0.8] }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                />

                {/* Core White Star */}
                <motion.circle
                   r="1.2"
                   fill="#fff"
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   style={{ filter: 'drop-shadow(0 0 4px #fff)' }}
                />

                {/* Precise Target Brackets */}
                <motion.path
                   d="M -6 -3 L -6 -6 L -3 -6 M 3 -6 L 6 -6 L 6 -3 M 6 3 L 6 6 L 3 6 M -3 6 L -6 6 L -6 3"
                   fill="none"
                   stroke="#20b59b"
                   strokeWidth="0.2"
                   initial={{ scale: 1.5, opacity: 0 }}
                   animate={{ scale: [1.4, 1, 1], opacity: [0, 1, 0.8] }}
                   transition={{ duration: 1.2, delay: 0.2 }}
                />
             </g>
          )}
       </svg>

       {/* Bottom Editorial Caption */}
       <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-20">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#111318]/90 border border-white/10 backdrop-blur-md text-xs font-medium text-slate-300 shadow-xl">
             <span className="text-slate-500">Chaos</span>
             <span className="text-slate-600">→</span>
             <span className="text-[#20b59b] font-semibold">Geometric Intelligence</span>
             <span className="text-slate-600">→</span>
             <span className="text-white font-semibold">Singular Direction</span>
          </div>
       </div>
    </div>
  );
};

const AcademicDirectorVisualization = () => {
  // Cycle state for the signature story animation (every 13 seconds)
  const [pulseStage, setPulseStage] = useState<'idle' | 'signal' | 'route' | 'wp1' | 'wp2' | 'destination'>('idle');

  useEffect(() => {
    const runCycle = () => {
      setPulseStage('signal');
      const t1 = setTimeout(() => setPulseStage('route'), 900);
      const t2 = setTimeout(() => setPulseStage('wp1'), 1900);
      const t3 = setTimeout(() => setPulseStage('wp2'), 2900);
      const t4 = setTimeout(() => setPulseStage('destination'), 3900);
      const t5 = setTimeout(() => setPulseStage('idle'), 6800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    };

    const cleanup = runCycle();
    const interval = setInterval(runCycle, 13000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  // Generate background knowledge nodes
  const nodes = useMemo(() => {
    return Array.from({ length: 88 }).map((_, i) => {
      const x = 6 + Math.random() * 88;
      const y = 16 + Math.random() * 70;
      const r = Math.random() * 0.32 + 0.12;
      const opacity = Math.random() * 0.3 + 0.08;
      return { id: i, x, y, r, opacity };
    });
  }, []);

  // Connected mesh lines between close background nodes (~10% connectivity)
  const constellationLines = useMemo(() => {
    const lines: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 3 && dist < 15) {
          if ((i * 7 + j * 13) % 9 === 0) {
            lines.push({
              id: `${i}-${j}`,
              x1: nodes[i].x,
              y1: nodes[i].y,
              x2: nodes[j].x,
              y2: nodes[j].y
            });
          }
        }
      }
    }
    return lines;
  }, [nodes]);

  // Designated background node that briefly brightens during 'signal' stage
  const signalNode = useMemo(() => nodes[14] || { x: 26, y: 44 }, [nodes]);

  // Faint alternate paths evaluated by Atlas (showing options considered)
  const alternatePaths = [
    "M 50 20 C 35 28, 18 36, 14 56 C 12 68, 24 82, 18 90",
    "M 50 20 C 68 28, 82 36, 86 58 C 88 70, 74 82, 82 90",
    "M 50 20 C 32 36, 42 58, 30 74 C 24 82, 34 90, 38 94",
    "M 50 20 C 64 42, 54 64, 68 74 C 76 80, 68 88, 62 92",
    "M 50 20 C 26 22, 10 32, 8 52",
    "M 50 20 C 74 22, 90 32, 92 52"
  ];

  // The ONE illuminated route chosen by the Academic Director
  const mainPath = "M 50 20 C 52 38, 38 52, 45 68 C 48 76, 50 80, 50 86";

  return (
    <div className="relative w-full h-[380px] sm:h-[440px] bg-[#06080A] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
       {/* Background radial soft glows */}
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(32,181,155,0.08)_0%,transparent_65%)] pointer-events-none" />
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_86%,rgba(32,181,155,0.08)_0%,transparent_55%)] pointer-events-none" />

       {/* Grid Pattern overlay */}
       <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '1.25rem 1.25rem' }} />

       {/* Top Minimal HUD Status Badge */}
       <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-20 text-xs font-mono tracking-widest text-slate-500 uppercase">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318]/90 border border-white/10 backdrop-blur-md">
             <span className="w-1.5 h-1.5 rounded-full bg-[#20b59b] animate-pulse" />
             <span className="text-slate-300 font-semibold">North Locked</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111318]/90 border border-white/10 backdrop-blur-md text-slate-400">
             <span>Route Calculated</span>
          </div>
       </div>

       <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
             {/* Main illuminated route gradient - Ramping in certainty towards destination */}
             <linearGradient id="directorRoute" x1="50%" y1="20%" x2="50%" y2="86%">
                <stop offset="0%" stopColor="#20b59b" stopOpacity="0.35" />
                <stop offset="40%" stopColor="#20b59b" stopOpacity="0.65" />
                <stop offset="75%" stopColor="#20b59b" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
             </linearGradient>

             {/* Compass Core Radial Glow */}
             <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#20b59b" stopOpacity="0.8" />
                <stop offset="40%" stopColor="#20b59b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#20b59b" stopOpacity="0" />
             </radialGradient>

             {/* Destination Glow */}
             <radialGradient id="destGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="35%" stopColor="#20b59b" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#20b59b" stopOpacity="0" />
             </radialGradient>
          </defs>

          {/* Connected Constellation Mesh Lines (~10% graph network) */}
          <g opacity="0.6">
             {constellationLines.map((line) => (
                <line
                   key={line.id}
                   x1={line.x1}
                   y1={line.y1}
                   x2={line.x2}
                   y2={line.y2}
                   stroke="rgba(255,255,255,0.035)"
                   strokeWidth="0.12"
                />
             ))}
          </g>

          {/* Floating Knowledge Nodes */}
          {nodes.map((node) => (
             <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill="#fff"
                opacity={node.opacity}
             />
          ))}

          {/* Signal Node Brief Flash during 'signal' cycle */}
          {pulseStage === 'signal' && (
             <g transform={`translate(${signalNode.x}, ${signalNode.y})`}>
                <motion.circle
                   r="2.5"
                   fill="none"
                   stroke="#20b59b"
                   strokeWidth="0.2"
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: [0.5, 2, 1.2], opacity: [0, 1, 0.4] }}
                   transition={{ duration: 0.9, ease: "easeOut" }}
                />
                <circle r="0.8" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 3px #fff)' }} />
             </g>
          )}

          {/* Faint Alternate Paths (Showing many options evaluated by Atlas) */}
          {alternatePaths.map((path, i) => (
             <path
                key={`alt-${i}`}
                d={path}
                stroke="rgba(255,255,255,0.035)"
                strokeWidth="0.18"
                fill="none"
                strokeDasharray="0.8 1.4"
             />
          ))}

          {/* THE ONE ILLUMINATED ROUTE */}
          {/* Outer Glow Line */}
          <motion.path
             d={mainPath}
             stroke="#20b59b"
             strokeWidth="0.8"
             fill="none"
             initial={{ opacity: 0.3 }}
             animate={{ opacity: [0.3, 0.75, 0.3] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             style={{ filter: 'drop-shadow(0 0 5px rgba(32,181,155,0.8))' }}
          />

          {/* Inner Bright Core Line - Gradient ramp increases intensity towards destination */}
          <path
             d={mainPath}
             stroke="url(#directorRoute)"
             strokeWidth="0.32"
             fill="none"
          />

          {/* Pulse Light Traveling down the path during cycle */}
          {(pulseStage === 'route' || pulseStage === 'wp1' || pulseStage === 'wp2' || pulseStage === 'destination') && (
             <motion.path
                d={mainPath}
                stroke="#fff"
                strokeWidth="0.6"
                strokeDasharray="3 25"
                fill="none"
                initial={{ strokeDashoffset: 28 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2.2, ease: "easeInOut" }}
                style={{ filter: 'drop-shadow(0 0 4px #fff)' }}
             />
          )}

          {/* Waypoint 1 Checkpoint */}
          <g transform="translate(46.5, 48)">
             <circle r="0.8" fill="#20b59b" opacity="0.9" />
             <circle r="1.8" fill="none" stroke="#20b59b" strokeWidth="0.15" opacity="0.5" />
             {(pulseStage === 'wp1' || pulseStage === 'wp2' || pulseStage === 'destination') && (
                <motion.circle
                   r="3.2"
                   fill="none"
                   stroke="#20b59b"
                   strokeWidth="0.25"
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: [0.8, 1.6, 1], opacity: [0.2, 1, 0.6] }}
                   transition={{ duration: 0.8 }}
                />
             )}
          </g>

          {/* Waypoint 2 Checkpoint */}
          <g transform="translate(42.5, 62)">
             <circle r="0.8" fill="#20b59b" opacity="0.9" />
             <circle r="1.8" fill="none" stroke="#20b59b" strokeWidth="0.15" opacity="0.5" />
             {(pulseStage === 'wp2' || pulseStage === 'destination') && (
                <motion.circle
                   r="3.2"
                   fill="none"
                   stroke="#20b59b"
                   strokeWidth="0.25"
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: [0.8, 1.6, 1], opacity: [0.2, 1, 0.6] }}
                   transition={{ duration: 0.8 }}
                />
             )}
          </g>

          {/* Directional Chevron Indicators along route - aligned precisely to curve path & tangents */}
          <g>
             {/* Chevron 1 (Top segment, on curve at x=48.5, y=34, rotated -15 deg) */}
             <motion.g
                animate={{ y: [0, 0.8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                transform="translate(48.5, 34) rotate(-15)"
             >
                <path d="M -1.8 -0.6 L 0 0.6 L 1.8 -0.6" stroke="#20b59b" strokeWidth="0.22" fill="none" opacity="0.85" />
             </motion.g>

             {/* Chevron 2 (Middle segment, on curve at x=43.1, y=54, rotated -6 deg) */}
             <motion.g
                animate={{ y: [0, 0.8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                transform="translate(43.1, 54) rotate(-6)"
             >
                <path d="M -1.8 -0.6 L 0 0.6 L 1.8 -0.6" stroke="#20b59b" strokeWidth="0.22" fill="none" opacity="0.9" />
             </motion.g>

             {/* Chevron 3 (Bottom segment, on curve at x=48.0, y=76, rotated 18 deg) */}
             <motion.g
                animate={{ y: [0, 0.8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                transform="translate(48.0, 76) rotate(18)"
             >
                <path d="M -1.8 -0.6 L 0 0.6 L 1.8 -0.6" stroke="#ffffff" strokeWidth="0.28" fill="none" opacity="1" style={{ filter: 'drop-shadow(0 0 3px #20b59b)' }} />
             </motion.g>
          </g>

          {/* --- TOP: SPACECRAFT GUIDANCE COMPASS --- */}
          <g transform="translate(50, 20)">
             {/* Compass Ambient Glow */}
             <circle r="12" fill="url(#compassGlow)" />

             {/* Orbital Guidance Arc */}
             <circle r="9" fill="none" stroke="rgba(32,181,155,0.3)" strokeWidth="0.12" strokeDasharray="1.5 0.8 0.4 0.8" />
             
             {/* Precision Outer Compass Rings */}
             <circle r="7.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.15" strokeDasharray="0.5 1" />
             <circle r="5.8" fill="none" stroke="rgba(32,181,155,0.35)" strokeWidth="0.15" />

             {/* Rotating Compass Bearing Ring with Ticks */}
             <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
             >
                <circle r="6.8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.1" strokeDasharray="0.2 1.2" />
                <line x1="0" y1="-7.2" x2="0" y2="-6.2" stroke="#20b59b" strokeWidth="0.25" />
                <line x1="7.2" y1="0" x2="6.2" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" />
                <line x1="0" y1="7.2" x2="0" y2="6.2" stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" />
                <line x1="-7.2" y1="0" x2="-6.2" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.15" />
             </motion.g>

             {/* Fine Hairline Bearing Extension Lines */}
             <line x1="-11" y1="0" x2="-8.5" y2="0" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />
             <line x1="8.5" y1="0" x2="11" y2="0" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />
             <line x1="0" y1="-11" x2="0" y2="-8.5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.12" />

             {/* Compass Diamond Star Needle */}
             <motion.path
                d="M 0 -5 L 1.4 -0.8 L 5 0 L 1.4 0.8 L 0 5 L -1.4 0.8 L -5 0 L -1.4 -0.8 Z"
                fill="#20b59b"
                initial={{ scale: 0.95 }}
                animate={{ scale: [0.95, 1.08, 0.95] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: 'drop-shadow(0 0 4px rgba(32,181,155,0.85))' }}
             />

             {/* Center White Point */}
             <circle r="0.8" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 2px #fff)' }} />
          </g>

          {/* --- BOTTOM: ILLUMINATED DESTINATION BEACON --- */}
          <g transform="translate(50, 86)">
             {/* Destination Radial Soft Glow */}
             <circle r="11" fill="url(#destGlow)" />

             {/* Precision Target Ring */}
             <motion.circle
                r="3.8"
                fill="none"
                stroke="#20b59b"
                strokeWidth="0.2"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ filter: 'drop-shadow(0 0 3px #20b59b)' }}
             />

             {/* Ripple Ring during 'destination' cycle */}
             {pulseStage === 'destination' && (
                <motion.circle
                   r="3.8"
                   fill="none"
                   stroke="#ffffff"
                   strokeWidth="0.3"
                   initial={{ scale: 1, opacity: 1 }}
                   animate={{ scale: 2.8, opacity: 0 }}
                   transition={{ duration: 1.2, ease: "easeOut" }}
                />
             )}

             {/* Reticle Corner Brackets */}
             <path
                d="M -5 -2 L -5 -5 L -2 -5 M 2 -5 L 5 -5 L 5 -2 M 5 2 L 5 5 L 2 5 M -2 5 L -5 5 L -5 2"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.15"
             />

             {/* Inner Bright Destination Star */}
             <circle r="1.4" fill="#ffffff" style={{ filter: 'drop-shadow(0 0 5px #ffffff)' }} />
          </g>
       </svg>
    </div>
  );
};

const CommunityMarkersSection = () => {
  const [activeMarkerIndex, setActiveMarkerIndex] = useState(0);
  const [pulseActive, setPulseActive] = useState(true);

  // 5 Hidden Marker Beacons in the Constellation
  const markers = useMemo(() => [
     {
        id: 0,
        x: 28,
        y: 30,
        system: "CARDIOLOGY",
        title: "Aortic Dissection · Clinical Pearl",
        code: "MARKER 0x4F",
        pearl: "Sudden tearing chest pain radiating to back with asymmetric arm pulses. Type A requires immediate surgical repair; Type B managed with IV beta-blockers.",
        neighbors: [
           { x: 18, y: 18 }, { x: 38, y: 22 }, { x: 22, y: 42 }, { x: 36, y: 44 }
        ]
     },
     {
        id: 1,
        x: 72,
        y: 28,
        system: "NEUROLOGY",
        title: "MCA Stroke · Dominant vs Non-Dominant",
        code: "MARKER 0x9B",
        pearl: "Dominant hemisphere MCA occlusion causes Broca/Wernicke Aphasia; Non-dominant hemisphere MCA occlusion produces Hemispatial Neglect.",
        neighbors: [
           { x: 62, y: 16 }, { x: 84, y: 20 }, { x: 65, y: 40 }, { x: 80, y: 42 }
        ]
     },
     {
        id: 2,
        x: 50,
        y: 52,
        system: "PHARMACOLOGY",
        title: "Cytochrome P450 Inducers Mnemonic",
        code: "MARKER 0x3A",
        pearl: "Chronic Alcohol, St. John's Wort, Phenytoin, Phenobarbital, Rifampin, Carbamazepine, Griseofulvin. Accelerates metabolism of co-administered drugs.",
        neighbors: [
           { x: 40, y: 42 }, { x: 60, y: 44 }, { x: 42, y: 65 }, { x: 58, y: 68 }
        ]
     },
     {
        id: 3,
        x: 24,
        y: 74,
        system: "ONCOLOGY & PATHOLOGY",
        title: "Translocation t(8;14) · Burkitt Lymphoma",
        code: "MARKER 0x7E",
        pearl: "c-MYC proto-oncogene translocation to Ig heavy chain locus. Histology shows 'Starry Sky' appearance with lipid-laden macrophages.",
        neighbors: [
           { x: 14, y: 62 }, { x: 32, y: 64 }, { x: 18, y: 88 }, { x: 35, y: 86 }
        ]
     },
     {
        id: 4,
        x: 78,
        y: 72,
        system: "IMMUNOLOGY",
        title: "Type IV Delayed Hypersensitivity",
        code: "MARKER 0x12",
        pearl: "Cell-mediated (T-cells & Macrophages), NO antibodies. Examples: PPD tuberculin test, Contact Dermatitis (Poison Ivy, Nickel), Graft vs Host.",
        neighbors: [
           { x: 68, y: 62 }, { x: 88, y: 60 }, { x: 70, y: 86 }, { x: 86, y: 88 }
        ]
     }
  ], []);

  // Background stars for constellation background
  const backgroundStars = useMemo(() => {
     return Array.from({ length: 220 }).map((_, i) => {
        const x = 2 + Math.random() * 96;
        const y = 4 + Math.random() * 92;
        const size = Math.random() > 0.90 ? 0.45 : Math.random() > 0.6 ? 0.25 : 0.12;
        const opacity = Math.random() * 0.5 + 0.15;
        return { id: i, x, y, size, opacity };
     });
  }, []);

  // Constellation connecting lines between background stars
  const constellationEdges = useMemo(() => {
     const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
     for (let i = 0; i < backgroundStars.length; i++) {
        for (let j = i + 1; j < backgroundStars.length; j++) {
           const dx = backgroundStars[i].x - backgroundStars[j].x;
           const dy = backgroundStars[i].y - backgroundStars[j].y;
           const dist = Math.sqrt(dx * dx + dy * dy);
           // Create more subtle connections in the dense starfield
           if (dist > 3 && dist < 9 && (i * 13 + j * 7) % 11 === 0) {
              edges.push({
                 x1: backgroundStars[i].x,
                 y1: backgroundStars[i].y,
                 x2: backgroundStars[j].x,
                 y2: backgroundStars[j].y
              });
           }
        }
     }
     return edges;
  }, [backgroundStars]);

  // Cycle through active markers
  useEffect(() => {
     const interval = setInterval(() => {
        setPulseActive(false);
        setTimeout(() => {
           setActiveMarkerIndex((prev) => (prev + 1) % markers.length);
           setPulseActive(true);
        }, 300);
     }, 6000);

     return () => clearInterval(interval);
  }, [markers.length]);

  const currentMarker = markers[activeMarkerIndex];

  return (
    <section className="py-24 px-0 w-full relative z-10 border-b border-white/5">
       <div className="bg-[#05070A] border-y border-white/10 p-6 sm:p-12 lg:p-20 relative overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.05)] select-none">
          {/* Deep celestial atmospheric gradient */}
          <div 
             className="absolute inset-0 pointer-events-none" 
             style={{ 
                backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(245,158,11,0.08) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(32,181,155,0.08) 0%, transparent 60%), radial-gradient(circle at 50% 50%, rgba(56,189,248,0.04) 0%, transparent 70%)' 
             }} 
          />
          
          {/* Section Header */}
          <div className="text-center max-w-4xl mx-auto relative z-10 mb-12">
             <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <Compass className="w-3.5 h-3.5" />
                <span>CELESTIAL KNOWLEDGE REPOSITORY</span>
                <span className="w-1 h-1 rounded-full bg-amber-400/50" />
                <span className="text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs tracking-wider">COMING SOON</span>
             </div>
             
             <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white">
                   Community Markers
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                   <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                   Coming Soon
                </span>
             </div>
             <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
                Knowledge left behind for future explorers. Navigate a vast constellation where every star represents a medical topic, and hidden markers radiate shared wisdom from those who walked the path before you.
             </p>
          </div>

          {/* Main Constellation Canvas */}
          <div className="relative w-full aspect-[21/9] min-h-[500px] max-h-[700px] rounded-[32px] bg-[#030507] border border-white/10 overflow-hidden shadow-2xl relative max-w-[1600px] mx-auto">
             
             {/* HUD Top Corner Labels */}
             <div className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between text-xs font-mono tracking-widest uppercase pointer-events-none">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                   <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                   <span>RA 14h 29m · DEC +60° [WISDOM SECTOR]</span>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-slate-500">
                   <span>TOPICS: 1,420 STARS</span>
                   <span>·</span>
                   <span className="text-teal-400">PULSE SYNC: ACTIVE</span>
                </div>
             </div>

             {/* SVG Constellation Network */}
             <svg className="absolute inset-0 w-full h-full" viewBox="-10 -10 120 120" preserveAspectRatio="xMidYMid meet">
                <defs>
                   <filter id="starGlowGold" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="1.2" result="blur" />
                      <feMerge>
                         <feMergeNode in="blur" />
                         <feMergeNode in="SourceGraphic" />
                      </feMerge>
                   </filter>
                   <filter id="starGlowTeal" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="1.2" result="blur" />
                      <feMerge>
                         <feMergeNode in="blur" />
                         <feMergeNode in="SourceGraphic" />
                      </feMerge>
                   </filter>
                   <linearGradient id="wisdomPulseGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                      <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#20b59b" stopOpacity="0" />
                   </linearGradient>
                </defs>

                {/* Constellation Filaments */}
                {constellationEdges.map((edge, i) => (
                   <line
                      key={`edge-${i}`}
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="0.12"
                   />
                ))}

                {/* Background Topic Stars */}
                {backgroundStars.map((star) => (
                   <circle
                      key={`star-${star.id}`}
                      cx={star.x}
                      cy={star.y}
                      r={star.size}
                      fill="#ffffff"
                      opacity={star.opacity}
                   />
                ))}

                {/* --- ACTIVE WISDOM PULSE RAYS FROM CURRENT MARKER TO NEIGHBORS --- */}
                {pulseActive && currentMarker.neighbors.map((n, idx) => (
                   <g key={`pulse-ray-${idx}`}>
                      {/* Pulse path line */}
                      <motion.line
                         x1={currentMarker.x}
                         y1={currentMarker.y}
                         x2={n.x}
                         y2={n.y}
                         stroke="url(#wisdomPulseGrad)"
                         strokeWidth="0.35"
                         initial={{ pathLength: 0, opacity: 0 }}
                         animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0.2] }}
                         transition={{ duration: 1.6, delay: idx * 0.1, ease: "easeOut" }}
                      />
                      {/* Illuminated Neighbor Star */}
                      <motion.circle
                         cx={n.x}
                         cy={n.y}
                         r="0.8"
                         fill="#20b59b"
                         initial={{ scale: 0.5, opacity: 0.3 }}
                         animate={{ scale: [1, 2, 1.2], opacity: [0.3, 1, 0.8] }}
                         transition={{ duration: 1.2, delay: 0.8 + idx * 0.1 }}
                         style={{ filter: 'drop-shadow(0 0 3px #20b59b)' }}
                      />
                   </g>
                ))}

                {/* --- ALL 5 HIDDEN MARKER BEACON STARS --- */}
                {markers.map((m, idx) => {
                   const isActive = idx === activeMarkerIndex;
                   return (
                      <g 
                         key={`marker-beacon-${m.id}`} 
                         onClick={() => {
                            setActiveMarkerIndex(idx);
                            setPulseActive(true);
                         }}
                         className="cursor-pointer group"
                      >
                         {/* Outer Diamond Halo for Markers */}
                         <polygon
                            points={`${m.x},${m.y-2.8} ${m.x+2.4},${m.y} ${m.x},${m.y+2.8} ${m.x-2.4},${m.y}`}
                            fill={isActive ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.03)"}
                            stroke={isActive ? "#f59e0b" : "rgba(255,255,255,0.2)"}
                            strokeWidth="0.18"
                         />

                         {/* Active Expanding Beacon Ring */}
                         {isActive && pulseActive && (
                            <motion.circle
                               cx={m.x}
                               cy={m.y}
                               r="1.5"
                               fill="none"
                               stroke="#f59e0b"
                               strokeWidth="0.2"
                               initial={{ r: 1.5, opacity: 0.9 }}
                               animate={{ r: 9, opacity: 0 }}
                               transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                            />
                         )}

                         {/* Marker Core Star */}
                         <circle
                            cx={m.x}
                            cy={m.y}
                            r={isActive ? "1.1" : "0.7"}
                            fill={isActive ? "#ffffff" : "#f59e0b"}
                            style={{ filter: isActive ? 'drop-shadow(0 0 5px #f59e0b)' : 'none' }}
                         />

                         {/* Marker Code Tag (Small Label under star) */}
                         <text
                            x={m.x}
                            y={m.y + 4.5}
                            fill={isActive ? "#f59e0b" : "rgba(255,255,255,0.4)"}
                            fontSize="1.1"
                            fontFamily="monospace"
                            fontWeight={isActive ? "600" : "400"}
                            textAnchor="middle"
                            className="transition-colors"
                         >
                            {m.code}
                         </text>
                      </g>
                   );
                })}
             </svg>

             {/* --- OVERLAY WISDOM CARD (FOR ACTIVE MARKER) --- */}
             <AnimatePresence mode="wait">
                <motion.div
                   key={`card-${currentMarker.id}`}
                   initial={{ opacity: 0, y: 12, scale: 0.96 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: -10, scale: 0.96 }}
                   transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                   className="absolute bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-30 bg-[#080B10]/95 border border-amber-500/30 backdrop-blur-xl rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3"
                >
                   <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                         <span className="text-xs font-mono tracking-widest text-amber-400 uppercase font-semibold">
                            {currentMarker.system} · {currentMarker.code}
                         </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">DISCOVERED WISDOM</span>
                   </div>

                   <h3 className="text-base font-medium text-white tracking-tight">
                      {currentMarker.title}
                   </h3>

                   <p className="text-xs text-slate-300 leading-relaxed font-mono bg-white/[0.02] p-3 rounded-lg border border-white/5">
                      "{currentMarker.pearl}"
                   </p>

                   <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                      <span className="text-teal-400/90 font-medium flex items-center gap-1.5">
                         <span className="w-1 h-1 rounded-full bg-teal-400 animate-pulse" />
                         WISDOM PULSE RELEASED TO 4 NEIGHBORING TOPICS
                      </span>
                      <span className="text-slate-500">CLASS OF '24</span>
                   </div>
                </motion.div>
             </AnimatePresence>

             {/* Interactive Selector Dots on Bottom Left */}
             <div className="absolute top-12 left-6 z-20 flex flex-col gap-2 bg-[#06080C]/80 border border-white/10 backdrop-blur p-2.5 rounded-xl">
                <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase mb-0.5">Explore Markers</span>
                <div className="flex items-center gap-1.5">
                   {markers.map((m, idx) => (
                      <button
                         key={`dot-${idx}`}
                         onClick={() => {
                            setActiveMarkerIndex(idx);
                            setPulseActive(true);
                         }}
                         className={`w-2.5 h-2.5 rounded-full transition-all ${
                            idx === activeMarkerIndex 
                               ? 'bg-amber-400 scale-125 shadow-[0_0_8px_#f59e0b]' 
                               : 'bg-white/20 hover:bg-white/40'
                         }`}
                         title={m.title}
                      />
                   ))}
                </div>
             </div>

          </div>

          {/* Bottom HUD Metadata */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/5 text-xs font-mono tracking-wider text-slate-400">
             <div className="flex items-center gap-3 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                <span>CONSTELLATION LUMINANCE: <span className="text-white font-semibold">+84% ILLUMINATED</span></span>
             </div>
             <div className="flex items-center gap-3 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#20b59b]" />
                <span>1,842 KNOWLEDGE MARKERS LEFT BY PREDECEESSORS</span>
             </div>
             <div className="text-slate-500">
                ATLAS CELESTIAL MAPPING V3.0
             </div>
          </div>
       </div>
    </section>
  );
};

const rotatingPhrases = [
  "Navigate your medical journey.",
  "Study with direction.",
  "Every revision has a purpose."
];

function RotatingText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-8 overflow-hidden relative mt-4">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-[#20b59b] font-medium tracking-tight absolute inset-0"
        >
          {rotatingPhrases[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// --- Floating Particles ---
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 bg-white/30 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 4 + 4,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const { flags } = useFeatureFlags();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

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
    <div className="min-h-screen bg-[#06080A] text-slate-50 font-sans overflow-x-hidden selection:bg-[#20b59b]/30 relative">
      
      {/* Global Connecting Grid & Navigation Motifs */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '3rem 3rem' }} />
      <div className="fixed left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none z-0 hidden lg:block" />
      
      {/* Nav */}
      <nav className="absolute top-0 inset-x-0 h-24 flex items-center justify-between px-6 lg:px-12 z-50">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#20b59b]/10 border border-[#20b59b]/20 flex items-center justify-center backdrop-blur-md">
              <svg className="w-6 h-6" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            </div>
            <span className="font-semibold text-xl tracking-tight text-white">Atlas</span>
         </div>
         <Button onClick={handleSignIn} disabled={loading} variant="ghost" className="text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 px-6">
            Log In
         </Button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[100dvh] flex flex-col lg:flex-row w-full border-b border-white/5 z-10 pt-20">
        <Particles />
        
        {/* Left: Marketing / Value Prop */}
        <div className="flex-1 relative flex flex-col justify-center p-8 lg:p-20 xl:p-24 z-10">
          <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-[#20b59b]/5 rounded-full blur-[120px] pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl relative"
          >
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-500 uppercase mb-8">
               <span>[45° 23' N, 12° 32' E]</span>
               <div className="w-8 h-px bg-white/10" />
               <span>Navigation System</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-medium tracking-tight leading-[1.05] text-white mb-6">
              Never wonder what to study next again.
            </h1>
            
            <RotatingText />
            
            <p className="mt-8 text-lg lg:text-xl text-slate-300 leading-relaxed max-w-xl font-medium">
              Atlas computes the next most valuable topic to study based on your curriculum, revision history, confidence and performance.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
              <Button 
                onClick={handleSignIn}
                className="w-full sm:w-auto h-14 px-8 rounded-full bg-white text-black hover:bg-slate-200 text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Join Atlas
              </Button>
              <Button 
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 rounded-full bg-white/5 border-white/10 hover:bg-white/10 text-white text-base font-medium backdrop-blur-md transition-all duration-300 group hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 mr-2 group-hover:text-[#20b59b] transition-colors" fill="currentColor" />
                Watch Product Tour
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Right: Engine Visualization */}
        <div className="flex-1 relative flex items-center justify-center p-8 lg:p-16 z-10">
           <div className="absolute top-1/2 right-1/4 w-[35rem] h-[35rem] bg-[#20b59b]/8 rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
           <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-full relative scale-105 xl:scale-120 xl:origin-left"
           >
              <HeroVisualization />
           </motion.div>
        </div>
      </section>

      {/* --- HOW ATLAS THINKS --- */}
      <section className="py-32 px-6 lg:px-12 max-w-7xl mx-auto relative z-10 border-b border-white/5">
         <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20b59b]/10 border border-[#20b59b]/20 text-[#20b59b] text-xs font-semibold tracking-widest uppercase mb-6">
               <Target className="w-3 h-3" /> Decision Engine
            </div>
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight">How Atlas Thinks</h2>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto font-medium">Atlas doesn't just track data. It processes your unique learning signals to compute the mathematically optimal next step.</p>
         </div>

         {/* Editorial Computational Visualization */}
         <HowAtlasThinksVisualization />
      </section>

      {/* --- FEATURE SHOWCASE --- */}
      <section className="py-32 px-6 lg:px-12 max-w-7xl mx-auto space-y-40 relative z-10 border-b border-white/5">
        
        {/* Feature 1 */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative group">
          <div className="flex-1 lg:pr-12 relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20b59b]/10 border border-[#20b59b]/20 text-[#20b59b] text-xs font-semibold tracking-widest uppercase mb-6">
                <Compass className="w-3 h-3" /> Core OS
             </div>
             <h3 className="text-4xl lg:text-5xl font-medium tracking-tight mb-6 text-white group-hover:text-[#20b59b] transition-colors duration-500">Your Personal Academic Director</h3>
             <p className="text-slate-300 text-lg leading-relaxed font-medium">
               Atlas acts as your personal academic director. It continuously analyzes your entire medical knowledge footprint to recommend exactly what to study next using multiple learning signals.
             </p>
          </div>
          <div className="flex-[1.2] w-full relative z-10">
             <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#20b59b]/10 to-transparent opacity-50 blur-[100px] rounded-full pointer-events-none" />
                <AcademicDirectorVisualization />
             </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24 relative group">
          <div className="flex-1 lg:pl-12 relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-widest uppercase mb-6">
                <BookOpen className="w-3 h-3" /> Architecture
             </div>
             <h3 className="text-4xl lg:text-5xl font-medium tracking-tight mb-6 text-white group-hover:text-blue-400 transition-colors duration-500">Architect Your Entire Medical Curriculum</h3>
             <p className="text-slate-300 text-lg leading-relaxed font-medium">
                Map out subjects, systems, topics, and subtopics with blueprint precision. Track completed, in-progress, and unexplored branches across your entire medical journey.
             </p>
          </div>
          <div className="flex-[1.2] w-full relative z-10">
             <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-bl from-[#20b59b]/10 to-transparent opacity-50 blur-3xl rounded-full pointer-events-none" />
                <CurriculumVisualization />
             </div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 relative group">
          <div className="flex-1 lg:pr-12 relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38bdf8]/10 border border-[#38bdf8]/20 text-[#38bdf8] text-xs font-semibold tracking-widest uppercase mb-6">
                <Brain className="w-3 h-3" /> Adaptive Memory
             </div>
             <h3 className="text-4xl lg:text-5xl font-medium tracking-tight mb-6 text-white group-hover:text-[#38bdf8] transition-colors duration-500">Revision That Adapts To You</h3>
             <p className="text-slate-300 text-lg leading-relaxed font-medium">
               Atlas understands the science of memory decay. As knowledge naturally fades, our adaptive engine calculates your exact retention threshold and triggers targeted revitalization at the optimal instant — transforming forgetting into permanent mastery.
             </p>
          </div>
          <div className="flex-[1.2] w-full relative z-10">
             <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#38bdf8]/10 via-[#20b59b]/10 to-transparent opacity-50 blur-3xl rounded-full pointer-events-none" />
                <AdaptiveRevisionVisualization />
             </div>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24 relative group">
          <div className="flex-1 lg:pl-12 relative z-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-widest uppercase mb-6">
                <Activity className="w-3 h-3" /> Trajectory
             </div>
             <h3 className="text-4xl lg:text-5xl font-medium tracking-tight mb-6 text-white group-hover:text-amber-400 transition-colors duration-500">Performance Analytics</h3>
             <p className="text-slate-300 text-lg leading-relaxed font-medium">
                Visualize measurable improvement. Where traditional studying plateaus or falters under cramming, Atlas creates an accelerating path toward continuous high-yield mastery.
             </p>
          </div>
          <div className="flex-[1.2] w-full relative z-10">
             <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-[#20b59b]/10 to-transparent opacity-50 blur-3xl rounded-full pointer-events-none" />
                <PerformanceTrajectoryVisualization />
             </div>
          </div>
        </div>

      </section>

      {/* --- COMMUNITY MARKERS CONSTELLATION --- */}
      {flags.communityMarkers && <CommunityMarkersSection />}

      {/* --- WHY ATLAS --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
         <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-medium tracking-tight text-white">Replace the noise with focus.</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
               { title: "Stop managing spreadsheets.", desc: "Your curriculum is too complex for static rows and columns. Atlas brings it to life.", icon: Activity },
               { title: "Stop guessing what deserves attention.", desc: "Our engine analyzes your history to surface the exact topics you need to review today.", icon: Brain },
               { title: "Stop forgetting completed topics.", desc: "With automated spaced repetition schedules, knowledge retention becomes a mathematical certainty.", icon: Clock },
               { title: "Replace scattered tools.", desc: "One intelligent operating system for everything: planning, execution, and review.", icon: Compass }
            ].map((card, i) => (
                 <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5, delay: i * 0.1 }}
                 className="p-8 rounded-[32px] bg-[#111318]/50 backdrop-blur-sm border border-white/5 hover:bg-[#111318] hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group cursor-default"
               >
                  <div className="w-12 h-12 rounded-2xl bg-[#0a0c10] border border-white/5 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:border-[#20b59b]/20 transition-all duration-300 shadow-inner">
                     <card.icon className="w-5 h-5 text-slate-400 group-hover:text-[#20b59b] transition-colors" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2 tracking-tight group-hover:text-[#20b59b] transition-colors">{card.title}</h3>
                  <p className="text-slate-300 leading-relaxed font-medium text-sm">{card.desc}</p>
               </motion.div>
            ))}
         </div>
      </section>
      
      {/* --- SMALL CLOUD SYNC BANNER --- */}
      <section className="py-12 px-6 max-w-7xl mx-auto relative z-10">
         <div className="rounded-[24px] bg-[#111318] border border-white/5 p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-lg relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#20b59b]/5 to-transparent pointer-events-none" />
             <div className="flex items-center gap-5 relative z-10 flex-col sm:flex-row">
                <div className="w-12 h-12 rounded-xl bg-[#0a0c10] border border-white/5 flex items-center justify-center shrink-0">
                   <Cloud className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                   <h4 className="text-base font-medium text-white mb-1">Cross-Device Sync</h4>
                   <p className="text-sm text-slate-300 font-medium">Your progress automatically follows you across phone, tablet, and desktop securely.</p>
                </div>
             </div>
             <div className="hidden md:flex items-center gap-3 text-slate-500 relative z-10 shrink-0">
                <Smartphone className="w-5 h-5" />
                <div className="w-4 h-px bg-white/10" />
                <Cloud className="w-5 h-5" />
                <div className="w-4 h-px bg-white/10" />
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 stroke-current" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
             </div>
         </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 px-6 relative z-10">
         <div className="max-w-4xl mx-auto rounded-[40px] bg-gradient-to-br from-[#111318] to-[#0A0C10] border border-white/5 p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#20b59b]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
               <h2 className="text-4xl lg:text-6xl font-medium tracking-tight mb-6 text-white">Stop deciding.<br/>Start studying.</h2>
               <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto font-medium">Atlas decides what comes next.</p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    onClick={handleSignIn}
                    className="w-full sm:w-auto h-12 px-8 rounded-xl bg-white text-black hover:bg-slate-200 text-base font-medium transition-all duration-300 shadow-lg"
                  >
                    Join Atlas
                  </Button>
               </div>
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-[#06080A] py-12 px-6 relative overflow-hidden z-10">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                  <Compass className="w-4 h-4 text-slate-400" />
               </div>
               <span className="font-medium tracking-tight text-slate-300">Atlas OS</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
               <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
               <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
               <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            
            <div className="flex items-center gap-4 text-slate-500">
               <a href="#" className="hover:text-white transition-colors">
                 <Twitter className="w-4 h-4" />
               </a>
               <a href="#" className="hover:text-white transition-colors">
                 <Github className="w-4 h-4" />
               </a>
            </div>
         </div>
      </footer>
    </div>
  );
}
