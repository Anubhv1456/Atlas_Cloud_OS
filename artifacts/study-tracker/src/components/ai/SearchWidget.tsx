import React from 'react';
import { Mic, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchWidgetProps {
  onOpenChat?: (mode: 'text' | 'voice') => void;
  className?: string;
}

export function SearchWidget({ onOpenChat, className }: SearchWidgetProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenChat?.('text')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenChat?.('text');
        }
      }}
      className={cn(
        "group flex items-center justify-between w-full h-14 px-5 rounded-full transition-all duration-300 cursor-pointer shadow-sm border border-border/80 bg-card/90 backdrop-blur-xl hover:shadow-md hover:border-primary/50",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm text-muted-foreground group-hover:text-foreground font-medium transition-colors">
          Search with Atlas
        </span>
      </div>
      <div className="h-6 w-px bg-border/80 mx-3" />
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onOpenChat?.('voice');
        }}
        className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer active:scale-95"
      >
        <Mic className="w-5 h-5" />
      </button>
    </div>
  );
}
