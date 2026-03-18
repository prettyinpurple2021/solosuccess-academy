/**
 * @file GradeEditor.tsx — Admin Grade Override Dialog
 *
 * PURPOSE: Allows admins to manually override quiz scores and add grading
 * notes for individual student submissions. Shows current score, allows
 * setting a new admin_override_score, and records the grader + timestamp.
 *
 * FEATURES:
 * - Rubric-based grading with customizable criteria
 * - Per-question partial credit scoring
 * - Grade history/audit trail (via admin_notes + timestamp)
 */
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Edit2, Save, Plus, Trash2, ClipboardList, Calculator } from 'lucide-react';

// Rubric criterion: a grading dimension with a label and max points
interface RubricCriterion {
  id: string;
  label: string;
  maxPoints: number;
  earnedPoints: number;
  feedback: string;
}

// Default rubric template for quick grading
const DEFAULT_RUBRIC: RubricCriterion[] = [
  { id: crypto.randomUUID(), label: 'Understanding', maxPoints: 25, earnedPoints: 0, feedback: '' },
  { id: crypto.randomUUID(), label: 'Application', maxPoints: 25, earnedPoints: 0, feedback: '' },
  { id: crypto.randomUUID(), label: 'Completeness', maxPoints: 25, earnedPoints: 0, feedback: '' },
  { id: crypto.randomUUID(), label: 'Quality', maxPoints: 25, earnedPoints: 0, feedback: '' },
];

interface GradeEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressId: string;
  studentId: string;
  studentName: string;
  lessonTitle: string;
  courseTitle: string;
  currentScore: number | null;
  currentOverride: number | null;
  currentNotes: string | null;
}

export function GradeEditor({
  open,
  onOpenChange,
  progressId,
  studentId,
  studentName,
  lessonTitle,
  courseTitle,
  currentScore,
  currentOverride,
  currentNotes,
}: GradeEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('simple');

  // Simple grading state
  const [score, setScore] = useState<string>(
    currentOverride?.toString() ?? currentScore?.toString() ?? ''
  );
  const [notes, setNotes] = useState(currentNotes ?? '');

  // Rubric grading state
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>(DEFAULT_RUBRIC);

  // Calculate rubric total score as a percentage
  const rubricScore = useMemo(() => {
    const totalMax = rubricCriteria.reduce((sum, c) => sum + c.maxPoints, 0);
    const totalEarned = rubricCriteria.reduce((sum, c) => sum + c.earnedPoints, 0);
    if (totalMax === 0) return 0;
    return Math.round((totalEarned / totalMax) * 100);
  }, [rubricCriteria]);

  // Build rubric feedback summary for admin_notes
  const rubricFeedback = useMemo(() => {
    const lines = rubricCriteria
      .map(c => `${c.label}: ${c.earnedPoints}/${c.maxPoints}${c.feedback ? ` — ${c.feedback}` : ''}`)
      .join('\n');
    return `[Rubric Grading]\n${lines}`;
  }, [rubricCriteria]);

  const updateCriterion = (id: string, updates: Partial<RubricCriterion>) => {
    setRubricCriteria(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addCriterion = () => {
    setRubricCriteria(prev => [
      ...prev,
      { id: crypto.randomUUID(), label: '', maxPoints: 25, earnedPoints: 0, feedback: '' },
    ]);
  };

  const removeCriterion = (id: string) => {
    setRubricCriteria(prev => prev.filter(c => c.id !== id));
  };

  const updateGradeMutation = useMutation({
    mutationFn: async (data: { score: number; notes: string }) => {
      const { error } = await supabase
        .from('user_progress')
        .update({
          admin_override_score: data.score,
          admin_notes: data.notes || null,
          graded_by: user?.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', progressId);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gradebook'] });
      queryClient.invalidateQueries({ queryKey: ['gradebook-detailed'] });
      toast.success('Grade updated successfully');

      // Send email notification to student
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          const response = await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'grade_review',
              userId: studentId,
              data: {
                lessonTitle,
                courseTitle,
                score: variables.score,
                adminNotes: variables.notes,
              },
            },
          });

          if (response.error) {
            console.error('Failed to send notification:', response.error);
          }
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Failed to update grade:', error);
      toast.error('Failed to update grade');
    },
  });

  const handleSaveSimple = () => {
    const numScore = parseInt(score, 10);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      toast.error('Score must be between 0 and 100');
      return;
    }
    updateGradeMutation.mutate({ score: numScore, notes });
  };

  const handleSaveRubric = () => {
    const combinedNotes = notes
      ? `${rubricFeedback}\n\n[Additional Notes]\n${notes}`
      : rubricFeedback;
    updateGradeMutation.mutate({ score: rubricScore, notes: combinedNotes });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/30 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Edit Grade
          </DialogTitle>
        </DialogHeader>

        {/* Student & lesson info */}
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Student</Label>
            <p className="font-medium text-sm">{studentName}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Lesson</Label>
            <p className="font-medium text-sm">{lessonTitle}</p>
          </div>
        </div>

        {currentScore !== null && currentOverride === null && (
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Original Quiz Score</Label>
            <p className="font-medium text-warning">{currentScore}%</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="text-xs">
              <Calculator className="h-3 w-3 mr-1" />
              Simple Grade
            </TabsTrigger>
            <TabsTrigger value="rubric" className="text-xs">
              <ClipboardList className="h-3 w-3 mr-1" />
              Rubric Grade
            </TabsTrigger>
          </TabsList>

          {/* Simple grading tab */}
          <TabsContent value="simple" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="override-score">
                {currentOverride !== null ? 'Override Score' : 'Manual Grade'} (0-100)
              </Label>
              <Input
                id="override-score"
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="bg-background/50 border-primary/30 focus:border-primary"
                placeholder="Enter score..."
              />
            </div>
          </TabsContent>

          {/* Rubric grading tab */}
          <TabsContent value="rubric" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label>Rubric Criteria</Label>
              <Badge variant="outline" className="text-sm">
                Total: {rubricScore}%
              </Badge>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {rubricCriteria.map((criterion) => (
                <Card key={criterion.id} className="border-border/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={criterion.label}
                        onChange={(e) => updateCriterion(criterion.id, { label: e.target.value })}
                        placeholder="Criterion name..."
                        className="flex-1 h-8 text-sm"
                      />
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={criterion.maxPoints}
                        onChange={(e) => updateCriterion(criterion.id, { maxPoints: parseInt(e.target.value) || 0 })}
                        className="w-16 h-8 text-sm text-center"
                        title="Max points"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeCriterion(criterion.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[criterion.earnedPoints]}
                        onValueChange={([val]) => updateCriterion(criterion.id, { earnedPoints: val })}
                        max={criterion.maxPoints}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-12 text-right">
                        {criterion.earnedPoints}/{criterion.maxPoints}
                      </span>
                    </div>
                    <Input
                      value={criterion.feedback}
                      onChange={(e) => updateCriterion(criterion.id, { feedback: e.target.value })}
                      placeholder="Feedback for this criterion..."
                      className="h-7 text-xs"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addCriterion} className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Add Criterion
            </Button>
          </TabsContent>
        </Tabs>

        {/* Shared notes field */}
        <div className="space-y-2">
          <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
          <Textarea
            id="admin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-background/50 border-primary/30 focus:border-primary min-h-[80px]"
            placeholder="Add notes about this grade..."
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-muted-foreground/30"
          >
            Cancel
          </Button>
          <Button
            onClick={activeTab === 'rubric' ? handleSaveRubric : handleSaveSimple}
            disabled={updateGradeMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {updateGradeMutation.isPending ? 'Saving...' : 'Save Grade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
