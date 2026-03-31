/**
 * @file ActivityViewer.tsx — Student-facing activity step player
 *
 * Renders a structured activity with instructions and checkable steps.
 * Students click steps to mark them complete; progress is tracked locally
 * in component state. Features visual flair with gradient borders, glow
 * effects, and animated step numbers.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Target, BookOpen, Zap, CheckCircle2, Circle } from 'lucide-react';
import type { ActivityData } from '@/lib/courseData';

interface ActivityViewerProps {
  activityData: ActivityData;
  /** Called with completion percentage (0-100) when steps change */
  onProgressChange?: (score: number) => void;
  /** Previously saved activity score to restore step state */
  initialScore?: number | null;
}

const TYPE_CONFIG = {
  reflection: { icon: Lightbulb, label: 'Reflection', color: 'secondary', emoji: '🪞' },
  exercise: { icon: Target, label: 'Exercise', color: 'primary', emoji: '🎯' },
  'case-study': { icon: BookOpen, label: 'Case Study', color: 'accent', emoji: '📖' },
  brainstorm: { icon: Zap, label: 'Brainstorm', color: 'success', emoji: '⚡' },
} as const;

export function ActivityViewer({ activityData, onProgressChange, initialScore }: ActivityViewerProps) {
  const activities = activityData.activities ?? [];
  const allSteps = activities.flatMap((a) => a.steps);
  const totalSteps = allSteps.length;

  // Restore completed steps from initialScore if available
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => {
    if (initialScore != null && initialScore > 0 && totalSteps > 0) {
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
      const newPct = totalSteps > 0 ? Math.round((next.size / totalSteps) * 100) : 0;
      onProgressChange?.(newPct);
      return next;
    });
  };

  const doneSteps = completedSteps.size;
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Overall progress — decorative progress header */}
      {totalSteps > 0 && (
        <div className="lesson-section-frame">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.15)]">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Activity Progress</span>
            </div>
            <span className="font-mono font-bold text-primary text-lg">
              {doneSteps}/{totalSteps}
            </span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
          {progressPct === 100 && (
            <div className="mt-3 flex items-center gap-2 text-success text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">All steps completed! 🎉</span>
            </div>
          )}
        </div>
      )}

      {activities.map((activity) => {
        const config =
          TYPE_CONFIG[activity.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.exercise;
        const Icon = config.icon;

        return (
          <div key={activity.id} className="space-y-4">
            {/* Activity header — chrome-styled with icon and badge */}
            <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-primary/15">
              <div className={`h-10 w-10 rounded-lg bg-${config.color}/15 border border-${config.color}/30 flex items-center justify-center shadow-[0_0_15px_hsl(var(--${config.color})/0.15)]`}>
                <span className="text-lg">{config.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-lg tracking-wide">
                  {activity.title}
                </h3>
              </div>
              <Badge
                variant="outline"
                className={`text-xs border-${config.color}/30 bg-${config.color}/5 text-${config.color}`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>

            {/* Instructions — styled callout */}
            {activity.instructions && (
              <div className="bg-muted/30 border border-border/50 rounded-lg p-4 text-muted-foreground leading-relaxed text-sm">
                <span className="font-semibold text-foreground/80 mr-1">📋 Instructions:</span>
                {activity.instructions}
              </div>
            )}

            {/* Steps — interactive cards with step numbers and glow */}
            {activity.steps.length > 0 && (
              <div className="space-y-3 pl-1">
                {activity.steps.map((step, index) => {
                  const done = completedSteps.has(step.id);
                  return (
                    <div
                      key={step.id}
                      className={`group flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                        done
                          ? 'border-success/30 bg-success/5 shadow-[0_0_15px_hsl(var(--success)/0.08)]'
                          : 'border-border/50 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_20px_hsl(var(--primary)/0.06)]'
                      }`}
                      onClick={() => toggleStep(step.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleStep(step.id)}
                    >
                      {/* Animated step number */}
                      <div className={`activity-step-number ${done ? 'completed' : ''}`}>
                        {done ? '✓' : index + 1}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-medium text-sm ${
                              done ? 'line-through text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            {step.title || `Step ${index + 1}`}
                          </h4>
                        </div>
                        {step.description && (
                          <p className={`text-sm mt-1 leading-relaxed ${
                            done ? 'text-muted-foreground/60' : 'text-muted-foreground'
                          }`}>
                            {step.description}
                          </p>
                        )}
                      </div>

                      {/* Checkbox */}
                      <Checkbox
                        checked={done}
                        onCheckedChange={() => toggleStep(step.id)}
                        className="flex-shrink-0 mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
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
