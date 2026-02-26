/**
 * GradeWeightsPanel – A settings drawer inside the Gradebook page
 * that lets admins configure quiz/activity/worksheet/exam/essay grade weights
 * globally and per-course.
 */
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { Settings2, Save, RotateCcw, AlertCircle } from 'lucide-react';
import {
  useGradeSettings,
  useUpdateGradeSettings,
  getWeightsForCourse,
} from '@/hooks/useGradeSettings';

interface GradeWeightsPanelProps {
  courses: { id: string; title: string }[];
}

/** Slider config for each weight component */
const SLIDERS = [
  { key: 'quiz' as const, label: 'Quiz Weight', colorClass: 'warning' },
  { key: 'activity' as const, label: 'Activity Weight', colorClass: 'info' },
  { key: 'worksheet' as const, label: 'Worksheet Weight', colorClass: 'accent' },
  { key: 'exam' as const, label: 'Final Exam Weight', colorClass: 'secondary' },
  { key: 'essay' as const, label: 'Final Essay Weight', colorClass: 'primary' },
] as const;

type WeightKey = typeof SLIDERS[number]['key'];

export function GradeWeightsPanel({ courses }: GradeWeightsPanelProps) {
  const { data: settings, isLoading } = useGradeSettings();
  const updateSettings = useUpdateGradeSettings();

  const [editScope, setEditScope] = useState<string | null>(null);

  // Local slider state
  const [weights, setWeights] = useState<Record<WeightKey, number>>({
    quiz: 50, activity: 30, worksheet: 20, exam: 0, essay: 0,
  });

  // Sync from saved settings when scope changes
  useEffect(() => {
    if (!settings) return;
    const current = editScope === 'global'
      ? getWeightsForCourse(settings)
      : getWeightsForCourse(settings, editScope || undefined);
    setWeights({
      quiz: current.quizWeight,
      activity: current.activityWeight,
      worksheet: current.worksheetWeight,
      exam: current.examWeight,
      essay: current.essayWeight,
    });
  }, [editScope, settings]);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = total === 100;

  /** When one slider moves, redistribute remaining proportionally among others */
  const handleSliderChange = (which: WeightKey, newValue: number) => {
    const others = SLIDERS.map(s => s.key).filter(k => k !== which);
    const oldOtherTotal = others.reduce((sum, k) => sum + weights[k], 0) || 1;
    const remaining = 100 - newValue;

    const updated = { ...weights, [which]: newValue };
    let allocated = 0;
    others.forEach((k, i) => {
      if (i === others.length - 1) {
        // Last one gets remainder to avoid rounding issues
        updated[k] = remaining - allocated;
      } else {
        const share = Math.round((weights[k] / oldOtherTotal) * remaining);
        updated[k] = share;
        allocated += share;
      }
    });
    setWeights(updated);
  };

  const handleSave = () => {
    if (!isValid) return;
    updateSettings.mutate({
      courseId: editScope === 'global' ? null : editScope,
      quizWeight: weights.quiz,
      activityWeight: weights.activity,
      worksheetWeight: weights.worksheet,
      examWeight: weights.exam,
      essayWeight: weights.essay,
    });
  };

  const handleReset = () => {
    setWeights({ quiz: 40, activity: 20, worksheet: 15, exam: 15, essay: 10 });
  };

  const overrideCourseIds = settings?.filter(s => s.courseId !== null).map(s => s.courseId) || [];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-all duration-300"
        >
          <Settings2 className="h-4 w-4" />
          Grade Weights
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background/95 backdrop-blur-xl border-primary/30 w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <Settings2 className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            Grade Weight Settings
          </SheetTitle>
          <SheetDescription>
            Configure how each component contributes to the Combined Grade.
            Weights must total 100%.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <NeonSpinner size="md" />
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Scope Selector */}
            <div className="space-y-2">
              <Label className="text-foreground/80">Editing scope</Label>
              <Select
                value={editScope ?? 'global'}
                onValueChange={(v) => setEditScope(v === 'global' ? null : v)}
              >
                <SelectTrigger className="bg-background/50 border-primary/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary/30">
                  <SelectItem value="global">🌐 Global Default</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                      {overrideCourseIds.includes(c.id) && ' ✦'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editScope && editScope !== 'global'
                  ? 'Per-course override — takes priority over global default'
                  : 'Applies to all courses without a specific override'}
              </p>
            </div>

            <Separator className="bg-primary/20" />

            {/* Weight Sliders */}
            {SLIDERS.map(({ key, label, colorClass }) => (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground/80">{label}</Label>
                  <Badge variant="outline" className={`border-${colorClass}/50 text-${colorClass} font-mono`}>
                    {weights[key]}%
                  </Badge>
                </div>
                <Slider
                  value={[weights[key]]}
                  onValueChange={([v]) => handleSliderChange(key, v)}
                  min={0}
                  max={100}
                  step={5}
                  className={`[&_[role=slider]]:border-${colorClass} [&_[role=slider]]:bg-${colorClass} [&_[data-orientation=horizontal]>span]:bg-${colorClass}`}
                />
              </div>
            ))}

            {/* Total indicator */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              isValid
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}>
              {!isValid && <AlertCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">
                Total: {total}% {isValid ? '✓' : '(must be 100%)'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={!isValid || updateSettings.isPending}
                className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4" />
                {updateSettings.isPending ? 'Saving...' : 'Save Weights'}
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2 border-muted-foreground/30"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            {/* Existing overrides summary */}
            {overrideCourseIds.length > 0 && (
              <div className="space-y-2 pt-2">
                <Separator className="bg-primary/20" />
                <Label className="text-foreground/60 text-xs uppercase tracking-wide">
                  Active Per-Course Overrides
                </Label>
                <div className="space-y-1">
                  {settings?.filter(s => s.courseId !== null).map((s) => {
                    const course = courses.find(c => c.id === s.courseId);
                    return (
                      <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20 border border-muted/10">
                        <span className="text-foreground/70 truncate max-w-[140px]">
                          {course?.title || 'Unknown'}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          Q{s.quizWeight}/A{s.activityWeight}/W{s.worksheetWeight}/E{s.examWeight}/Es{s.essayWeight}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
