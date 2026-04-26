/**
 * @file DailyGoalCard.tsx — Daily Study Goal Progress Card
 *
 * Shows two stacked progress meters (lessons + minutes) toward
 * the user's daily targets. Targets are configured in Settings →
 * Daily Goals; see useDailyGoals.ts.
 *
 * Hidden when both targets are 0 (user disabled goals entirely).
 * Encouragement copy changes based on % complete to keep it warm.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, BookOpen, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDailyGoalsConfig, useDailyProgress } from '@/hooks/useDailyGoals';
import { cn } from '@/lib/utils';

interface DailyGoalCardProps {
  className?: string;
}

export function DailyGoalCard({ className }: DailyGoalCardProps) {
  const { user } = useAuth();
  const { goals } = useDailyGoalsConfig(user?.id);
  const { data: progress } = useDailyProgress(user?.id);

  // If user disabled both goals entirely, hide card.
  if (goals.lessonsTarget === 0 && goals.minutesTarget === 0) {
    return null;
  }

  const lessonsToday = progress?.lessonsToday ?? 0;
  const minutesToday = progress?.minutesToday ?? 0;

  const lessonsPct =
    goals.lessonsTarget > 0
      ? Math.min(100, Math.round((lessonsToday / goals.lessonsTarget) * 100))
      : 0;
  const minutesPct =
    goals.minutesTarget > 0
      ? Math.min(100, Math.round((minutesToday / goals.minutesTarget) * 100))
      : 0;

  const lessonsMet = goals.lessonsTarget > 0 && lessonsToday >= goals.lessonsTarget;
  const minutesMet = goals.minutesTarget > 0 && minutesToday >= goals.minutesTarget;
  const allActiveGoalsMet =
    (goals.lessonsTarget === 0 || lessonsMet) && (goals.minutesTarget === 0 || minutesMet);

  return (
    <Card
      className={cn(
        'glass-card border-primary/30 hover:border-primary/50 transition-all duration-300',
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between font-display text-lg">
          <span className="flex items-center gap-2">
            <Target
              className={cn(
                'h-5 w-5 transition-colors',
                allActiveGoalsMet
                  ? 'text-success drop-shadow-[0_0_8px_hsl(var(--success)/0.6)]'
                  : 'text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]'
              )}
            />
            Today's Goal
          </span>
          {!goals.configured && (
            <Link
              to="/settings"
              className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              Customize →
            </Link>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {goals.lessonsTarget > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-foreground/80">
                <BookOpen className="h-3.5 w-3.5" />
                Lessons
              </span>
              <span
                className={cn(
                  'font-mono text-xs',
                  lessonsMet ? 'text-success' : 'text-muted-foreground'
                )}
              >
                {lessonsToday} / {goals.lessonsTarget}
              </span>
            </div>
            <Progress
              value={lessonsPct}
              className={cn('h-2', lessonsMet && '[&>div]:bg-success')}
            />
          </div>
        )}

        {goals.minutesTarget > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-foreground/80">
                <Clock className="h-3.5 w-3.5" />
                Active minutes
              </span>
              <span
                className={cn(
                  'font-mono text-xs',
                  minutesMet ? 'text-success' : 'text-muted-foreground'
                )}
              >
                {minutesToday} / {goals.minutesTarget} min
              </span>
            </div>
            <Progress
              value={minutesPct}
              className={cn('h-2', minutesMet && '[&>div]:bg-success')}
            />
          </div>
        )}

        <div className="text-center text-xs pt-1 border-t border-border/40">
          {allActiveGoalsMet ? (
            <p className="text-success flex items-center justify-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Goal smashed! Streak protected for today.
            </p>
          ) : lessonsToday + minutesToday === 0 ? (
            <p className="text-muted-foreground">Start a lesson or open the textbook to begin.</p>
          ) : (
            <p className="text-muted-foreground">Keep going — almost there!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
