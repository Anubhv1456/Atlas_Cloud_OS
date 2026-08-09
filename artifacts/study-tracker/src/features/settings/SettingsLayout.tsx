import React from 'react';
import { cn } from '@/lib/utils';

export function SettingsBlock({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-2">{title}</h2>
      <div className="bg-card rounded-2xl border shadow-sm divide-y divide-border/40 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function SettingsRow({ 
  icon: Icon, 
  label, 
  value, 
  control, 
  onClick, 
  destructive 
}: { 
  icon: any, 
  label: React.ReactNode, 
  value?: React.ReactNode, 
  control?: React.ReactNode, 
  onClick?: () => void,
  destructive?: boolean
}) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 bg-card transition-colors group", 
        onClick && "hover:bg-muted/40 cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-4 h-4 transition-colors", destructive ? "text-destructive" : "text-muted-foreground group-hover:text-foreground")} />
        <span className={cn("text-sm font-medium", destructive ? "text-destructive" : "text-foreground")}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-sm text-muted-foreground">{value}</span>}
        {control}
      </div>
    </div>
  );
}
