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
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import { useAnalyticsLogic } from './Analytics.hooks';
import { Activity, Globe, Lightbulb } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { MistakesNotebookCard } from '@/features/mistakes/MistakesNotebookCard';

export default function Analytics() {

  const {
    scoreLogs, subjects, systems, densityLimit, setDensityLimit, searchQuery, setSearchQuery, chartData, displayLogs,
    isModalOpen, setIsModalOpen,
    filteredLogs,
    systemBreakdownData, handleDeleteLog, studyRecommendation,
    handleSetRecommendationAsPrimary, systemMap, subjectMap, getPercentageColorBadge,
    stats, selectedType, setSelectedType, selectedSubjectId, setSelectedSubjectId,
    selectedSystemId, setSelectedSystemId, availableSystems
  } = useAnalyticsLogic();
  
    const { flags } = useFeatureFlags();
  
  return (
    <div className="min-h-full bg-background text-foreground px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-10 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Diagnostics Apex - Readiness Metric */}
      <div className="pt-2 pb-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-[11px] font-bold">
            <Activity className="w-3.5 h-3.5" />
            Global Readiness Index
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
          <p className="text-xs text-muted-foreground mt-3 max-w-md leading-relaxed">
            Your living memory diagnostic. This index decays automatically over time and strengthens when you log high-yield revisions.
          </p>
        </div>
        
        <div className="mt-8">
           <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full px-6 font-semibold shadow-sm text-xs bg-foreground text-background hover:bg-foreground/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            Log Score
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                The Forgetting Curve
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                Showing {chartData.length} entries ({densityLimit === 'all' ? 'All entries' : `Last ${densityLimit}`})
              </p>
            </div>

            <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary w-fit">
              Clinical Threshold: 75%
            </Badge>
          </div>

          {chartData.length === 0 ? (
            <EmptyStateGraphic
              icon={BarChart3}
              title="Unlock study Report"
              description="Log your revision results or PYQ test marks to unlock beautiful retention graphs and progress curves."
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
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/20" />
                  
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-muted-foreground/60"
                  />
                  <YAxis hide domain={[0, 100]} />
                  
                  <Tooltip
                    wrapperStyle={{ outline: 'none', zIndex: 50 }}
                    allowEscapeViewBox={{ x: false, y: false }}
                    cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeOpacity: 0.1, strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background/95 backdrop-blur-xl border border-border/40 p-3 rounded-2xl shadow-xl text-xs space-y-1.5 max-w-[240px]">
                            <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                              <span className="font-bold text-foreground truncate">{data.title}</span>
                            </div>
                            <div className="flex flex-col gap-1 pt-1">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Retention</span>
                              <span className="font-mono font-bold text-2xl tracking-tighter text-primary leading-none">
                                {data.percentage}%
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between">
                               <span>{data.fullDate}</span>
                               <span className="opacity-70">{data.type}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  <Area
                    type="monotoneX"
                    dataKey="percentage"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#scoreAreaGrad)"
                    dot={false}
                    activeDot={{ r: 6, fill: '#3b82f6', stroke: 'var(--background)', strokeWidth: 3 }}
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

      {/* 20th Notebook (Mistakes & Clinical Traps Hub) */}
      <MistakesNotebookCard />

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
    <div ref={parentRef} className="max-h-[500px] overflow-auto pr-2 -mr-2">
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
          
          let logColor = "bg-purple-500";
          if (log.type === 'gt') logColor = "bg-primary";
          else if (log.type === 'revision') logColor = "bg-blue-500";
          else if (log.type === 'set') logColor = "bg-amber-500";

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
              className="group flex items-center justify-between py-3 border-b border-border/30 hover:bg-muted/10 transition-colors pr-2"
            >
              <div className="flex items-start gap-4 overflow-hidden">
                <div className="pt-1.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${logColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm text-foreground truncate">{log.title}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 shrink-0">
                      {log.type === 'gt' ? 'GT' : log.type === 'pyq' ? 'PYQ' : log.type === 'set' ? 'SET' : 'REV'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 truncate">
                    <span className="font-medium">{formatDistanceToNow(getLogTimestamp(log), { addSuffix: true })}</span>
                    {subName && (
                      <>
                        <span className="opacity-30">•</span>
                        <span className="truncate">{subName}</span>
                      </>
                    )}
                    {log.notes && (
                       <>
                        <span className="opacity-30">•</span>
                        <span className="truncate italic opacity-75">{log.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0 pl-4">
                <div className="flex flex-col items-end">
                   <span className={`font-mono font-bold text-lg leading-none ${
                      log.percentage >= 75 ? 'text-emerald-500' : 
                      log.percentage < 60 ? 'text-rose-500' : 'text-amber-500'
                   }`}>
                     {log.percentage}%
                   </span>
                   <span className="text-[10px] text-muted-foreground font-mono mt-1">
                     {log.score}/{log.total}
                   </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => log.id && handleDeleteLog(log.id)}
                  className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all focus:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
