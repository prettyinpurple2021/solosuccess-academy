/**
 * @file RubricScorecard.tsx — Rubric scoring display for a milestone submission.
 * 
 * Shows each rubric category as a labeled progress bar with the
 * score / max_points and optional per-category feedback.
 * Also calculates a total percentage.
 */
import { useRubricCategories, useRubricScores } from '@/hooks/useProjectMilestones';
import { Progress } from '@/components/ui/progress';
import { Loader2, Award } from 'lucide-react';

interface RubricScorecardProps {
  submissionId: string;
  courseId: string;
}

export function RubricScorecard({ submissionId, courseId }: RubricScorecardProps) {
  const { data: categories = [], isLoading: catsLoading } = useRubricCategories(courseId);
  const { data: scores = [], isLoading: scoresLoading } = useRubricScores(submissionId);

  const isLoading = catsLoading || scoresLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no rubric categories are configured for this course, don't render
  if (categories.length === 0) return null;

  // Map scores by category_id for quick lookup
  const scoreMap = new Map(scores.map((s) => [s.category_id, s]));

  // Calculate totals
  const totalMax = categories.reduce((sum, c) => sum + c.max_points, 0);
  const totalEarned = categories.reduce((sum, c) => {
    const s = scoreMap.get(c.id);
    return sum + (s?.score ?? 0);
  }, 0);
  const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  // Color based on percentage
  const getColor = (pct: number) => {
    if (pct >= 80) return 'text-success';
    if (pct >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="bg-background/30 border border-primary/20 rounded-lg p-5 space-y-4">
      {/* Header with total score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" style={{ filter: 'drop-shadow(0 0 5px hsl(var(--primary)))' }} />
          <h5 className="font-semibold text-foreground">Rubric Scorecard</h5>
        </div>
        <span className={`text-2xl font-bold ${getColor(percentage)}`}>
          {percentage}%
        </span>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const score = scoreMap.get(cat.id);
          const earned = score?.score ?? 0;
          const pct = cat.max_points > 0 ? Math.round((earned / cat.max_points) * 100) : 0;

          return (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{cat.name}</span>
                <span className={`font-mono ${getColor(pct)}`}>
                  {earned}/{cat.max_points}
                </span>
              </div>
              <Progress
                value={pct}
                className="h-2"
                style={{ boxShadow: pct >= 80 ? '0 0 8px hsl(var(--success)/0.4)' : undefined }}
              />
              {score?.feedback && (
                <p className="text-xs text-muted-foreground italic pl-1">{score.feedback}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="border-t border-primary/20 pt-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">Total</span>
        <span className={`font-bold font-mono ${getColor(percentage)}`}>
          {totalEarned}/{totalMax} points
        </span>
      </div>
    </div>
  );
}
