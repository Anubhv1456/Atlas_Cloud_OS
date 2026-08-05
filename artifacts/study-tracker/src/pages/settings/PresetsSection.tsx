import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EXAM_PRESETS, loadPreset, ExamPreset } from '@/lib/exam-presets';
import { BookOpen, Loader2, Sparkles, Layers, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function PresetsSection() {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(EXAM_PRESETS[0].id);
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);

  const selectedPreset = EXAM_PRESETS.find((p) => p.id === selectedPresetId) || EXAM_PRESETS[0];

  const handleMergePreset = async (preset: ExamPreset) => {
    setLoadingPresetId(preset.id);
    try {
      await loadPreset(preset.hierarchy);
      toast.success(`${preset.name} merged successfully!`);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to merge ${preset.name}`);
      setLoadingPresetId(null);
    }
  };

  const isMerging = loadingPresetId === selectedPreset.id;
  const totalSubjects = selectedPreset.hierarchy.length;
  const totalTopics = selectedPreset.hierarchy.reduce((sum, item) => sum + item.topics.length, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div>
          <h2 className="text-lg font-medium text-foreground tracking-tight">
            Curriculum Presets
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select an exam-aligned curriculum preset from the dropdown to import structured subjects and topics without losing your existing progress.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs space-y-4 max-w-2xl">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            Select Exam Preset
          </label>
          <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
            <SelectTrigger className="w-full bg-background border-border/80 rounded-xl text-xs font-medium h-10 px-3">
              <SelectValue placeholder="Choose a curriculum preset..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              {EXAM_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id} className="text-xs py-2">
                  <div className="flex items-center justify-between w-full gap-3">
                    <span className="font-semibold">{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({preset.badge})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Preset Details Card */}
        <div className="bg-muted/40 border border-border/50 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                {selectedPreset.badge}
              </Badge>
              <h3 className="font-bold text-foreground text-xs">
                {selectedPreset.name}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground font-medium bg-background px-2 py-0.5 rounded-md border border-border/40">
              {totalSubjects} Subjects • {totalTopics} Topics
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {selectedPreset.description}
          </p>

          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-muted-foreground/70" />
              Target: <span className="text-foreground font-semibold">{selectedPreset.targetExam}</span>
            </div>

            <Button
              onClick={() => handleMergePreset(selectedPreset)}
              disabled={loadingPresetId !== null}
              size="sm"
              className="rounded-xl text-xs font-semibold h-8 px-3.5 gap-1.5 shrink-0 shadow-xs transition-all"
            >
              {isMerging ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Merging Preset...
                </>
              ) : (
                <>
                  <BookOpen className="h-3.5 w-3.5" />
                  Merge Selected Preset
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
