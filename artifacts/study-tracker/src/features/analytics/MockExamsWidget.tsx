import React, { useState } from 'react';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { db } from '@/db';
import { ScoreLog } from '@/db/types';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis, CartesianGrid } from 'recharts';
import { Target, Plus, ChevronRight, X, Calendar, Award, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function MockExamsWidget() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const gtScores = useLiveQuery(async () => {
    const arr = await db.scoreLogs.where('type').equals('gt').toArray();
    return arr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const chartData = (gtScores || []).slice().reverse().map(log => ({
    name: log.testName || 'Mock Exam',
    score: log.score,
    total: log.total,
    percentage: log.percentage,
    date: format(new Date(log.timestamp), 'MMM d, yyyy')
  }));

  const latestScore = gtScores && gtScores.length > 0 ? gtScores[0] : null;

  return (
    <>
      {/* Sleek Analytics Card */}
      <div 
        onClick={() => setIsOverlayOpen(true)}
        className="group relative bg-card border border-border/60 hover:border-primary/50 shadow-sm rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[140px]"
      >
        <div className="flex items-start justify-between relative z-10 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mock Exams (GT/NBME)</h3>
            </div>
            {latestScore ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">{latestScore.percentage}%</span>
                <span className="text-sm font-semibold text-muted-foreground">latest</span>
              </div>
            ) : (
              <div className="text-xl font-semibold text-muted-foreground mt-1">No exams logged</div>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Mini Sparkline Background */}
        {chartData.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPercentageSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" className="text-primary" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="currentColor" className="text-primary" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                <Area type="monotone" dataKey="percentage" stroke="currentColor" className="text-primary" strokeWidth={2} fillOpacity={1} fill="url(#colorPercentageSpark)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Full Screen Overlay */}
      {isOverlayOpen && (
        <MockExamsOverlay 
          isOpen={isOverlayOpen} 
          onClose={() => setIsOverlayOpen(false)} 
          gtScores={gtScores || []}
          chartData={chartData}
        />
      )}
    </>
  );
}

function MockExamsOverlay({ isOpen, onClose, gtScores, chartData }: { isOpen: boolean, onClose: () => void, gtScores: ScoreLog[], chartData: any[] }) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
              <Target className="w-3.5 h-3.5" /> Macro Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Mock Exam Dashboard</h1>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border/60 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Score Trend</h3>
                <Button onClick={() => setShowAddModal(true)} size="sm" className="gap-1.5 rounded-xl">
                  <Plus className="w-4 h-4" /> Log Exam
                </Button>
              </div>

              {chartData.length > 0 ? (
                <div className="h-[250px] sm:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="currentColor" className="text-primary" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="currentColor" className="text-primary" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                        itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="percentage" stroke="currentColor" className="text-primary" strokeWidth={3} fillOpacity={1} fill="url(#colorPercentage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                  <BarChart3 className="w-10 h-10 mb-3 opacity-20" />
                  <p className="font-medium text-sm">No mock exams logged yet.</p>
                  <p className="text-xs opacity-70 mt-1">Log your first Grand Test to see your trend line.</p>
                </div>
              )}
            </div>
          </div>

          {/* History List */}
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm flex flex-col max-h-[500px]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 shrink-0">Exam History</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-border/50">
              {gtScores.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No records found.
                </div>
              ) : (
                gtScores.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-foreground text-sm truncate pr-2">{log.testName || 'Mock Exam'}</div>
                      <div className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-bold font-mono shrink-0",
                        log.percentage >= 70 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                        log.percentage >= 50 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                        "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      )}>
                        {log.percentage}%
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mb-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(log.timestamp), 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {log.score}/{log.total}</span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 italic border-l-2 border-border/50 pl-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <LogExamModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}

function LogExamModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [testName, setTestName] = useState('');
  const [score, setScore] = useState('');
  const [total, setTotal] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName || !score || !total || !date) return;
    
    const s = parseFloat(score);
    const t = parseFloat(total);
    if (isNaN(s) || isNaN(t) || t <= 0) return;

    try {
      await db.scoreLogs.add({
        title: testName,
        testName: testName,
        score: s,
        total: t,
        percentage: Math.round((s / t) * 100),
        type: 'gt',
        timestamp: new Date(date).toISOString(),
        notes: notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('Exam logged successfully');
      setTestName('');
      setScore('');
      setTotal('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to log exam');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Log Mock Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Exam Name</Label>
            <Input 
              placeholder="e.g., NBME 25, Grand Test 4" 
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Score</Label>
              <Input 
                type="number" 
                placeholder="e.g., 185" 
                value={score}
                onChange={(e) => setScore(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <Input 
                type="number" 
                placeholder="e.g., 200" 
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea 
              placeholder="Felt rushed on block 3. Need to review ethics." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl resize-none h-20"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
            <Button type="submit" className="rounded-xl">Save Exam</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
