/**
 * @file ActivityViewer.tsx — Student-facing activity step player
 *
 * Renders a structured activity with instructions and checkable steps.
 * Students click steps to mark them complete; progress is tracked locally
 * in component state (steps are checkboxes, not persisted to the DB).
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Target, BookOpen, Zap } from 'lucide-react';
import type { ActivityData } from '@/lib/courseData';

interface ActivityViewerProps {
  activityData: ActivityData;
  /** Called with completion percentage (0-100) when steps change */
  onProgressChange?: (score: number) => void;
  /** Previously saved activity score to restore step state */
  initialScore?: number | null;
}

const TYPE_CONFIG = {
  reflection: { icon: Lightbulb, label: 'Reflection', colorClass: 'text-secondary' },
  exercise: { icon: Target, label: 'Exercise', colorClass: 'text-primary' },
  'case-study': { icon: BookOpen, label: 'Case Study', colorClass: 'text-accent' },
  brainstorm: { icon: Zap, label: 'Brainstorm', colorClass: 'text-success' },
} as const;

export function ActivityViewer({ activityData, onProgressChange, initialScore }: ActivityViewerProps) {
  const activities = activityData.activities ?? [];
  const allSteps = activities.flatMap((a) => a.steps);
  const totalSteps = allSteps.length;

  // Restore completed steps from initialScore if available
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    if (initialScore != null && initialScore > 0 && totalSteps > 0) {
      // Restore the first N steps as completed based on saved percentage
      const restoredCount = Math.round((initialScore / 100) * totalSteps);
      const restored = new Set<string>();
      allSteps.slice(0, restoredCount).forEach(s => restored.add(s.id));
      return restored;
    }
    return new Set();
  });

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Calculate and report the new score
      const newPct = totalSteps > 0 ? Math.round((next.size / totalSteps) * 100) : 0;
      onProgressChange?.(newPct);
      return next;
    });
  };

  const doneSteps = completedSteps.size;
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Overall step progress */}
      {totalSteps > 0 && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Steps completed</span>
            <span className="font-medium text-primary">
              {doneSteps}/{totalSteps}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}

      {activities.map((activity) => {
        const config =
          TYPE_CONFIG[activity.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.exercise;
        const Icon = config.icon;

        return (
          <div key={activity.id} className="space-y-4">
            {/* Activity header */}
            <div className="flex flex-wrap items-center gap-2">
              <Icon className={`h-5 w-5 ${config.colorClass}`} />
              <h3 className="font-display font-semibold text-lg">{activity.title}</h3>
              <Badge variant="outline" className="text-xs border-primary/30">
                {config.label}
              </Badge>
            </div>

            {/* Instructions */}
            {activity.instructions && (
              <p className="text-muted-foreground leading-relaxed">
                {activity.instructions}
              </p>
            )}

            {/* Steps */}
            {activity.steps.length > 0 && (
              <div className="space-y-3">
                {activity.steps.map((step, index) => {
                  const done = completedSteps.has(step.id);
                  return (
                    <Card
                      key={step.id}
                      className={`border cursor-pointer transition-all ${
                        done
                          ? 'border-success/30 bg-success/5'
                          : 'border-primary/20 hover:border-primary/40'
                      }`}
                      onClick={() => toggleStep(step.id)}
                    >
                      <CardHeader className="pb-2 pt-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={done}
                            onCheckedChange={() => toggleStep(step.id)}
                            className="flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <CardTitle
                            className={`text-base font-medium ${
                              done ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            Step {index + 1}
                            {step.title ? `: ${step.title}` : ''}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      {step.description && (
                        <CardContent className="pt-0 pl-12">
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
