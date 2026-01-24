import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type Lesson } from '@/lib/courseData';
import { type UserProgress } from '@/hooks/useProgress';
import { CheckCircle2, FileText, Video, Sparkles, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string;
  courseId: string;
  progress: UserProgress[];
}

export function LessonSidebar({ lessons, currentLessonId, courseId, progress }: LessonSidebarProps) {
  const completedLessonIds = new Set(
    progress.filter(p => p.completed).map(p => p.lesson_id)
  );

  const getTypeIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'video':
        return <Video className="h-3.5 w-3.5" />;
      case 'quiz':
        return <Sparkles className="h-3.5 w-3.5" />;
      case 'assignment':
        return <PenLine className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="h-full flex flex-col border-r bg-muted/30">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Course Content</h3>
        <p className="text-sm text-muted-foreground">
          {completedLessonIds.size} of {lessons.length} completed
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessonIds.has(lesson.id);
            const isCurrent = lesson.id === currentLessonId;

            return (
              <Button
                key={lesson.id}
                variant={isCurrent ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start h-auto py-3 px-3',
                  isCurrent && 'bg-primary/10 border-l-2 border-primary'
                )}
                asChild
              >
                <Link to={`/courses/${courseId}/lessons/${lesson.id}`}>
                  <div className="flex items-start gap-3 w-full">
                    <div
                      className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs',
                        isCompleted
                          ? 'bg-success text-success-foreground'
                          : isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted-foreground/20 text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(lesson.type)}
                        <span className={cn(
                          'text-sm font-medium truncate',
                          isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {lesson.title}
                        </span>
                      </div>
                      {lesson.duration_minutes && (
                        <span className="text-xs text-muted-foreground">
                          {lesson.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
