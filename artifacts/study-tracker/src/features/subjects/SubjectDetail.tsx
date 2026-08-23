import { ProgressBar } from '@/components/ProgressBar';
import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useLocation, useSearch } from 'wouter';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  useSubject, useSystemsBySubject, usePYQsBySubject, useScoreLogsBySubject,
  addSystem, updateSubject, deleteSubject, updateSystemsOrder,
  addPYQYear, addPYQYearBatch, updatePYQYear, deletePYQYear, togglePYQYear,
} from '@/db';
import { loadUniversalOntology } from '@/lib/exam-presets';
import { SystemCard } from '@/features/subjects/SystemCard';
import { EmptyStateGraphic } from '@/components/EmptyStateGraphic';
import { AddDialog } from '@/components/AddDialog';
import { PYQYear } from '@/db';
import { ScoreLogModal } from '@/features/analytics/ScoreLogModal';
import { SubjectFrictionCapsule } from '@/components/ai';
import {
  ChevronLeft, ChevronDown, ChevronRight, Plus, Trash2, Edit2,
  LayoutList, Lock, Check, BookOpen, Award, LayoutGrid, Sparkles,
  RefreshCw, Calendar, CheckCircle2, Circle, MoreVertical, Search,
  Brain
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudySystem } from '@/db';
import { cn } from '@/lib/utils';
import { calculateSubjectProgress } from '@/lib/progress';
import { usePYQSectionLogic, useSubjectDetailLogic } from './SubjectDetail.hooks';
import { validateNumberOfYears, validateYearInput } from '@/lib/validation';



// ── PYQ section component ──────────────────────────────────────────────────────

interface PYQSectionProps {
  subjectId:   number;
  subjectName: string;
  years:       PYQYear[];
}

function PYQSection({ subjectId, subjectName, years }: PYQSectionProps) {
  const {
    expanded, setExpanded,
    viewMode, setViewMode,
    showAdd, setShowAdd,
    addValue, setAddValue,
    editTarget, setEditTarget,
    editValue, setEditValue,
    pyqToDelete, setPyqToDelete,
    showPYQDeleteConfirm, setShowPYQDeleteConfirm,
    scoreModalPyq, setScoreModalPyq,
    showPresetModal, setShowPresetModal,
    currentYearNum,
    presetEndYear, setPresetEndYear,
    presetSpan, setPresetSpan,
    presetPrefix, setPresetPrefix,
    yearScoreMap,
    completed, total, percentage,
    handleAdd, handleQuickAdd5YearDefaults,
    spanValidation, endYearValidation, handleGenerateCustomRange,
    handleEditSave, handlePYQDeleteClick, handlePYQDeleteConfirm,
    handleToggle, handleMarkAllComplete
  } = usePYQSectionLogic(subjectId, subjectName, years);

  const handleResetAll = async () => {
    for (const y of years) {
      if (y.completed && y.id) {
        await togglePYQYear(y.id, subjectId, subjectName, y.year, true);
      }
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 bg-muted/20">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-3 text-left focus:outline-none group flex-1 min-w-0 cursor-pointer"
        >
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground/70 shrink-0 group-hover:text-foreground transition-colors" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground/70 shrink-0 group-hover:text-foreground transition-colors" />}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-sm tracking-tight truncate">
                  Exam Practice (PYQ)
                </h3>
                {total > 0 && (
                  <span className={cn(
                    "text-[10px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-full border shrink-0",
                    completed === total
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border/60"
                  )}>
                    {percentage}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {total === 0
                  ? 'No PYQ years configured yet'
                  : `${completed} / ${total} Years Solved`}
              </p>
            </div>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Grid vs List View Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-muted/60 border border-border/60">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-all",
                viewMode === 'grid'
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="5-Year Tile Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-all",
                viewMode === 'list'
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Compact List View"
              aria-label="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Generator Quick Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPresetModal(true)}
            className="h-8 text-xs font-semibold rounded-xl gap-1.5 border-border/60 px-2.5 hidden sm:inline-flex"
            title="Configure PYQ Years / 5-Year Presets"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Grid Presets</span>
          </Button>

          {/* Options Dropdown */}
          
        </div>
      </div>

      {/* Progress Bar Header */}
      {total > 0 && expanded && (
        <div className="px-4 pt-3 pb-1 border-b border-border/30 bg-muted/10">
          <ProgressBar progress={percentage} className="h-1.5" />
        </div>
      )}

      {/* Expanded Section Content */}
      <div className={cn(
        'grid transition-all duration-300 ease-in-out',
        expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}>
        <div className="overflow-hidden">
          <div className="p-4 space-y-4">

            {/* Empty State with 1-click Preset Seed */}
            {years.length === 0 ? (
              <EmptyStateGraphic
                icon={BookOpen}
                title="No PYQ Years Configured"
                description={`Generate the standard 5-year PYQ grid (e.g. ${currentYearNum-4} to ${currentYearNum}) or add custom years for NEET PG / INI-CET preparation.`}
                className="py-6 bg-muted/20 border-border/80"
                action={
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={handleQuickAdd5YearDefaults}
                      className="rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white gap-1.5 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Last 5 Years ({currentYearNum-4}–{currentYearNum})</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAdd(true)}
                      className="rounded-xl text-xs font-semibold border-border/80"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Single Year</span>
                    </Button>
                  </div>
                }
              />
            ) : viewMode === 'grid' ? (
              /* ── GRID VIEW (Responsive 5-Year Tile Grid) ──────────────── */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {years.map(year => {
                  const scoreLog = yearScoreMap.get(year.id!);
                  return (
                    <div
                      key={year.id}
                      className={cn(
                        "group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-200 select-none",
                        year.completed
                          ? "bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/15 text-foreground shadow-2xs"
                          : "bg-card border-border/70 hover:border-primary/40 hover:bg-muted/40 shadow-2xs"
                      )}
                    >
                      {/* Top Bar: Year Name & Checkbox */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <span className={cn(
                            "font-mono tabular-nums font-extrabold text-base sm:text-lg block tracking-tight leading-tight truncate",
                            year.completed ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"
                          )}>
                            {year.year}
                          </span>
                        </div>

                        {/* Completion Toggle Badge */}
                        <button
                          onClick={() => handleToggle(year)}
                          className={cn(
                            "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 focus:outline-none",
                            year.completed
                              ? "bg-emerald-500 border-emerald-500 text-white shadow-2xs scale-105"
                              : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5 text-transparent"
                          )}
                          title={year.completed ? "Mark pending" : "Mark solved"}
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>

                      {/* Middle: Score Badge or Log Trigger */}
                      <div className="my-3">
                        {scoreLog ? (
                          <button
                            onClick={() => setScoreModalPyq(year)}
                            className={cn(
                              "w-full text-left p-1.5 px-2 rounded-xl border text-xs font-mono tabular-nums transition-all flex items-center justify-between gap-1.5",
                              scoreLog.percentage >= 75
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                                : scoreLog.percentage >= 50
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/25"
                            )}
                            title="Click to view/update resonance"
                          >
                            <span className="font-bold">{scoreLog.percentage}%</span>
                            <span className="text-[10px] opacity-80">{scoreLog.score}/{scoreLog.total}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setScoreModalPyq(year)}
                            className="w-full text-left py-1 px-2 rounded-lg border border-dashed border-border/70 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-between"
                          >
                            <span>No score</span>
                            <Plus className="w-3 h-3 opacity-60" />
                          </button>
                        )}
                      </div>

                      {/* Bottom Footer: Quick Tile Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-muted-foreground">
                        <button
                          onClick={() => setScoreModalPyq(year)}
                          className="p-1 rounded-lg hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Log Test Score"
                        >
                          <Award className="w-3.5 h-3.5 text-primary" />
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditTarget(year); setEditValue(year.year); }}
                            className="p-1 rounded-lg hover:text-foreground hover:bg-muted transition-colors"
                            title="Rename Year"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePYQDeleteClick(year)}
                            className="p-1 rounded-lg hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete Year"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── LIST VIEW (Detailed Linear Rows) ─────────────────────── */
              <div className="space-y-1.5">
                {years.map(year => {
                  const scoreLog = yearScoreMap.get(year.id!);
                  return (
                    <div
                      key={year.id}
                      className={cn(
                        "flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all",
                        year.completed ? "bg-emerald-500/5 border-emerald-500/30" : "bg-card border-border/60 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleToggle(year)}
                          className={cn(
                            'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150',
                            year.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-muted-foreground/30 hover:border-primary',
                          )}
                        >
                          {year.completed && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <span className={cn(
                          'font-mono tabular-nums text-sm font-semibold truncate',
                          year.completed ? 'line-through text-muted-foreground' : 'text-foreground',
                        )}>
                          {year.year}
                        </span>

                        {scoreLog && (
                          <span className={cn(
                            "text-[11px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-md border shrink-0",
                            scoreLog.percentage >= 75
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          )}>
                            {scoreLog.percentage}% ({scoreLog.score}/{scoreLog.total})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setScoreModalPyq(year)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          title="Log PYQ Score"
                        >
                          <Award className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditTarget(year); setEditValue(year.year); }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit Year"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePYQDeleteClick(year)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="Delete Year"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Add Inline Control */}
            {years.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                {showAdd ? (
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={addValue}
                      onChange={e => setAddValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAdd(false); setAddValue(''); } }}
                      placeholder="e.g. 2024 or 2024 INI-CET"
                      className="flex-1 h-9 text-xs font-mono bg-muted/50 border-border/60 focus-visible:ring-primary"
                    />
                    <Button size="sm" onClick={handleAdd} disabled={!addValue.trim()} className="rounded-xl h-9 px-4 text-xs">Add Year</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setAddValue(''); }} className="rounded-xl h-9 text-xs">Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setShowAdd(true)}
                      className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-semibold transition-colors py-1"
                    >
                      <Plus className="w-3.5 h-3.5" />Add Custom Year
                    </button>

                    <button
                      onClick={() => setShowPresetModal(true)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors py-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Configure Range</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Preset Range Generator Dialog ─────────────────────────────────── */}
      <Dialog open={showPresetModal} onOpenChange={setShowPresetModal}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl mx-4 w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Configure PYQ Year Grid</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Generate a batch of consecutive PYQ years for <strong className="text-foreground">{subjectName}</strong> without removing existing logs.
            </p>

            {/* Quick Presets Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setPresetEndYear(String(currentYearNum)); setPresetSpan('5'); setPresetPrefix(''); }}
                  className="rounded-xl text-xs font-mono tabular-nums justify-start h-9"
                >
                  5 Years ({currentYearNum-4}–{currentYearNum})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setPresetEndYear(String(currentYearNum - 1)); setPresetSpan('5'); setPresetPrefix(''); }}
                  className="rounded-xl text-xs font-mono tabular-nums justify-start h-9"
                >
                  5 Years ({currentYearNum-5}–{currentYearNum-1})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setPresetEndYear(String(currentYearNum)); setPresetSpan('3'); setPresetPrefix(''); }}
                  className="rounded-xl text-xs font-mono tabular-nums justify-start h-9"
                >
                  3 Years ({currentYearNum-2}–{currentYearNum})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setPresetEndYear(String(currentYearNum)); setPresetSpan('10'); setPresetPrefix(''); }}
                  className="rounded-xl text-xs font-mono tabular-nums justify-start h-9"
                >
                  10 Years ({currentYearNum-9}–{currentYearNum})
                </Button>
              </div>
            </div>

            {/* Custom Range Settings */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Latest Year</label>
                <Input
                  type="number"
                  value={presetEndYear}
                  onChange={e => setPresetEndYear(e.target.value)}
                  className={cn(
                    "h-9 text-xs font-mono bg-muted/50",
                    !endYearValidation.isValid && presetEndYear !== '' && "border-destructive focus-visible:ring-destructive"
                  )}
                  placeholder="e.g. 2024"
                />
                {!endYearValidation.isValid && presetEndYear !== '' && (
                  <p className="text-[10px] text-destructive font-medium leading-tight mt-0.5">{endYearValidation.error}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Number of Years</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={presetSpan}
                  onChange={e => setPresetSpan(e.target.value)}
                  className={cn(
                    "h-9 text-xs font-mono bg-muted/50",
                    !spanValidation.isValid && presetSpan !== '' && "border-destructive focus-visible:ring-destructive"
                  )}
                  placeholder="e.g. 5"
                />
                {!spanValidation.isValid && presetSpan !== '' && (
                  <p className="text-[10px] text-destructive font-medium leading-tight mt-0.5">{spanValidation.error}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Optional Prefix</label>
              <Input
                value={presetPrefix}
                onChange={e => setPresetPrefix(e.target.value)}
                className="h-9 text-xs bg-muted/50"
                placeholder="e.g. NEET-PG or INI-CET (leave blank for plain year)"
              />
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end mt-2">
            <Button variant="ghost" onClick={() => setShowPresetModal(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleGenerateCustomRange}
              disabled={!spanValidation.isValid || !endYearValidation.isValid}
              className="rounded-xl font-semibold bg-amber-500 hover:bg-amber-600 text-white gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Years</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit year dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[320px] rounded-2xl mx-4 w-[calc(100%-2rem)]">
          <DialogHeader><DialogTitle className="text-xl font-semibold">Edit Year Label</DialogTitle></DialogHeader>
          <div className="py-4">
            <Input
              autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); }}
              className="text-lg py-6 px-4 bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editValue.trim()} className="rounded-xl font-semibold px-8">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PYQ Delete confirmation dialog */}
      <Dialog open={showPYQDeleteConfirm} onOpenChange={setShowPYQDeleteConfirm}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl mx-4 w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-destructive">Delete PYQ Year</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold font-mono text-foreground">{pyqToDelete?.year}</span>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end mt-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowPYQDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-xl font-semibold shadow-sm" onClick={handlePYQDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score log modal for PYQ year */}
      <ScoreLogModal
        isOpen={Boolean(scoreModalPyq)}
        onClose={() => setScoreModalPyq(null)}
        initialType="pyq"
        initialSubjectId={subjectId}
        initialPyqYearId={scoreModalPyq?.id}
        initialTitle={scoreModalPyq ? `${subjectName} - ${scoreModalPyq.year} PYQ` : `${subjectName} PYQ`}
      />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

const STAGES = [
  { key: 'Strong', label: 'Strong', color: 'bg-green-500' },
  { key: 'Average', label: 'Average', color: 'bg-yellow-500' },
  { key: 'Weak', label: 'Weak', color: 'bg-red-500' }
];

export default function SubjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'systems' | 'pyq'>('systems');
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  const {
    subjectId, subject, systems, pyqYears,
    showAddSystem, setShowAddSystem,
    highlightId, handleDragEnd,
    totalTasks, completedTasks, progress,
    pyqCompletedCount, pyqTotalCount,
    overdueSystemsCount, recommendedFocus,
    isSubjectMastered,
  } = useSubjectDetailLogic(id);

  useEffect(() => {
    if (!subject && id && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      // If subject not loaded yet or cache is hydrating, trigger background universal curriculum verify
      loadUniversalOntology().catch(() => {});
    }
  }, [subject, id, hasAttemptedLoad]);

  if (!subject && id) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Loading Subject...</p>
          <p className="text-xs text-muted-foreground">Preparing high-yield medical systems and curriculum telemetry.</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="rounded-xl mt-2 cursor-pointer">
            <ChevronLeft className="w-4 h-4 mr-1" /> Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }
  if (!subject) return null;

  return (
    <div className="min-h-full bg-background px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:pb-10 max-w-5xl mx-auto flex flex-col relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <header className="mb-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/">
            <button className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors cursor-pointer">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="flex items-center gap-1.5 ml-auto">
            <Link href={`/mistakes?subjectId=${encodeURIComponent(String(subject?.id || id))}&origin=subject_detail`}>
              <button
                id="btn-subject-mistakes-notebook"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted/80 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/40 active:scale-95"
                title={`Open 20th Notebook for ${subject?.name || 'this subject'}`}
              >
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">20th Notebook</span>
              </button>
            </Link>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              title="Search topics"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-500">
              Subject Intelligence
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              High-Yield Focus
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{subject.name}</h1>
        </div>

        {/* Unified Overall Health Telemetry Card */}
        <div className="bg-card border border-border/60 shadow-sm p-4 sm:p-5 rounded-2xl space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-foreground">Curriculum Retention & Coverage</span>
              <span className="font-bold font-mono text-primary text-base">{progress}%</span>
            </div>
            <ProgressBar progress={progress} className="h-2.5" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/40 text-center">
            <div className="p-2 rounded-xl bg-muted/30 border border-border/30">
              <div className="text-lg font-bold text-foreground leading-none mb-1 font-mono">{systems.length}</div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Systems</div>
            </div>
            <div className="p-2 rounded-xl bg-muted/30 border border-border/30">
              <div className={cn("text-lg font-bold leading-none mb-1 font-mono", overdueSystemsCount > 0 ? "text-amber-500" : "text-emerald-500")}>
                {overdueSystemsCount}
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Needs Attention</div>
            </div>
            <div className="p-2 rounded-xl bg-muted/30 border border-border/30">
              <div className="text-lg font-bold text-foreground leading-none mb-1 font-mono">
                {pyqTotalCount > 0 ? `${pyqCompletedCount}/${pyqTotalCount}` : '0'}
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PYQs Solved</div>
            </div>
          </div>
        </div>

        {/* Embedded Friction & Memory Decay Diagnostic Capsule */}
        <SubjectFrictionCapsule
          subjectId={Number(subject.id || subjectId)}
          subjectName={subject.name}
        />

        {/* Recommended Focus Banner or Subject Mastered State */}
        {recommendedFocus ? (
          <div id="subject-recommended-focus-banner" className="bg-primary/10 border border-primary/25 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "p-2.5 rounded-xl shrink-0 border",
                recommendedFocus.reason === 'overdue_decay'
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/25"
                  : recommendedFocus.reason === 'weak_retention'
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/25"
                  : recommendedFocus.reason === 'high_yield_incomplete'
                  ? "bg-primary text-primary-foreground border-primary/40 shadow-xs"
                  : "bg-primary/20 text-primary border-primary/30"
              )}>
                {recommendedFocus.reason === 'overdue_decay' ? (
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                ) : recommendedFocus.reason === 'weak_retention' ? (
                  <Brain className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Recommended Focus
                  </span>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.2 rounded-full border",
                    recommendedFocus.reason === 'overdue_decay'
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : recommendedFocus.reason === 'weak_retention'
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      : "bg-muted/60 text-muted-foreground border-border/40"
                  )}>
                    {recommendedFocus.reasonLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight truncate">
                    {recommendedFocus.system.name}
                  </h4>
                  <span className="text-xs font-mono text-muted-foreground">
                    ({recommendedFocus.progress}% coverage)
                  </span>
                </div>
              </div>
            </div>

            <Button
              id="btn-initiate-recommended-focus"
              size="sm"
              onClick={() => {
                setActiveTab('systems');
                setTimeout(() => {
                  const el = document.getElementById(`system-card-${recommendedFocus.system.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 50);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl text-xs gap-1.5 cursor-pointer self-start sm:self-auto px-4 shrink-0"
            >
              <span>{recommendedFocus.actionLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : isSubjectMastered ? (
          <div id="subject-mastered-banner" className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    Subject Mastered
                  </span>
                </div>
                <h4 className="font-bold text-foreground text-sm leading-tight">
                  All Systems 100% Completed & Revisions Current
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Great work! You have finished all curriculum topics and your spaced repetition schedule is up to date.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {/* ── Workspace Tab Bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-6">
        <button
          onClick={() => setActiveTab('systems')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none",
            activeTab === 'systems'
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span>Curriculum Systems ({systems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pyq')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none",
            activeTab === 'pyq'
              ? "bg-amber-500 text-white shadow-xs"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Exam Practice {pyqTotalCount > 0 ? `(${pyqCompletedCount}/${pyqTotalCount})` : ''}</span>
        </button>
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────────── */}
      {activeTab === 'pyq' ? (
        <section className="mb-8">
          <PYQSection
            subjectId={subject.id!}
            subjectName={subject.name}
            years={pyqYears}
          />
        </section>
      ) : (
        /* Systems Accordion List */
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Curriculum Systems ({systems.length})
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddSystem(true)}
              className="h-8 text-xs font-semibold rounded-xl gap-1.5 border-border/60 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add System</span>
            </Button>
          </div>

          {systems.length === 0 ? (
            <EmptyStateGraphic
              icon={LayoutList}
              title="Start Structuring Your Subject"
              description={`Break down ${subject.name} into specific modules or systems. This enables precise task tracking and unlocks spaced repetition tracking.`}
              action={
                <Button onClick={() => setShowAddSystem(true)} size="sm" className="gap-1.5 rounded-xl shadow-xs cursor-pointer">
                  <Plus className="w-4 h-4" /> Add First System
                </Button>
              }
              className="mt-6"
            />
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="systems-list" isDropDisabled={false}>
                {(provided) => (
                  <div 
                    className="flex flex-col gap-3.5"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {systems.map((system, index) => (
                      <Draggable 
                        key={system.id} 
                        draggableId={String(system.id)} 
                        index={index}
                        isDragDisabled={false}
                      >
                        {(provided, snapshot) => (
                          <div
                            id={`system-card-${system.id}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(snapshot.isDragging && "opacity-80 z-50")}
                            style={provided.draggableProps.style}
                          >
                            <SystemCard
                              system={system}
                              subjectName={subject.name}
                              highlighted={system.id === highlightId}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </section>
      )}

      {/* FAB */}
      {systems.length > 0 && activeTab === 'systems' && (
        <button
          onClick={() => setShowAddSystem(true)}
          className="fixed right-6 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-all z-40 shadow-lg cursor-pointer"
          style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
          aria-label="Add System"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      <AddDialog
        open={showAddSystem}
        onOpenChange={setShowAddSystem}
        title="New System"
        placeholder="e.g. Cardiology"
        onSave={(name) => addSystem(subject.id!, name)}
      />
    </div>
  );
}
