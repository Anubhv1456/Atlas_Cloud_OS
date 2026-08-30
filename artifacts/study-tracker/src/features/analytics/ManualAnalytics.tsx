import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'wouter';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db, Subject, StudySystem } from '@/db';
import { setFocus } from '@/db';
import {
  sortSystemsByRevisionPriority,
  isRevisionDue,
  daysOverdue,
} from '@/db';
import { ScoreLogModal } from '@/features/analytics/ScoreLogModal';
import { ScoreAutopsyRow } from '@/features/analytics/ScoreAutopsyRow';
import { getLogTimestamp } from '@/features/analytics/analyticsUtils';
import { formatDistanceToNow } from 'date-fns';
import { toast as sonnerToast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import {
  BarChart3,
  TrendingUp,
  Award,
  Trophy,
  Plus,
  Trash2,
  Search,
  Filter,
  Calendar,
  Sparkles,
  Target,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { useAnalyticsLogic } from './Analytics.hooks';
import { Activity, Globe, Lightbulb } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { MistakesNotebookCard } from '@/features/mistakes/MistakesNotebookCard';

export default function ManualAnalytics() {

  const {
    scoreLogs, subjects, scoredSubjects, systems, densityLimit, setDensityLimit, searchQuery, setSearchQuery, chartData, displayLogs,
    isModalOpen, setIsModalOpen,
    filteredLogs,
    systemBreakdownData, handleDeleteLog, studyRecommendation,
    handleSetRecommendationAsPrimary, systemMap, subjectMap, getPercentageColorBadge,
    stats, selectedType, setSelectedType, selectedSubjectId, setSelectedSubjectId,
    selectedSystemId, setSelectedSystemId, availableSystems
  } = useAnalyticsLogic();
  
  const { flags } = useFeatureFlags();

  React.useEffect(() => {
    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener('open-score-log-modal', handleOpenModal);
    return () => window.removeEventListener('open-score-log-modal', handleOpenModal);
  }, [setIsModalOpen]);

  const activeSubjectName = useMemo(() => {
    if (selectedSubjectId === 'all') return null;
    if (selectedSubjectId === 'gt') return 'Grand Tests (Mocks)';
    const sub = subjectMap.get(selectedSubjectId as any) || subjectMap.get(Number(selectedSubjectId) as any);
    return sub?.name || 'Selected Subject';
  }, [selectedSubjectId, subjectMap]);
  
  return (
    <div className="min-h-full bg-background text-foreground px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-10 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Diagnostics Apex - Readiness Metric */}
      <div className="pt-2 pb-6 border-b border-border/40 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-[11px] font-bold">
            <Activity className="w-3.5 h-3.5 text-primary" />
            {activeSubjectName ? `${activeSubjectName} Retention Index` : 'Global Readiness Index'}
            {activeSubjectName && (
              <button
                onClick={() => setSelectedSubjectId('all')}
                className="text-[10px] lowercase font-normal px-2 py-0.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                (reset to all)
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-4 mt-1">
            <h1 className="text-7xl sm:text-8xl font-light tracking-tighter text-foreground">
              {stats.readinessIndex}<span className="text-4xl sm:text-5xl text-muted-foreground font-light">%</span>
            </h1>
            {stats.readinessTrend !== 0 && (
              <span className={`text-sm sm:text-base font-semibold ${stats.readinessTrend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.readinessTrend > 0 ? '↗' : '↘'} {Math.abs(stats.readinessTrend)}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2 max-w-md leading-relaxed">
            {activeSubjectName 
              ? `Real-time cognitive retention for ${activeSubjectName}, calculated from spaced test marks and memory decay.`
              : 'Your living medical memory diagnostic. Decays exponentially over time and strengthens when you log high-yield revisions.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeSubjectName && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSubjectId('all')}
              className="rounded-full text-xs font-semibold"
            >
              Show All Subjects
            </Button>
          )}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full px-6 font-semibold shadow-sm text-xs bg-foreground text-background hover:bg-foreground/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            {activeSubjectName ? `Log ${activeSubjectName} Score` : 'Log Score'}
          </Button>
        </div>
      </div>

      {/* Actionable Priority Recommendation Banner - Clinical Apex Alert */}
      {studyRecommendation && (
        <div className={`border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 transition-colors ${studyRecommendation.isCritical ? 'bg-rose-500/5 border-rose-500/20' : 'bg-primary/5 border-primary/20'}`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border flex items-center gap-1.5 bg-background text-foreground border-border/80 shadow-xs">
                <Sparkles className="w-3 h-3" /> Apex Directive
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border ${studyRecommendation.badgeColor}`}>
                {studyRecommendation.badge}
              </span>
            </div>
            <h3 className={`text-lg font-bold tracking-tight ${studyRecommendation.isCritical ? 'text-rose-600 dark:text-rose-500' : 'text-foreground'}`}>
              {studyRecommendation.title} <span className="text-xs font-normal opacity-60 uppercase tracking-widest ml-1">({studyRecommendation.subjectName})</span>
            </h3>
            <p className="text-sm text-muted-foreground/80 leading-relaxed font-medium max-w-xl">
              {studyRecommendation.reason}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0">
            <Link
              href={`/mistakes?subjectId=${encodeURIComponent(String(studyRecommendation.system.subjectId))}&systemId=${encodeURIComponent(String(studyRecommendation.system.id || ''))}&origin=analytics_apex`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/80 hover:border-primary/40 text-xs font-bold text-muted-foreground hover:text-foreground transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
              title={`Review 20th Notebook rules for ${studyRecommendation.subjectName}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>Review Mistakes</span>
            </Link>

            <Button
              size="lg"
              onClick={() => handleSetRecommendationAsPrimary(studyRecommendation.system)}
              className={`rounded-xl font-bold text-xs shadow-md transition-all ${studyRecommendation.isCritical ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-foreground text-background hover:bg-foreground/90'}`}
            >
              <Target className="w-4 h-4 mr-2" />
              Initiate Target Revision
            </Button>
          </div>
        </div>
      )}

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  The Forgetting Curve & Projection
                </h2>
                <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4 bg-primary/10 text-primary border-0">
                  {activeSubjectName ? `${activeSubjectName} Horizon` : 'Ebbinghaus Engine'}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">
                {activeSubjectName 
                  ? `Decay rate calibrated for ${activeSubjectName} memory stability.` 
                  : 'Select a subject to isolate its memory curve and filter the entire analytics dashboard.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                Clinical Threshold: 75%
              </Badge>
            </div>
          </div>

          {/* Interactive Subject Selector Pill Bar */}
          {scoredSubjects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 scrollbar-none">
              <button
                onClick={() => setSelectedSubjectId('all')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 cursor-pointer",
                  selectedSubjectId === 'all'
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/40"
                )}
              >
                All Curriculum ({scoredSubjects.length})
              </button>

              {scoredSubjects.map(sub => {
                const isSelected = String(selectedSubjectId) === String(sub.id);
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(isSelected ? 'all' : String(sub.id))}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 hover:bg-muted/70 text-muted-foreground hover:text-foreground border-border/40"
                    )}
                  >
                    <span>{sub.name}</span>
                    <span className={cn(
                      "text-[10px] font-mono font-normal px-1 py-0.2 rounded",
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {sub.avgScore}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {chartData.length === 0 ? (
            <EmptyStateGraphic
              icon={BarChart3}
              title="No Score Data for this Subject"
              description="Log a test or revision score for this subject to generate its personalized forgetting curve."
              action={
                <Button onClick={() => setIsModalOpen(true)} size="sm" className="text-xs gap-1.5 rounded-xl shadow-xs">
                  <Plus className="w-3.5 h-3.5" /> Log First Score
                </Button>
              }
              className="h-72 border-none bg-muted/20"
            />
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    {/* Apple Health Multi-Stop Dynamic Gradient */}
                    <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
                  
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-muted-foreground/70 font-medium"
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false}
                    ticks={[25, 50, 75, 100]}
                    tick={{ fontSize: 9, fill: 'currentColor' }}
                    className="text-muted-foreground/40 font-mono"
                    width={28}
                  />
                  
                  {/* Clinical 75% Mastery Safety Line */}
                  <ReferenceLine 
                    y={75} 
                    stroke="rgba(16, 185, 129, 0.4)" 
                    strokeDasharray="4 4" 
                    label={{ 
                      value: '75% Target', 
                      position: 'insideTopRight', 
                      fill: 'rgba(16, 185, 129, 0.7)', 
                      fontSize: 9,
                      fontWeight: 600
                    }} 
                  />
                  
                  <Tooltip
                    wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    allowEscapeViewBox={{ x: false, y: false }}
                    cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeOpacity: 0.15, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isForecast = data.isProjected;
                        return (
                          <div className="bg-background/95 backdrop-blur-xl border border-border/60 p-3.5 rounded-2xl shadow-xl text-xs space-y-2 max-w-[260px]">
                            <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                              <span className="font-bold text-foreground truncate">{data.title}</span>
                              {isForecast ? (
                                <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                  Forecast
                                </Badge>
                              ) : data.isRealPoint ? (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">
                                  {data.type}
                                </Badge>
                              ) : null}
                            </div>

                            <div className="flex items-baseline justify-between pt-0.5">
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                                  {isForecast ? 'Forecasted Retention' : 'Memory Retention'}
                                </span>
                                <span className={cn(
                                  "font-mono font-bold text-2xl tracking-tighter leading-none",
                                  data.percentage >= 75 ? "text-emerald-500" : data.percentage >= 60 ? "text-amber-500" : "text-rose-500"
                                )}>
                                  {data.percentage}%
                                </span>
                              </div>
                              {data.scoreStr && (
                                <span className="text-[11px] font-mono text-muted-foreground">
                                  Raw: {data.scoreStr}
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/30">
                              <span>{data.fullDate}</span>
                              {data.subjectName && <span className="font-medium text-foreground/80 truncate max-w-[120px]">{data.subjectName}</span>}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#scoreAreaGrad)"
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload.isRealPoint) {
                        return (
                          <circle
                            key={`dot-${payload.id}`}
                            cx={cx}
                            cy={cy}
                            r={4.5}
                            fill="hsl(var(--primary))"
                            stroke="var(--background)"
                            strokeWidth={2}
                            className="shadow-sm"
                          />
                        );
                      }
                      if (payload.isProjected) {
                        return (
                          <circle
                            key={`dot-${payload.id}`}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth={1.5}
                            strokeDasharray="2 2"
                          />
                        );
                      }
                      return <g key={`empty-${payload.id}`} />;
                    }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'var(--background)', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* The Vulnerability Matrix (Replaces Bar Chart) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <Target className="w-4 h-4 text-rose-500" />
              Vulnerability Matrix
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              Heatmap of your most at-risk systems. Larger, red blocks require immediate attention.
            </p>
          </div>

          {systemBreakdownData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-2xl p-6 text-center">
              <p className="text-xs text-muted-foreground font-medium">No system test data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 auto-rows-[100px] gap-3">
              {[...systemBreakdownData]
                .sort((a, b) => a.average - b.average) // Sort by lowest average first (most vulnerable)
                .map((sys, idx) => {
                  let spanClasses = "col-span-1 row-span-1";
                  if (idx === 0) spanClasses = "col-span-2 row-span-2"; // Apex vulnerability
                  else if (idx === 1) spanClasses = "col-span-2 row-span-1"; // Secondary vulnerability

                  let colorClasses = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                  let scoreColor = "text-emerald-600 dark:text-emerald-500";
                  
                  if (sys.average < 60) {
                    colorClasses = "bg-rose-500/15 text-rose-700 dark:text-rose-400";
                    scoreColor = "text-rose-600 dark:text-rose-500";
                  } else if (sys.average < 75) {
                    colorClasses = "bg-amber-500/15 text-amber-700 dark:text-amber-400";
                    scoreColor = "text-amber-600 dark:text-amber-500";
                  }

                  const mistakesUrl = sys.subjectId 
                    ? `/mistakes?subjectId=${encodeURIComponent(String(sys.subjectId))}${sys.systemId ? `&systemId=${encodeURIComponent(String(sys.systemId))}` : ''}&origin=vulnerability_matrix`
                    : null;

                  return (
                    <div 
                      key={sys.name} 
                      className={`group relative rounded-3xl p-4 flex flex-col justify-between transition-all duration-200 hover:scale-[1.02] border border-border/20 ${spanClasses} ${colorClasses}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-bold ${idx === 0 ? 'text-lg md:text-xl' : 'text-sm'} leading-tight tracking-tight text-foreground/90`}>
                          {sys.fullName}
                        </span>
                        {mistakesUrl && (
                          <Link
                            href={mistakesUrl}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-background/80 hover:bg-background text-foreground shadow-2xs cursor-pointer shrink-0"
                            title={`Open 20th Notebook rules for ${sys.fullName}`}
                          >
                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                          </Link>
                        )}
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                          {sys.count} Logs
                        </span>
                        <span className={`font-mono font-bold ${idx === 0 ? 'text-5xl' : 'text-2xl'} ${scoreColor} tracking-tighter leading-none`}>
                          {sys.average}<span className={`${idx === 0 ? 'text-2xl' : 'text-sm'} opacity-60 font-light`}>%</span>
                        </span>
                      </div>
                    </div>
                  );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Score History Table */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Score History Log
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              Detailed list of recorded test and revision scores
            </p>
          </div>
          <Badge variant="secondary" className="text-xs font-mono">
            {displayLogs.length} Records
          </Badge>
        </div>

        {displayLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No score records match your search filter.
          </div>
        ) : (
          <VirtualizedScoreTable
            displayLogs={[...displayLogs].reverse()}
            subjectMap={subjectMap}
            handleDeleteLog={handleDeleteLog}
            getPercentageColorBadge={getPercentageColorBadge}
          />
        )}
      </div>

      {/* Score Log Modal */}
      <ScoreLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSubjectId={selectedSubjectId !== 'all' ? Number(selectedSubjectId) : undefined}
      />
    </div>
  );
}

function VirtualizedScoreTable({
  displayLogs,
  subjectMap,
  handleDeleteLog,
  getPercentageColorBadge,
}: {
  displayLogs: any[];
  subjectMap: Map<number, any>;
  handleDeleteLog: (id: number) => void;
  getPercentageColorBadge: (pct: number) => string;
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: displayLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Slightly taller for feed items
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="max-h-[550px] overflow-auto pr-2 -mr-2">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const log = displayLogs[virtualRow.index];
          const subName = subjectMap.get(log.subjectId)?.name;

          return (
            <div
              key={log.id ?? virtualRow.index}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ScoreAutopsyRow
                log={log}
                subName={subName}
                onDelete={handleDeleteLog}
                getPercentageColorBadge={getPercentageColorBadge}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
