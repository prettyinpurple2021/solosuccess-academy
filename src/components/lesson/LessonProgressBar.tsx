/**
 * LessonProgressBar - A visual progress indicator showing lesson position in course
 * 
 * Displays a horizontal bar with lesson nodes, highlighting the current position
 * and completed lessons. Provides quick navigation by clicking on nodes.
 */

import { Link } from 'react-router-dom';
import { type Lesson } from '@/lib/courseData';
import { type UserProgress } from '@/hooks/useProgress';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LessonProgressBarProps {
  lessons: Lesson[];
  currentLessonId: string;
  courseId: string;
  progress: UserProgress[];
}

export function LessonProgressBar({
  lessons,
  currentLessonId,
  courseId,
  progress,
}: LessonProgressBarProps) {
  // Create a set of completed lesson IDs for quick lookup
  const completedLessonIds = new Set(
    progress.filter(p => p.completed).map(p => p.lesson_id)
  );

  const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
  const completedCount = completedLessonIds.size;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Progress text */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>
          Lesson <span className="text-primary font-semibold">{currentIndex + 1}</span> of {lessons.length}
        </span>
        <span>
          <span className="text-success font-semibold">{completedCount}</span> completed
        </span>
      </div>

      {/* Visual progress bar with nodes */}
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-muted/30 rounded-full overflow-hidden">
          {/* Completed progress fill */}
          <div 
            className="h-full bg-gradient-to-r from-success to-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Lesson nodes */}
        <div className="relative flex items-center justify-between">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessonIds.has(lesson.id);
            const isCurrent = lesson.id === currentLessonId;
            const isPast = index < currentIndex;

            return (
              <Tooltip key={lesson.id}>
                <TooltipTrigger asChild>
                  <Link
                    to={`/courses/${courseId}/lessons/${lesson.id}`}
                    className={cn(
                      // Base styles
                      'relative h-4 w-4 rounded-full flex items-center justify-center',
                      'transition-all duration-300 ease-out',
                      'hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary/50',
                    // State-based styles
                    isCompleted && 'bg-success shadow-[0_0_12px_hsl(var(--success)/0.6)]',
                    isCurrent && !isCompleted && 'bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.8)] scale-125 ring-2 ring-primary/30',
                    isPast && !isCompleted && 'bg-primary/60',
                    !isCompleted && !isCurrent && !isPast && 'bg-muted/50 border border-muted-foreground/30'
                  )}
                >
                  {isCompleted && (
                    <CheckCircle2 className="h-2.5 w-2.5 text-success-foreground" />
                  )}
                  {isCurrent && !isCompleted && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-primary/50" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="bg-black/90 border-primary/30 backdrop-blur-xl"
                >
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {isCompleted ? '✓ Completed' : isCurrent ? 'Current lesson' : `Lesson ${index + 1}`}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
