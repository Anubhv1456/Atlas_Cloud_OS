import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  barClassName?: string;
  showShimmer?: boolean;
}

export function ProgressBar({ progress, className, barClassName, showShimmer = true }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  const isComplete = clamped === 100;
  
  return (
    <div className={cn("w-full bg-muted/40 dark:bg-white/[0.04] rounded-full overflow-hidden h-1.5 relative", className)}>
      <div 
        className={cn(
          "h-full transition-all duration-500 ease-out rounded-full relative", 
          isComplete 
            ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400" 
            : "bg-gradient-to-r from-primary/90 to-primary",
          barClassName
        )}
        style={{ width: `${clamped}%` }}
      >
        {/* Subtle sheen highlight line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-white/25 rounded-full" />
        
        {/* Optional completion glow effect */}
        {showShimmer && isComplete && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        )}
      </div>
    </div>
  );
}

