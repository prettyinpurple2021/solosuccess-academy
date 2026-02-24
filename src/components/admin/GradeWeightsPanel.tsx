/**
 * GradeWeightsPanel – A settings drawer inside the Gradebook page
 * that lets admins configure quiz/activity/worksheet grade weights
 * globally and per-course.
 *
 * WHY: Replaces the hardcoded 50/30/20 split. Admins can now customise
 * how much each component contributes to the final Combined Grade.
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
  type GradeWeights,
} from '@/hooks/useGradeSettings';

interface GradeWeightsPanelProps {
  /** List of courses for the per-course override selector */
  courses: { id: string; title: string }[];
}

export function GradeWeightsPanel({ courses }: GradeWeightsPanelProps) {
  const { data: settings, isLoading } = useGradeSettings();
  const updateSettings = useUpdateGradeSettings();

  // Which scope are we editing? null = global, or a course ID
  const [editScope, setEditScope] = useState<string | null>(null);

  // Local slider state (before saving)
  const [quiz, setQuiz] = useState(50);
  const [activity, setActivity] = useState(30);
  const [worksheet, setWorksheet] = useState(20);

  // When scope or settings change, load current values
  useEffect(() => {
    if (!settings) return;
    const current = editScope === 'global'
      ? getWeightsForCourse(settings)
      : getWeightsForCourse(settings, editScope || undefined);
    setQuiz(current.quizWeight);
    setActivity(current.activityWeight);
    setWorksheet(current.worksheetWeight);
  }, [editScope, settings]);

  // Derived: do the sliders sum to 100?
  const total = quiz + activity + worksheet;
  const isValid = total === 100;

  /** Smart slider adjustment: when one slider moves, adjust the others proportionally */
  const handleSliderChange = (
    which: 'quiz' | 'activity' | 'worksheet',
    newValue: number
  ) => {
    const remaining = 100 - newValue;
    if (which === 'quiz') {
      const otherTotal = activity + worksheet || 1;
      setQuiz(newValue);
      setActivity(Math.round((activity / otherTotal) * remaining));
      setWorksheet(100 - newValue - Math.round((activity / otherTotal) * remaining));
    } else if (which === 'activity') {
      const otherTotal = quiz + worksheet || 1;
      setActivity(newValue);
      setQuiz(Math.round((quiz / otherTotal) * remaining));
      setWorksheet(100 - newValue - Math.round((quiz / otherTotal) * remaining));
    } else {
      const otherTotal = quiz + activity || 1;
      setWorksheet(newValue);
      setQuiz(Math.round((quiz / otherTotal) * remaining));
      setActivity(100 - newValue - Math.round((quiz / otherTotal) * remaining));
    }
  };

  const handleSave = () => {
    if (!isValid) return;
    updateSettings.mutate({
      courseId: editScope === 'global' ? null : editScope,
      quizWeight: quiz,
      activityWeight: activity,
      worksheetWeight: worksheet,
    });
  };

  const handleReset = () => {
    setQuiz(50);
    setActivity(30);
    setWorksheet(20);
  };

  // Which courses already have overrides?
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
            Configure how quiz, activity, and worksheet scores contribute to the Combined Grade.
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

            {/* Quiz Weight Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground/80">Quiz Weight</Label>
                <Badge variant="outline" className="border-warning/50 text-warning font-mono">
                  {quiz}%
                </Badge>
              </div>
              <Slider
                value={[quiz]}
                onValueChange={([v]) => handleSliderChange('quiz', v)}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:border-warning [&_[role=slider]]:bg-warning [&_[data-orientation=horizontal]>span]:bg-warning"
              />
            </div>

            {/* Activity Weight Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground/80">Activity Weight</Label>
                <Badge variant="outline" className="border-info/50 text-info font-mono">
                  {activity}%
                </Badge>
              </div>
              <Slider
                value={[activity]}
                onValueChange={([v]) => handleSliderChange('activity', v)}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:border-info [&_[role=slider]]:bg-info [&_[data-orientation=horizontal]>span]:bg-info"
              />
            </div>

            {/* Worksheet Weight Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground/80">Worksheet Weight</Label>
                <Badge variant="outline" className="border-accent/50 text-accent font-mono">
                  {worksheet}%
                </Badge>
              </div>
              <Slider
                value={[worksheet]}
                onValueChange={([v]) => handleSliderChange('worksheet', v)}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:border-accent [&_[role=slider]]:bg-accent [&_[data-orientation=horizontal]>span]:bg-accent"
              />
            </div>

            {/* Total indicator */}
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${
              isValid
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}>
              {!isValid && <AlertCircle className="h-4 w-4" />}
              <span className="text-sm font-medium">
                Total: {total}% {isValid ? '✓' : `(must be 100%)`}
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
                        <span className="text-foreground/70 truncate max-w-[180px]">
                          {course?.title || 'Unknown'}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {s.quizWeight}/{s.activityWeight}/{s.worksheetWeight}
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
