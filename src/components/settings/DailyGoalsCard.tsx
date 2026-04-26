/**
 * @file DailyGoalsCard.tsx — Settings card for daily study goals
 *
 * Lets the user choose:
 *  - Daily lesson target (0–10)
 *  - Daily active-minute target (0–240)
 *
 * Setting either to 0 disables that meter. Setting BOTH to 0
 * hides the dashboard card entirely.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Target, BookOpen, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDailyGoalsConfig } from '@/hooks/useDailyGoals';

export function DailyGoalsCard() {
  const { user } = useAuth();
  const { goals, setGoals } = useDailyGoalsConfig(user?.id);

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Target className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
          Daily Study Goals
        </CardTitle>
        <CardDescription>
          Set targets that show up on your dashboard. Either slider at 0 turns that goal off.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Lessons goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-foreground/90">
              <BookOpen className="h-4 w-4 text-primary" />
              Lessons per day
            </Label>
            <span className="font-mono text-sm text-primary">
              {goals.lessonsTarget === 0 ? 'Off' : goals.lessonsTarget}
            </span>
          </div>
          <Slider
            value={[goals.lessonsTarget]}
            min={0}
            max={10}
            step={1}
            onValueChange={(v) => setGoals({ lessonsTarget: v[0] })}
            aria-label="Daily lesson target"
          />
          <p className="text-xs text-muted-foreground">
            Counts any lesson you mark complete today.
          </p>
        </div>

        {/* Minutes goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-foreground/90">
              <Clock className="h-4 w-4 text-secondary" />
              Active minutes per day
            </Label>
            <span className="font-mono text-sm text-secondary">
              {goals.minutesTarget === 0 ? 'Off' : `${goals.minutesTarget} min`}
            </span>
          </div>
          <Slider
            value={[goals.minutesTarget]}
            min={0}
            max={120}
            step={5}
            onValueChange={(v) => setGoals({ minutesTarget: v[0] })}
            aria-label="Daily active minutes target"
          />
          <p className="text-xs text-muted-foreground">
            Tracks textbook reading time. Lesson-watch time will be added in a future update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
