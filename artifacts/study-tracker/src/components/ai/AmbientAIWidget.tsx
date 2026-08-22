import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Search, 
  ArrowRight, 
  Command, 
  Volume2, 
  Brain,
  Zap,
  CornerDownLeft,
  BookOpen,
  Trophy,
  Calendar,
  Layers,
  Settings as SettingsIcon,
  Flame,
  X
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAISettings } from '@/lib/ai/aiSettingsStorage';
import { UNIVERSAL_ONTOLOGY } from '@/data/ontology';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface AmbientAIWidgetProps {
  onOpenChat?: (initialMode?: 'text' | 'voice') => void;
  className?: string;
  isListening?: boolean;
  onToggleVoice?: () => void;
  interimSpeech?: string;
}

const ROTATING_PROMPTS = [
  "Ask Atlas, log a study session, or dictate a clinical pearl...",
  "e.g. 'Studied CVS physiology for 45 minutes, feeling confident'",
  "e.g. 'DOC for acute severe manic episode with psychosis'",
  "e.g. 'Triad of renal cell carcinoma: hematuria, flank pain, mass'",
  "e.g. 'In Mock GT 14 scored 142/200, weak in Pharmacology'"
];

const QUICK_NAV_ITEMS = [
  { label: '20th Notebook & Clinical Pearls', path: '/mistakes', icon: Flame, color: 'text-amber-500 bg-amber-500/10' },
  { label: 'Memory Decay Radar', path: '/radar', icon: Zap, color: 'text-primary bg-primary/10' },
  { label: 'Mock Test Analytics', path: '/analytics', icon: Trophy, color: 'text-indigo-500 bg-indigo-500/10' },
  { label: 'Study Timeline & Sprints', path: '/timeline', icon: Calendar, color: 'text-teal-500 bg-teal-500/10' },
  { label: 'Configure AI Assistant & API Key', path: '/settings', icon: SettingsIcon, color: 'text-purple-500 bg-purple-500/10' },
];

export const AmbientAIWidget: React.FC<AmbientAIWidgetProps> = ({
  onOpenChat,
  className,
  isListening = false,
  onToggleVoice,
  interimSpeech = ''
}) => {
  const [, setLocation] = useLocation();
  const { settings } = useAISettings();
  const [promptIndex, setPromptIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Fallback Search Bar State (when AI is disabled)
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect OS for keyboard shortcut display (⌘ vs Ctrl)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator?.userAgent) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }
  }, []);

  // Rotate placeholder prompt every 4.5 seconds when idle (AI active mode)
  useEffect(() => {
    if (!settings.isAiEnabled || isHovered || isFocused || isListening) return;
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % ROTATING_PROMPTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [settings.isAiEnabled, isHovered, isFocused, isListening]);

  // Global Keyboard Shortcuts (⌘K / Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput = 
        target?.tagName === 'INPUT' || 
        target?.tagName === 'TEXTAREA' || 
        target?.tagName === 'SELECT' ||
        Boolean(target?.isContentEditable) ||
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT' ||
        Boolean(activeEl?.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (settings.isAiEnabled) {
          onOpenChat?.('text');
        } else {
          setIsSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        return;
      }

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        if (settings.isAiEnabled) {
          onOpenChat?.('text');
        } else {
          setIsSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        return;
      }

      // 'V' for fast voice trigger when AI is enabled and not typing
      if (settings.isAiEnabled && e.key.toLowerCase() === 'v' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (onToggleVoice) {
          onToggleVoice();
        } else {
          onOpenChat?.('voice');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.isAiEnabled, onOpenChat, onToggleVoice]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  // Filtered Subjects for Quick Navigation (0ms instant search)
  const filteredSubjects = UNIVERSAL_ONTOLOGY.filter((s) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6);

  const handleNavigate = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setLocation(path);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ZERO-OVERHEAD FALLBACK: Quick Curriculum Navigation Search Bar
  // ─────────────────────────────────────────────────────────────────────────────
  if (!settings.isAiEnabled) {
    return (
      <div 
        ref={searchContainerRef}
        className={cn(
          "w-full max-w-2xl mx-auto relative select-none",
          className
        )}
      >
        <div
          id="ambient-search-widget"
          onClick={() => {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          className={cn(
            "relative flex items-center justify-between w-full h-12 px-3.5 sm:px-5 rounded-full transition-all duration-200 cursor-pointer shadow-2xs",
            "bg-card/90 dark:bg-card/75 backdrop-blur-xl border border-border/80 dark:border-border/60 hover:border-primary/50",
            isSearchOpen && "ring-2 ring-primary/30 border-primary shadow-md"
          )}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal truncate">
              Search 19 curriculum subjects, 20th notebook pearls, or quick navigation...
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden md:flex items-center gap-0.5 px-2 py-1 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/60 text-[10px] font-mono text-muted-foreground tracking-tight">
              <span>{isMac ? '⌘' : 'Ctrl'}</span>
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Quick Navigation & Subject Search Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-14 left-0 right-0 z-50 p-3 rounded-2xl bg-card border border-border/80 shadow-xl backdrop-blur-xl overflow-hidden"
            >
              {/* Search input field */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/60 mb-2.5">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type subject name (e.g. Pharmacology, Pathology)..."
                  className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsSearchOpen(false);
                    if (e.key === 'Enter' && filteredSubjects.length > 0) {
                      handleNavigate(`/subjects/${filteredSubjects[0].id}`);
                    }
                  }}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Matching Curriculum Subjects */}
              <div className="space-y-1 mb-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  {searchQuery ? `Subjects Matching "${searchQuery}"` : "Universal Medical Subjects"}
                </div>
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleNavigate(`/subjects/${sub.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/80 text-left text-xs transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                          {sub.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {sub.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {sub.systems?.length || 0} systems
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground px-3 py-2 italic">
                    No subjects found matching "{searchQuery}".
                  </p>
                )}
              </div>

              {/* Quick Jump Links */}
              <div className="border-t border-border/60 pt-2 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  Quick Navigation Hub
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {QUICK_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted/80 text-left text-xs text-foreground transition-colors cursor-pointer"
                      >
                        <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0", item.color)}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] font-medium truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Banner */}
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground px-2">
                <span>⚡ AI Assistant is off (Zero battery & API overhead)</span>
                <button
                  type="button"
                  onClick={() => handleNavigate('/settings')}
                  className="text-primary hover:underline font-semibold"
                >
                  Enable in Settings →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACTIVE AI AMBIENT WIDGET
  // ─────────────────────────────────────────────────────────────────────────────
  const handleTextClick = () => {
    onOpenChat?.('text');
  };

  const handleMicClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleVoice) {
      onToggleVoice();
    } else {
      onOpenChat?.('voice');
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto relative group select-none",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient Outer Glow Gradient on Hover / Active */}
      <div 
        className={cn(
          "absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary/30 via-teal-500/20 to-amber-500/30 opacity-0 blur-md transition-all duration-500 group-hover:opacity-100",
          (isListening || isFocused) && "opacity-100 blur-lg from-rose-500/40 via-primary/30 to-amber-500/40 animate-pulse"
        )} 
      />

      {/* Main Pill Surface */}
      <div
        id="ambient-ai-widget"
        role="button"
        tabIndex={0}
        onClick={handleTextClick}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "relative flex items-center justify-between w-full h-12 sm:h-13 px-3.5 sm:px-5 rounded-full transition-all duration-300 cursor-pointer shadow-sm",
          "bg-card/90 dark:bg-card/75 backdrop-blur-xl border border-border/80 dark:border-border/60 hover:border-primary/50 dark:hover:border-primary/40",
          isListening 
            ? "ring-2 ring-rose-500/40 border-rose-500/60 bg-rose-500/5 dark:bg-rose-950/20" 
            : "hover:shadow-md hover:bg-card/95"
        )}
      >
        {/* Left: Sparkle / AI Indicator & Rotating Text Trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-2">
          <div className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300",
            isListening
              ? "bg-rose-500 text-white animate-pulse"
              : "bg-primary/10 text-primary group-hover:scale-105 group-hover:bg-primary/15"
          )}>
            {isListening ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </div>

          {/* Text Placeholder / Live Voice Transcript */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {isListening ? (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 truncate">
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="truncate">
                  {interimSpeech ? `"${interimSpeech}"` : "Listening... Speak your pearl or study log"}
                </span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.p
                  key={promptIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground/90 font-normal tracking-normal truncate"
                >
                  {ROTATING_PROMPTS[promptIndex]}
                </motion.p>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Controls: Keyboard Hint & Tactile Mic Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Keyboard Shortcut Hint Pill (Desktop only) */}
          <div className="hidden md:flex items-center gap-0.5 px-2 py-1 rounded-md bg-muted/60 dark:bg-muted/40 border border-border/60 text-[10px] font-mono text-muted-foreground tracking-tight">
            <span>{isMac ? '⌘' : 'Ctrl'}</span>
            <span>K</span>
          </div>

          {/* Vertical Divider */}
          <div className="h-4 w-px bg-border/80 mx-0.5" />

          {/* Tactile Microphone Trigger Button */}
          <button
            id="ambient-widget-mic-btn"
            type="button"
            onClick={handleMicClick}
            className={cn(
              "relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
              isListening
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95"
            )}
            title={isListening ? "Stop listening" : "Click to speak (or press V)"}
          >
            {isListening ? (
              <div className="flex items-center justify-center">
                <MicOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {/* Audio Waveform Ripple */}
                <span className="absolute -inset-1 rounded-full border-2 border-rose-500/60 animate-ping pointer-events-none" />
              </div>
            ) : (
              <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-primary group-hover:text-primary transition-colors" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
