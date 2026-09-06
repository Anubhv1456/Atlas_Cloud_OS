import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Share2, Download, Copy, Check, Sparkles, X, Loader2 } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { cn } from '@/lib/utils';
import { PhaseType } from './UsmleAtlasSkyModal';
import { AtlasNorthStar } from '@/components/AtlasNorthStar';

export interface MappedStar {
  name: string;
  shortName?: string;
  phase: PhaseType;
  phaseLabel: string;
  angle: number;
  radiusPercent: number;
  x: number;
  y: number;
  state: 'not_started' | 'in_progress' | 'revising' | 'strong' | 'completed';
  progress: number;
  dbSubjectId: string | null;
  totalSystemsCount: number;
  strongSystemsCount: number;
  weakSystemsCount: number;
  completedAtTime: number;
}

interface AtlasSkyShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  globalHealth: number;
  mappedStars: MappedStar[];
  completedChronologicalChain: MappedStar[];
}

export function UsmleAtlasSkyShareModal({
  open,
  onOpenChange,
  globalHealth,
  mappedStars,
  completedChronologicalChain
}: AtlasSkyShareModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSuccessText, setExportSuccessText] = useState<string | null>(null);

  const completedCount = mappedStars.filter(s => s.state === 'completed').length;
  const todayDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  const exportOptions = {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#030303',
    fontEmbedCSS: '',
    skipFonts: true,
  };

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setExportSuccessText(null);
    try {
      const dataUrl = await toPng(exportRef.current, exportOptions);
      const link = document.createElement('a');
      link.download = `atlas-sky-constellation-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      setExportSuccessText('Image downloaded successfully!');
      setTimeout(() => setExportSuccessText(null), 3000);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setExportSuccessText(null);
    try {
      const blob = await toBlob(exportRef.current, exportOptions);
      if (!blob) throw new Error('Blob generation failed');

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setExportSuccessText('Copied card image to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setExportSuccessText(null);
      }, 3000);
    } catch (err) {
      console.error('Copy failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    setExportSuccessText(null);
    try {
      const blob = await toBlob(exportRef.current, exportOptions);
      if (!blob) throw new Error('Blob generation failed');

      const file = new File([blob], 'atlas-sky-constellation.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Atlas Sky - Personal Knowledge Signature',
          text: `My Atlas Sky Constellation • ${Math.round(globalHealth)}% Retention Luminosity • ${completedCount} Subjects Mastered`
        });
      } else {
        // Fallback to direct download
        await handleDownload();
      }
    } catch (err) {
      // AbortError is triggered if user cancels share sheet
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton 
        className={cn(
          "max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6",
          "bg-[#09090b] text-zinc-100 border border-white/10 rounded-2xl shadow-2xl font-sans"
        )}
      >
        <DialogTitle className="sr-only">Share Atlas Sky Constellation</DialogTitle>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                Share Atlas Sky Map
              </h3>
              <p className="text-xs text-zinc-400">
                Export high-resolution astronomical retention card
              </p>
            </div>
          </div>

          <button 
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Preview Area */}
        <div className="my-4 flex flex-col items-center justify-center">
          
          {/* THE ACTUAL EXPORT CARD ELEMENT TO BE CAPTURED BY HTML-TO-IMAGE */}
          <div 
            ref={exportRef}
            className="relative w-full max-w-[500px] aspect-square rounded-2xl bg-[#030303] text-zinc-100 p-6 flex flex-col justify-between overflow-hidden border border-white/10 shadow-2xl select-none"
            style={{ backgroundColor: '#030303' }}
          >
            {/* Background Ambient Nebula Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-900/15 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* CARD TOP BAR */}
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase font-mono">
                    ATLAS SKY
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Astronomical Map of Medical Retention
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  {Math.round(globalHealth)}% LUMINOSITY
                </span>
                {completedCount > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {completedCount}/19 MASTERED
                  </span>
                )}
              </div>
            </div>

            {/* CARD CENTER CELESTIAL CANVAS */}
            <div className="relative z-10 my-auto w-full aspect-square max-w-[340px] max-h-[340px] mx-auto flex items-center justify-center">
              
              {/* SVG Orbit Rings & Golden Constellation Lines */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="goldenExportGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="0.4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <linearGradient id="exportStarlightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.9" />
                  </linearGradient>

                  <radialGradient id="exportJointHalo">
                    <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Concentric Orbit Rings */}
                <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.25" strokeDasharray="1 1.5" />
                <circle cx="50" cy="50" r="31" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.25" strokeDasharray="1.5 2" />
                <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.25" strokeDasharray="2 2.5" />

                {/* Chronological Golden Constellation Lines */}
                {completedChronologicalChain.map((currStar, index) => {
                  if (index === 0) return null;
                  const prevStar = completedChronologicalChain[index - 1];

                  return (
                    <g key={`export-line-${prevStar.name}-${currStar.name}`}>
                      {/* Ambient outer glow */}
                      <line 
                        x1={prevStar.x}
                        y1={prevStar.y}
                        x2={currStar.x}
                        y2={currStar.y}
                        stroke="rgba(251, 191, 36, 0.35)"
                        strokeWidth="0.65"
                        filter="url(#goldenExportGlow)"
                      />
                      {/* Core starlight vector line */}
                      <line 
                        x1={prevStar.x}
                        y1={prevStar.y}
                        x2={currStar.x}
                        y2={currStar.y}
                        stroke="url(#exportStarlightGrad)"
                        strokeWidth="0.26"
                        strokeLinecap="round"
                      />
                      {/* Endpoint Joint Halos */}
                      <circle cx={prevStar.x} cy={prevStar.y} r="0.75" fill="url(#exportJointHalo)" opacity="0.9" />
                      <circle cx={currStar.x} cy={currStar.y} r="0.75" fill="url(#exportJointHalo)" opacity="0.9" />
                    </g>
                  );
                })}
              </svg>

              {/* Central North Star Anchor */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center">
                <AtlasNorthStar size="sm" pulse glowing globalHealth={globalHealth} />
              </div>

              {/* Subject Celestial Star Nodes */}
              {mappedStars.map(star => {
                const isCompleted = star.state === 'completed';
                const isSupernova = star.state === 'revising';
                const isProgress = star.state === 'in_progress' || star.state === 'strong';
                const isDarkMatter = star.state === 'not_started';
                const isUpperHemisphere = star.y < 48;

                return (
                  <div
                    key={`export-star-${star.name}`}
                    className="absolute z-20 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: `${star.x}%`, top: `${star.y}%` }}
                  >
                    {/* Celestial Star Beacon */}
                    <div 
                      className={cn(
                        "rounded-full transition-all duration-300 flex items-center justify-center",
                        isCompleted
                          ? "w-2.5 h-2.5 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] ring-2 ring-amber-400/40"
                          : isSupernova
                            ? "w-2.5 h-2.5 bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,1)] ring-2 ring-amber-400 animate-pulse"
                            : isProgress
                              ? "w-2 h-2 bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.7)]"
                              : "w-1.5 h-1.5 bg-zinc-800 border border-zinc-700/40 opacity-40"
                      )}
                    />

                    {/* Star Label */}
                    <span 
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 text-[8px] font-semibold tracking-tight text-center whitespace-nowrap leading-tight px-0.5 rounded-xs pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
                        isUpperHemisphere ? "-top-3.5" : "top-2.5",
                        isCompleted
                          ? "text-amber-300 font-bold"
                          : isSupernova
                            ? "text-amber-400 font-bold"
                            : isProgress
                              ? "text-zinc-200"
                              : "text-zinc-600 opacity-60"
                      )}
                    >
                      {star.shortName || star.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* SHARED LEGEND */}
            <div className="relative z-10 flex items-center justify-center gap-4 py-1.5 mb-2 border-t border-white/5 opacity-80">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-zinc-800 border border-zinc-700/50" />
                <span className="text-[7px] text-zinc-500 uppercase tracking-tighter">Dark Matter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
                <span className="text-[7px] text-amber-500/80 uppercase tracking-tighter">Supernova</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[7px] text-amber-400/80 uppercase tracking-tighter">Mastered</span>
              </div>
            </div>

            {/* CARD FOOTER BRANDING */}
            <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-zinc-500">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>PERSONAL KNOWLEDGE SIGNATURE</span>
              </div>
              <div>
                <span>{todayDate} • ATLAS MEDICAL OS</span>
              </div>
            </div>

          </div>

        </div>

        {/* Success Alert Feedback */}
        {exportSuccessText && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs text-center font-medium animate-in fade-in">
            {exportSuccessText}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <button
            onClick={handleShare}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-semibold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>Share Image</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 font-medium text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-zinc-400" />
            )}
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 font-medium text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {copied ? (
              <Check className="w-4 h-4 text-teal-400" />
            ) : (
              <Copy className="w-4 h-4 text-zinc-400" />
            )}
            <span>{copied ? 'Copied!' : 'Copy Image'}</span>
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
