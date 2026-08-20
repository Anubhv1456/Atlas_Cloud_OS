import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  TimelineEvent,
  TIMELINE_FILTERS,
} from '@/db';
import {
  format,
  isSameDay,
  startOfMonth,
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, BookOpen, Layers, CalendarDays, Clock, 
  AlertCircle, CheckCircle2, Sparkles, Filter, RotateCcw, TriangleAlert, 
  Zap, ArrowRight, History, X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useTimelineLogic } from './Timeline.hooks';

// ── Visual config ─────────────────────────────────────────────────────────────
const EVENT_STYLE: Record<TimelineEvent['eventType'], { bg: string; text: string; Icon: typeof BookOpen }> = {
  contentCompleted: { bg: 'bg-teal-500/10 border-teal-500/20',     text: 'text-teal-500',         Icon: BookOpen },
  qbankDone:        { bg: 'bg-violet-500/10 border-violet-500/20',   text: 'text-violet-500',       Icon: Layers   },
  pyqsDone:         { bg: 'bg-amber-500/10 border-amber-500/20',     text: 'text-amber-500',        Icon: BookOpen },
  revisionSystem:   { bg: 'bg-primary/10 border-primary/20',          text: 'text-primary',          Icon: Clock    },
  revisionSubject:  { bg: 'bg-primary/10 border-primary/20',          text: 'text-primary',          Icon: Clock    },
  topicMastered:    { bg: 'bg-emerald-500/10 border-emerald-500/20',  text: 'text-emerald-500',      Icon: CheckCircle2 },
  topicWeak:        { bg: 'bg-rose-500/10 border-rose-500/20',        text: 'text-rose-500',         Icon: TriangleAlert },
};

// ── Action Queue Card (For Overdue & Due Today Items) ─────────────────────────
function ActionableCard({ 
  event, 
  onInitiate 
}: { 
  event: TimelineEvent; 
  onInitiate: (subjectId?: number, systemId?: number) => void;
}) {
  const days = event.meta?.daysOverdue as number | undefined;
  const isDueToday = event.meta?.isDueToday as boolean | undefined;
  const subjectId = event.meta?.subjectId as number | undefined;
  const systemId = event.meta?.systemId as number | undefined;

  const isOverdue = event.status === 'overdue';

  return (
    <div className={cn(
      "group bg-card border rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all duration-200 shadow-sm",
      isOverdue ? "border-rose-500/30 hover:border-rose-500/60 bg-rose-500/[0.02]" : "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/[0.02]"
    )}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
          isOverdue ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
        )}>
          {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground truncate">{event.entityName}</p>
            {isOverdue && days !== undefined && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 shrink-0">
                {days}d overdue
              </span>
            )}
            {isDueToday && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 shrink-0">
                Due Today
              </span>
            )}
          </div>
          {event.subjectName && (
            <span className="text-[11px] font-medium text-muted-foreground mt-0.5 block truncate">
              {event.subjectName}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onInitiate(subjectId, systemId)}
        className={cn(
          "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs",
          isOverdue 
            ? "bg-rose-500 text-white hover:bg-rose-600" 
            : "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
        )}
      >
        <span>Initiate</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Standard Event Card (History & Upcoming) ──────────────────────────────────
function EventCard({ event, onRollback }: { event: TimelineEvent; onRollback?: (id: number) => void }) {
  const style = EVENT_STYLE[event.eventType];
  const { Icon } = style;
  return (
    <div className="group bg-card border border-border/70 rounded-2xl p-3 flex items-center gap-3 shadow-xs hover:border-border transition-all duration-200">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border', style.bg)}>
        <Icon className={cn('w-3.5 h-3.5', style.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{event.entityName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {event.subjectName && (
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              {event.subjectName}
            </span>
          )}
          {event.status === 'upcoming' && (
            <span className="text-[10px] font-mono font-medium text-muted-foreground/80 shrink-0">
              Scheduled {format(event.date, 'MMM d')}
            </span>
          )}
        </div>
      </div>

      {event.status === 'completed' && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground">{format(event.date, 'HH:mm')}</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          {event.dbHistoryId && onRollback && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRollback(event.dbHistoryId!);
              }}
              className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              title="Rollback event & revert status"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Past-day Group for Virtualized Feed ───────────────────────────────────────
function PastDayGroup({ date, events, onRollback }: { date: Date; events: TimelineEvent[]; onRollback?: (id: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">{format(date, 'EEEE, MMMM d')}</span>
          <Badge variant="secondary" className="text-[9px] font-mono font-bold px-1.5 py-0 bg-muted text-muted-foreground">
            {events.length} task{events.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
      <div className="space-y-1.5">
        {events.map(e => <EventCard key={e.id} event={e} onRollback={onRollback} />)}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════

export default function Timeline() {
  const {
    calDate, setCalDate,
    selectedDate, setSelectedDate,
    filter, setFilter,
    pendingRollbackId, setPendingRollbackId,
    goToSystem, confirmRollback, handleRollbackRequest,
    now, startDow, blanks,
    activityByDay, upcomingRevisionDates, days,
    actionableQueue, filteredUpcoming, pastGrouped, everythingEmpty
  } = useTimelineLogic();

  return (
    <div className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-10 max-w-5xl mx-auto flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">

      <div className="relative z-10 flex-1 flex flex-col space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold uppercase tracking-wider mb-0.5">
              <CalendarDays className="w-3.5 h-3.5" /> Spaced Repetition Schedule
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Schedule</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Active recall history, scheduled revisions, and calendar agenda.
            </p>
          </div>
        </header>

        {/* ── Integrated Calendar Radar & Filters ────────────────────────────── */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-4">
          
          {/* Top Bar: Navigation + Category Filter Strip */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div className="flex items-center justify-between md:justify-start gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  {format(calDate, 'MMMM yyyy')}
                </h2>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors border border-border/50 bg-background shadow-xs cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setCalDate(new Date());
                    setSelectedDate(null);
                  }}
                  className="px-2 py-1 text-[11px] font-semibold rounded-lg hover:bg-muted text-muted-foreground transition-colors border border-border/50 bg-background shadow-xs cursor-pointer"
                >
                  Today
                </button>
                <button 
                  type="button"
                  onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  disabled={calDate >= new Date(now.getFullYear() + 1, now.getMonth(), 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors border border-border/50 bg-background shadow-xs disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inline Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {TIMELINE_FILTERS.map((f) => {
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 border shrink-0 cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.key === 'all' && <Filter className="w-3 h-3" />}
                    {f.key === 'content' && <BookOpen className="w-3 h-3" />}
                    {f.key === 'qbank' && <Layers className="w-3 h-3" />}
                    {f.key === 'pyqs' && <CheckCircle2 className="w-3 h-3" />}
                    {f.key === 'revision' && <Clock className="w-3 h-3" />}
                    <span>{f.label}</span>
                  </button>
                );
              })}

              {/* Clear Date Filter Chip */}
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{format(selectedDate, 'MMM d')}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Dual-Signal Heatmap Calendar Grid */}
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                <div key={d} className="text-center text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70 py-0.5">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {blanks.map((_, i) => <div key={`b-${i}`} />)}
              {days.map(day => {
                const key          = format(day, 'yyyy-MM-dd');
                const isTdy        = isSameDay(day, now);
                const isSelected   = selectedDate && isSameDay(day, selectedDate);
                const count        = activityByDay.get(key) || 0;
                const hasUpcoming  = upcomingRevisionDates.has(key);
                const isFuture     = day > now && !isSameDay(day, now);

                let bgClass = 'bg-muted/20 text-foreground hover:bg-muted/60'; 
                if (count === 1) bgClass = 'bg-primary/20 text-foreground hover:bg-primary/30';
                if (count === 2) bgClass = 'bg-primary/40 text-foreground hover:bg-primary/50';
                if (count >= 3)  bgClass = 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90';

                if (count === 0 && isTdy) { 
                   bgClass = 'bg-primary/10 text-primary font-bold ring-1 ring-primary ring-inset';
                } else if (isTdy) { 
                   bgClass += ' ring-2 ring-primary ring-offset-2 ring-offset-card';
                }
                
                if (isSelected) { 
                   bgClass += ' ring-2 ring-ring ring-offset-1 ring-offset-background font-bold scale-105 z-10';
                }

                if (isFuture) { 
                   bgClass = 'bg-transparent text-muted-foreground/50 hover:bg-muted/30';
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(prev => prev && isSameDay(prev, day) ? null : day)}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] transition-all cursor-pointer relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      bgClass
                    )}
                    title={`${format(day, 'MMM d, yyyy')}: ${count} completed task${count !== 1 ? 's' : ''}${hasUpcoming ? ' • Revision Scheduled' : ''}`}
                  >
                    <span>{day.getDate()}</span>
                    {hasUpcoming && (
                      <span className="w-1 h-1 rounded-full bg-amber-500 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Radar Legend */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-3 border-t border-border/30 mt-3 px-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-primary/20 border border-primary/30" />
                  <span>Activity Logged</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Revision Scheduled</span>
                </span>
              </div>
              <div className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                Dual-Signal Radar
              </div>
            </div>
          </div>
        </div>

        {/* ── Actionable Revision Queue (Top Priority) ───────────────────────── */}
        {actionableQueue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Actionable Revision Queue
                </h2>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5 font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {actionableQueue.length} Due
              </Badge>
            </div>

            <div className="space-y-2">
              {actionableQueue.map(e => (
                <ActionableCard key={e.id} event={e} onInitiate={goToSystem} />
              ))}
            </div>
          </div>
        )}

        {/* ── Upcoming Revisions Horizon ────────────────────────────────────── */}
        {filteredUpcoming.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Upcoming Spaced Revisions Horizon
                </h2>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5 font-bold">
                {filteredUpcoming.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {filteredUpcoming.map(e => (
                <EventCard key={e.id} event={e} onRollback={handleRollbackRequest} />
              ))}
            </div>
          </div>
        )}

        {/* ── Completed Activity Ledger (History Feed) ───────────────────────── */}
        {pastGrouped.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <History className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Completed Activity Ledger
                </h2>
              </div>
            </div>

            <VirtualizedPastActivity pastGrouped={pastGrouped} onRollback={handleRollbackRequest} />
          </div>
        )}

        {everythingEmpty && (
          <EmptyStateGraphic
            icon={CalendarDays}
            title="No Activity Logged"
            description={filter !== 'all'
                ? `No ${TIMELINE_FILTERS.find(f => f.key === filter)!.label} events recorded in ${format(calDate, 'MMMM yyyy')}.`
                : `Start logging your study tasks, completing revisions, or solving PYQs to populate your activity radar for ${format(calDate, 'MMMM yyyy')}.`}
          />
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={pendingRollbackId !== null} onOpenChange={(open) => { if (!open) setPendingRollbackId(null); }}>
        <AlertDialogContent className="rounded-2xl sm:max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-lg font-bold">
              <RotateCcw className="w-5 h-5" /> Confirm Event Rollback
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              Are you sure you want to rollback this completed event? This will revert the completion status and update your study timeline accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRollback}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl text-xs"
            >
              Rollback Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function VirtualizedPastActivity({
  pastGrouped,
  onRollback,
}: {
  pastGrouped: { date: Date; events: TimelineEvent[] }[];
  onRollback: (id: number) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: pastGrouped.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="max-h-[500px] overflow-y-auto pr-1 rounded-2xl border border-border/40 p-3 bg-card/40 space-y-2"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const { date, events } = pastGrouped[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="pb-3"
            >
              <PastDayGroup date={date} events={events} onRollback={onRollback} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
