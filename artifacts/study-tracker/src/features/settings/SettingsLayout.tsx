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
        <h2 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80 px-4 select-none">
          {title}
        </h2>
      )}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-xs dark:shadow-none backdrop-blur-xs">
        {children}
      </div>
      {footer && (
        <div className="text-[12px] text-muted-foreground/75 px-4 pt-1 select-none leading-relaxed">
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
  isLast?: boolean;
  className?: string;
}

export function SettingsRow({
  icon: Icon,
  iconBg = "bg-primary text-primary-foreground",
  iconColor,
  label,
  sublabel,
  value,
  control,
  onClick,
  destructive = false,
  chevron = false,
  disabled = false,
  isLast = false,
  className
}: InsetRowProps) {
  const isClickable = !!onClick && !disabled;

  return (
    <div className="relative group bg-card">
      <div
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={isClickable ? onClick : undefined}
        onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
        className={cn(
          "flex items-center justify-between px-4 py-3 bg-card transition-colors select-none text-left w-full min-h-[48px]",
          isClickable && "hover:bg-muted/40 active:bg-muted/70 cursor-pointer",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
      >
        <div className="flex items-center gap-3.5 min-w-0 pr-3">
          {Icon && (
            <div
              className={cn(
                "w-[30px] h-[30px] rounded-[7px] flex items-center justify-center shrink-0 shadow-2xs transition-transform group-active:scale-95",
                destructive 
                  ? "bg-rose-500 text-white" 
                  : cn(iconBg, iconColor || "text-white")
              )}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
          )}
          <div className="min-w-0 flex flex-col justify-center">
            <span
              className={cn(
                "text-[14px] font-normal leading-tight truncate tracking-tight",
                destructive ? "text-rose-500 font-medium" : "text-foreground font-normal"
              )}
            >
              {label}
            </span>
            {sublabel && (
              <span className="text-[12px] text-muted-foreground/80 truncate mt-0.5 tracking-tight font-normal">
                {sublabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {value && (
            <span className="text-[14px] text-muted-foreground font-normal tracking-tight">
              {value}
            </span>
          )}
          {control}
          {(chevron || (isClickable && !control && value !== undefined)) && (
            <ChevronRight className="w-4 h-4 text-muted-foreground/45 shrink-0" />
          )}
        </div>
      </div>

      {/* Apple-grade Inset Divider - anchored past icon space (indented 56px) */}
      {!isLast && (
        <div className="absolute bottom-0 right-0 left-[56px] h-[0.5px] bg-border/40 pointer-events-none" />
      )}
    </div>
  );
}
