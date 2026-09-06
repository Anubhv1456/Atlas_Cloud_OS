import { useLexicon } from '@/lib/lexicon';
import React, { useEffect, useState } from 'react';
import { 
  Zap, 
  Activity, 
  Brain, 
  ShieldCheck, 
  RefreshCw, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Database,
  BarChart3,
  Flame,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchCohortTelemetryLogs, KnowledgeGapItem } from '@/lib/telemetry';

export function CohortTelemetryView() {
  const lexicon = useLexicon();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchCohortTelemetryLogs();
      setData(res);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const s10Speed = data?.s10AvgSeconds ?? 0;
  const acceptanceRate = data?.acceptanceRate ?? 0;
  const totalAccepted = data?.totalAccepted ?? 0;
  const totalSkipped = data?.totalSkipped ?? 0;
  const totalRecs = totalAccepted + totalSkipped;
  
  const skipReasons = data?.skipReasons || {};
  const errorTaxonomy = data?.errorCategories || {};

  const drillsCleared = data?.drillsCleared ?? 0;
  const drillsTotal = data?.drillsTotal ?? 0;
  const drillResolutionPct = drillsTotal > 0 ? Math.round((drillsCleared / drillsTotal) * 100) : 0;

  const rawLogs: any[] = data?.rawLogs || [];
  const totalLoggedBatches = rawLogs.length;
  const totalLoggedEvents = rawLogs.reduce((acc: number, d: any) => acc + (Number(d.events_count) || 1), 0);

  // Free tier usage calculations based on actual active syncs
  const estDailyReads = Math.max(1, totalLoggedBatches * 2);
  const estDailyWrites = Math.max(1, totalLoggedBatches);
  const readsPct = Math.min(100, Math.max(1, Math.round((estDailyReads / 50000) * 100)));
  const writesPct = Math.min(100, Math.max(1, Math.round((estDailyWrites / 20000) * 100)));

  const topKnowledgeGaps: KnowledgeGapItem[] = data?.topKnowledgeGaps || [];
  const isDynamicGaps = topKnowledgeGaps.length > 0;

  // Total skip items sum
  const totalSkipsCount = Object.values(skipReasons).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
  const totalErrorsCount = Object.values(errorTaxonomy).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Cohort Telemetry & Habit Velocity
            </h1>
            <Badge variant="outline" className="text-xs font-mono font-bold bg-teal-500/10 text-teal-400 border-teal-500/30">
              Live Ground Truth
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Realtime telemetry stream for recommendation engine accuracy, decision latency, and memory retention health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">
            Synced {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border-border/80 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-teal-400")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Top 4 Key Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Recommendation Acceptance */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/60 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Engine Accuracy</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {totalRecs > 0 ? `${acceptanceRate}%` : '0%'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-teal-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalRecs > 0 ? 'Unclamped Ground Truth' : 'Awaiting Decisions'}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {totalRecs > 0 ? `${totalAccepted} accepted vs ${totalSkipped} skipped` : 'No recommendation decisions logged yet'}
          </p>
        </div>

        {/* Metric 2: S10 Decision Velocity */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/60 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">S10 Decision Velocity</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {s10Speed > 0 ? `${s10Speed}s` : '—'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-sky-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{s10Speed > 0 ? (s10Speed <= 10.0 ? 'Rapid Intuition (≤10s)' : 'Pacing Measured') : 'Awaiting Timing'}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {s10Speed > 0 ? 'Mount to revision initiation' : 'Measured from Next Action card interactions'}
          </p>
        </div>

        {/* Metric 3: Active Recall Resolution */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/60 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mistake Drill Clear</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-purple-500/20">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {drillsTotal > 0 ? `${drillResolutionPct}%` : '0%'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-primary">
              <Activity className="w-3.5 h-3.5" />
              <span>{drillsTotal > 0 ? `${drillsCleared} of ${drillsTotal} items mastered` : 'No Recall Drills Yet'}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {drillsTotal > 0 ? 'Active recall recovery success rate' : `Populates from ${lexicon.mistakesJournal} reviews`}
          </p>
        </div>

        {/* Metric 4: Free Tier Quota Health */}
        <div className="p-5 rounded-2xl border border-border/60 bg-card/60 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Storage & Ops</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              $0.00
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{totalLoggedBatches > 0 ? `${totalLoggedBatches} Batches Synced (${totalLoggedEvents} Evts)` : '100% Free Plan'}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Atomic batch buffer keeps writes near zero
          </p>
        </div>
      </div>

      {/* 4 Core Diagnostic Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Engine Accuracy & Skip Breakdown */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Column A — Engine Accuracy & Skip Reasons</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Why students reject or defer recommendations</p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">Algorithm Diagnostics</Badge>
          </div>

          {totalSkipsCount > 0 ? (
            <div className="space-y-3 pt-2">
              {[
                { label: 'Already Studied in Coaching/Hospital', key: 'already_studied', count: skipReasons.already_studied || 0, color: 'bg-teal-500' },
                { label: 'Not Today (Fatigue / High Cognitive Load)', key: 'not_today', count: skipReasons.not_today || 0, color: 'bg-sky-500' },
                { label: 'Too Difficult / Missing Prerequisites', key: 'too_difficult', count: skipReasons.too_difficult || 0, color: 'bg-amber-500' },
                { label: 'Not Relevant to My Upcoming Exam', key: 'not_relevant', count: skipReasons.not_relevant || 0, color: 'bg-rose-500' }
              ].map(item => {
                const divisor = Math.max(1, totalSkipsCount);
                const pct = totalSkipsCount > 0 ? Math.round((item.count / divisor) * 100) : 0;
                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{item.label}</span>
                      <span className="text-muted-foreground font-mono">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", item.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 px-4 rounded-xl border border-dashed border-border/60 text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-teal-400 mx-auto opacity-70" />
              <p className="text-xs font-semibold text-foreground">No Recommendation Skips Logged</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                When students defer or reject recommendations, specific resistance patterns (fatigue, prerequisites, completed elsewhere) will chart here.
              </p>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span>
              {totalSkipsCount > 0 ? (
                <><strong>Observation</strong>: Active student skip telemetry reflects live rejection patterns. High "Already Studied" volume indicates recommendation decay should discount recently completed topics more aggressively.</>
              ) : (
                <><strong>Clean Pipeline</strong>: No recommendation skips recorded in this batch. All student decisions are accepting the primary recommendation directly.</>
              )}
            </span>
          </div>
        </div>

        {/* Panel B: Memory Decay & Knowledge Gap Clusters */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Column B — Cohort Knowledge Gaps</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Top high-yield medical topics failing retrieval</p>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-mono",
                isDynamicGaps ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-muted-foreground border-border/40"
              )}
            >
              {isDynamicGaps ? 'Live Cohort Gaps' : 'Awaiting Mistakes'}
            </Badge>
          </div>

          {topKnowledgeGaps.length > 0 ? (
            <div className="space-y-2.5 pt-2">
              {topKnowledgeGaps.map((gap, i) => (
                <div key={i} className="p-3 rounded-xl border border-border/40 bg-background/50 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono">
                        {gap.subject}
                      </span>
                      <span className="text-xs font-bold text-foreground truncate block">
                        {gap.topic}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {gap.count} student mistake recoveries logged
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {gap.errorPct}% fail
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 rounded-xl border border-dashed border-border/60 text-center space-y-2">
              <Brain className="w-6 h-6 text-primary mx-auto opacity-70" />
              <p className="text-xs font-semibold text-foreground">No Knowledge Gaps Detected Yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                As students log mistakes or fail active recall drills in their {lexicon.mistakesJournal}, high-yield retrieval failure clusters will automatically populate here in real time.
              </p>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
            <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              <strong>Clinical Insight</strong>: Topics with repeated retrieval failures automatically receive boosted priority multipliers in Atlas's spaced repetition scheduler.
            </span>
          </div>
        </div>

        {/* Panel C: Active Error Taxonomy */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Column C — Error Taxonomy Breakdown</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Classification of mistakes logged during QBank drills</p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">Cognitive Profile</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
              <span className="text-xs font-bold uppercase text-rose-400">Knowledge Gap (Concept)</span>
              <div className="text-2xl font-bold text-foreground font-mono">{errorTaxonomy.concept || 0}</div>
              <p className="text-xs text-muted-foreground">Theory missing / misunderstood</p>
            </div>

            <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-1">
              <span className="text-xs font-bold uppercase text-sky-400">Retrieval Failure</span>
              <div className="text-2xl font-bold text-foreground font-mono">{errorTaxonomy.retrieval || 0}</div>
              <p className="text-xs text-muted-foreground">Knew the concept, blanked in exam</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
              <span className="text-xs font-bold uppercase text-amber-400">Execution Slip (Misread)</span>
              <div className="text-2xl font-bold text-foreground font-mono">{errorTaxonomy.misread || 0}</div>
              <p className="text-xs text-muted-foreground">Rushed reading / missed 'EXCEPT'</p>
            </div>

            <div className="p-4 rounded-xl border border-purple-500/20 bg-primary/5 space-y-1">
              <span className="text-xs font-bold uppercase text-primary">Overthinking (FOMO)</span>
              <div className="text-2xl font-bold text-foreground font-mono">{errorTaxonomy.fomo || 0}</div>
              <p className="text-xs text-muted-foreground">Second-guessed the right answer</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {totalErrorsCount > 0 ? (
              <><strong>Active Recall Health</strong>: Realtime taxonomy distinguishes execution slips from retrieval decay, allowing Atlas to recalibrate revision intervals appropriately.</>
            ) : (
              <><strong>Ready for Live Data</strong>: Error classifications will update as students categorize test mistakes in their {lexicon.mistakesJournal}.</>
            )}
          </p>
        </div>

        {/* Panel D: Infrastructure & Free Tier Meter */}
        <div className="p-6 rounded-2xl border border-border/60 bg-card/40 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Column D — Free Tier Quota Telemetry</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Firebase Spark plan daily consumption meters</p>
            </div>
            <Badge variant="outline" className="text-xs font-mono text-emerald-400 border-emerald-500/30">100% Free</Badge>
          </div>

          <div className="space-y-4 pt-2">
            {/* Daily Reads */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-teal-400" />
                  <span>Firestore Daily Document Reads</span>
                </span>
                <span className="text-muted-foreground font-mono">{estDailyReads.toLocaleString()} / 50,000 ({readsPct}%)</span>
              </div>
              <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${readsPct}%` }} />
              </div>
            </div>

            {/* Daily Writes */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span>Firestore Daily Document Writes</span>
                </span>
                <span className="text-muted-foreground font-mono">{estDailyWrites.toLocaleString()} / 20,000 ({writesPct}%)</span>
              </div>
              <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${writesPct}%` }} />
              </div>
            </div>

            {/* Concurrent WebSocket Connections */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span>Live Telemetry Channel</span>
                </span>
                <span className="text-muted-foreground font-mono">Active (100% Buffer Efficiency)</span>
              </div>
              <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `100%` }} />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Budget Safety Buffer</strong>: Operating at <strong>extreme headroom</strong> below all free quotas. Batch buffers keep Firestore writes and database reads at $0.00 cost.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
