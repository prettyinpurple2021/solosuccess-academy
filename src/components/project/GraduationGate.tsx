/**
 * @file GraduationGate.tsx — Prerequisite Checker for Course 10
 * 
 * Displays a visual checklist of all 9 prerequisite courses showing
 * completion status. When all courses are complete, shows a success
 * state with a button to proceed to the graduation project.
 * 
 * WHY: Course 10 is the capstone — students must prove they've completed
 * the entire curriculum before accessing the final portfolio project.
 */
import { CheckCircle2, Circle, Lock, Award, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GraduationGateResult } from '@/hooks/useGraduationGate';

interface GraduationGateProps {
  gate: GraduationGateResult;
}

export function GraduationGate({ gate }: GraduationGateProps) {
  const totalCourses = gate.courses.length;
  const progressPct = totalCourses > 0 
    ? Math.round((gate.completedCourseCount / totalCourses) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Gate Header */}
      <Card className={cn(
        "glass-card overflow-hidden transition-all",
        gate.isUnlocked 
          ? "border-success/40 bg-success/5" 
          : "border-warning/40 bg-warning/5"
      )}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center shrink-0 transition-all",
              gate.isUnlocked
                ? "bg-success/20 shadow-[0_0_25px_hsl(var(--success)/0.4)]"
                : "bg-warning/20 shadow-[0_0_25px_hsl(var(--warning)/0.4)]"
            )}>
              {gate.isUnlocked ? (
                <Sparkles className="h-7 w-7 text-success" />
              ) : (
                <Lock className="h-7 w-7 text-warning" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold neon-text">
                {gate.isUnlocked ? 'Graduation Unlocked!' : 'Graduation Prerequisites'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {gate.isUnlocked
                  ? 'You\'ve completed all prerequisite courses. You may now begin your graduation project!'
                  : `Complete all 9 courses to unlock the graduation project. ${gate.completedCourseCount}/${totalCourses} complete.`
                }
              </p>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{gate.completedCourseCount} of {totalCourses} courses</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress 
                  value={progressPct} 
                  className="h-2" 
                  style={{ boxShadow: gate.isUnlocked ? '0 0 10px hsl(var(--success)/0.5)' : undefined }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Checklist */}
      <div className="grid gap-2">
        {gate.courses.map((course) => (
          <div
            key={course.courseId}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all",
              course.isComplete
                ? "border-success/20 bg-success/5"
                : "border-muted/30 bg-muted/5 opacity-80"
            )}
          >
            {/* Status icon */}
            {course.isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 drop-shadow-[0_0_6px_hsl(var(--success)/0.5)]" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            )}

            {/* Course info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {String(course.orderNumber).padStart(2, '0')}
                </span>
                <span className={cn(
                  "text-sm font-medium truncate",
                  course.isComplete ? "text-foreground" : "text-muted-foreground"
                )}>
                  {course.courseTitle}
                </span>
              </div>
              {!course.isComplete && course.totalLessons > 0 && (
                <p className="text-xs text-muted-foreground/60 ml-7">
                  {course.completedLessons}/{course.totalLessons} lessons
                </p>
              )}
            </div>

            {/* Badges */}
            {course.hasCertificate && (
              <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px] shrink-0">
                <Award className="h-3 w-3 mr-1" />
                Certified
              </Badge>
            )}
            {course.isComplete && !course.hasCertificate && (
              <Badge className="bg-success/20 text-success border-success/30 text-[10px] shrink-0">
                Complete
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
