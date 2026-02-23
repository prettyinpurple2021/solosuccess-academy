/**
 * @file ActivityStepPlayer.tsx — Interactive Step-by-Step Activity Player
 *
 * Renders activity-type lessons as a guided, step-by-step progression.
 * Students work through each step, mark it complete, and see their
 * progress visually. Supports both the admin multi-activity format
 * ({ activities: [...] }) and the flat array format ([{ step_number, ... }]).
 *
 * FEATURES:
 * - Numbered step cards with expand/collapse
 * - Per-step completion tracking (local state)
 * - Progress bar showing overall activity completion
 * - Activity type badges (reflection, exercise, case-study, brainstorm)
 * - Smooth Framer Motion animations
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Zap,
  Lightbulb,
  PenLine,
  BookOpen,
  Brain,
} from 'lucide-react';

/* ── Type Definitions ─────────────────────────── */

/** Normalised step shape used internally by the player */
interface NormalisedStep {
  id: string;
  title: string;
  description: string;
}

/** Normalised activity used internally */
interface NormalisedActivity {
  id: string;
  title: string;
  instructions: string;
  type: string;
  steps: NormalisedStep[];
  objectives?: string[];
  reflection?: string;
}

interface ActivityStepPlayerProps {
  /**
   * Raw activity_data from the lesson.
   * Accepts BOTH formats:
   *  - Admin multi-activity: { activities: SingleActivity[] }
   *  - Flat array:           ActivityStep[]
   */
  activityData: any;
}

/* ── Helpers ──────────────────────────────────── */

/** Return an icon for the activity type */
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'reflection':
      return <Lightbulb className="h-4 w-4" />;
    case 'exercise':
      return <PenLine className="h-4 w-4" />;
    case 'case-study':
      return <BookOpen className="h-4 w-4" />;
    case 'brainstorm':
      return <Brain className="h-4 w-4" />;
    default:
      return <Zap className="h-4 w-4" />;
  }
};

/** Normalise all data formats into a consistent shape */
function normaliseActivities(raw: any): NormalisedActivity[] {
  if (!raw) return [];

  // Admin format: { activities: [...] }
  if (raw.activities && Array.isArray(raw.activities)) {
    return raw.activities.map((a: any, aIdx: number) => ({
      id: a.id || `activity-${aIdx}`,
      title: a.title || `Activity ${aIdx + 1}`,
      instructions: a.instructions || a.description || '',
      type: a.type || 'exercise',
      steps: (a.steps || []).map((s: any, sIdx: number) => ({
        id: s.id || `step-${aIdx}-${sIdx}`,
        title: s.title || `Step ${sIdx + 1}`,
        description: s.description || s.instructions || '',
      })),
    }));
  }

  // Flat array format: [{ step_number, title, instructions }]
  if (Array.isArray(raw)) {
    const steps: NormalisedStep[] = raw.map((s: any, i: number) => ({
      id: `step-${i}`,
      title: s.title || `Step ${s.step_number || i + 1}`,
      description: s.instructions || s.description || '',
    }));
    return [{
      id: 'activity-0',
      title: 'Activity',
      instructions: '',
      type: 'exercise',
      steps,
    }];
  }

  // AI-generated flat object format: { title, description, steps: [...], objectives, reflection }
  if (raw.title && raw.steps && Array.isArray(raw.steps)) {
    const steps: NormalisedStep[] = raw.steps.map((s: any, i: number) => ({
      id: `step-${i}`,
      title: s.title || `Step ${s.stepNumber || i + 1}`,
      description: s.instructions || s.description || '',
    }));
    return [{
      id: 'activity-0',
      title: raw.title,
      instructions: raw.description || '',
      type: 'exercise',
      steps,
      reflection: raw.reflection || '',
      objectives: raw.objectives || [],
    } as NormalisedActivity];
  }

  return [];
}

/* ── Component ────────────────────────────────── */

export function ActivityStepPlayer({ activityData }: ActivityStepPlayerProps) {
  const activities = useMemo(() => normaliseActivities(activityData), [activityData]);

  // Track which steps the student has completed (keyed by step id)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Track which step is currently expanded
  const [expandedStep, setExpandedStep] = useState<string | null>(
    activities[0]?.steps[0]?.id || null
  );

  // Track which activity is active (for multi-activity)
  const [activeActivityIdx, setActiveActivityIdx] = useState(0);

  if (activities.length === 0) return null;

  const currentActivity = activities[activeActivityIdx];
  const totalSteps = currentActivity.steps.length;
  const completedCount = currentActivity.steps.filter(s => completedSteps.has(s.id)).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  /** Toggle a step's completion status */
  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
        // Auto-expand next incomplete step
        const currentIdx = currentActivity.steps.findIndex(s => s.id === stepId);
        const nextIncomplete = currentActivity.steps.find(
          (s, i) => i > currentIdx && !next.has(s.id)
        );
        if (nextIncomplete) setExpandedStep(nextIncomplete.id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Activity Tabs — only shown when there are multiple activities */}
      {activities.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {activities.map((a, idx) => (
            <Button
              key={a.id}
              variant={activeActivityIdx === idx ? 'neon' : 'outline'}
              size="sm"
              onClick={() => { setActiveActivityIdx(idx); setExpandedStep(a.steps[0]?.id || null); }}
              className="gap-2"
            >
              {getTypeIcon(a.type)}
              {a.title}
            </Button>
          ))}
        </div>
      )}

      {/* Activity Header */}
      <Card className="glass-card border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
              {getTypeIcon(currentActivity.type)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold">{currentActivity.title}</h3>
              <Badge variant="outline" className="mt-1 border-primary/40 text-xs">
                {currentActivity.type}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{completedCount}</span>
              <span className="text-muted-foreground">/{totalSteps}</span>
              <p className="text-xs text-muted-foreground">steps done</p>
            </div>
          </div>

          {/* Instructions */}
          {currentActivity.instructions && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentActivity.instructions}
            </p>
          )}

          {/* Learning Objectives */}
          {currentActivity.objectives && currentActivity.objectives.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-2">🎯 Learning Objectives</p>
              <ul className="space-y-1">
                {currentActivity.objectives.map((obj, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-3 space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progressPercent}% complete</p>
          </div>
        </CardHeader>
      </Card>

      {/* Step Cards */}
      <div className="space-y-3">
        {currentActivity.steps.map((step, idx) => {
          const isComplete = completedSteps.has(step.id);
          const isExpanded = expandedStep === step.id;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className={`transition-all duration-300 border ${
                  isComplete
                    ? 'border-success/40 bg-success/5'
                    : isExpanded
                    ? 'border-primary/40 bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.1)]'
                    : 'border-border/50 hover:border-primary/30'
                }`}
              >
                {/* Step Header — clickable to expand */}
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                  aria-expanded={isExpanded}
                  aria-label={`Step ${idx + 1}: ${step.title}`}
                >
                  {/* Step Number */}
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isComplete
                        ? 'bg-success text-success-foreground'
                        : 'bg-primary/20 text-primary'
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>

                  {/* Title */}
                  <span
                    className={`flex-1 font-medium transition-colors ${
                      isComplete ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {step.title}
                  </span>

                  {/* Expand/Collapse Chevron */}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Expandable Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="pt-0 pb-4 px-4 ml-11">
                        {/* Step Description */}
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4">
                          {step.description}
                        </p>

                        {/* Mark Complete Button */}
                        <Button
                          variant={isComplete ? 'outline' : 'neon'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStep(step.id);
                          }}
                          className="gap-2"
                        >
                          {isComplete ? (
                            <>
                              <Circle className="h-4 w-4" />
                              Undo
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Mark Step Complete
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Completion Celebration */}
      <AnimatePresence>
        {completedCount === totalSteps && totalSteps > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-6 text-center border-success/30 shadow-[0_0_30px_hsl(var(--success)/0.2)]"
          >
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
            <h3 className="text-lg font-display font-bold text-success">Activity Complete! 🎉</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You've finished all {totalSteps} steps. Great work!
            </p>

            {/* Reflection prompt — shown after completion */}
            {currentActivity.reflection && (
              <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 text-left">
                <p className="text-xs font-semibold text-primary mb-2">💭 Reflection</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{currentActivity.reflection}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
