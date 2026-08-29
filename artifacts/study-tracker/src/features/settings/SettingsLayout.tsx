import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export function SettingsSection({
  title,
  footer,
  children,
  className
}: {
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {title && (
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-4 select-none">
          {title}
        </h2>
      )}
      <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-xs divide-y divide-border/30 backdrop-blur-xs">
        {children}
      </div>
      {footer && (
        <div className="text-[11px] text-muted-foreground/75 px-4 pt-1 select-none leading-relaxed">
          {footer}
        </div>
      )}
    </div>
  );
}

export function SettingsBlock({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <SettingsSection title={title}>
      {children}
    </SettingsSection>
  );
}

export interface InsetRowProps {
  icon?: any;
  iconBg?: string;
  iconColor?: string;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  value?: React.ReactNode;
  control?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SettingsRow({
  icon: Icon,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  label,
  sublabel,
  value,
  control,
  onClick,
  destructive = false,
  chevron = false,
  disabled = false,
  className
}: InsetRowProps) {
  const isClickable = !!onClick && !disabled;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={cn(
        "flex items-center justify-between px-4 py-3 bg-card transition-colors select-none text-left w-full",
        isClickable && "hover:bg-muted/35 active:bg-muted/60 cursor-pointer",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0 pr-3">
        {Icon && (
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-border/40 shadow-2xs",
              destructive ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : cn(iconBg, iconColor)
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="min-w-0 flex flex-col justify-center">
          <span
            className={cn(
              "text-[13px] font-medium leading-tight truncate",
              destructive ? "text-rose-500 font-semibold" : "text-foreground"
            )}
          >
            {label}
          </span>
          {sublabel && (
            <span className="text-[11px] text-muted-foreground truncate mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {value && (
          <span className="text-xs text-muted-foreground font-normal">
            {value}
          </span>
        )}
        {control}
        {(chevron || (isClickable && !control && value !== undefined)) && (
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
        )}
      </div>
    </div>
  );
}
