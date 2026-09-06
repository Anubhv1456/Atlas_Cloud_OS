import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateGraphicProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyStateGraphic({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateGraphicProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-border/60 bg-muted/20 relative overflow-hidden',
        className
      )}
    >
      <div className="relative mb-5 flex items-center justify-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-5">
        {description}
      </p>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
