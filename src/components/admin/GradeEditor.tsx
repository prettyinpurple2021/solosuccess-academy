/**
 * @file GradeEditor.tsx — Admin Grade Override Dialog
 *
 * PURPOSE: Allows admins to manually override quiz scores and add grading
 * notes for individual student submissions. Shows current score, allows
 * setting a new admin_override_score, and records the grader + timestamp.
 *
 * PRODUCTION TODO:
 * - Add rubric-based grading
 * - Support partial credit with per-question scoring
 * - Add grade history/audit trail
 */
import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Edit2, Save } from 'lucide-react';

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
  const [score, setScore] = useState<string>(
    currentOverride?.toString() ?? currentScore?.toString() ?? ''
  );
  const [notes, setNotes] = useState(currentNotes ?? '');

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
          } else {
            console.log('Notification sent successfully');
          }
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't show error to user - grade was saved successfully
      }
      
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Failed to update grade:', error);
      toast.error('Failed to update grade');
    },
  });

  const handleSave = () => {
    const numScore = parseInt(score, 10);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      toast.error('Score must be between 0 and 100');
      return;
    }
    updateGradeMutation.mutate({ score: numScore, notes });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Edit Grade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground">Student</Label>
            <p className="font-medium">{studentName}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground">Lesson</Label>
            <p className="font-medium">{lessonTitle}</p>
          </div>

          {currentScore !== null && currentOverride === null && (
            <div className="space-y-1">
              <Label className="text-muted-foreground">Original Quiz Score</Label>
              <p className="font-medium text-warning">{currentScore}%</p>
            </div>
          )}

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

          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
            <Textarea
              id="admin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background/50 border-primary/30 focus:border-primary min-h-[100px]"
              placeholder="Add notes about this grade..."
            />
          </div>
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
            onClick={handleSave}
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
