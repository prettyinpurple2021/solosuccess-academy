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
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl">
      <div className="p-4 border-b border-primary/20">
        <h3 className="font-display font-semibold text-cyan-300">Course Content</h3>
        <p className="text-sm text-muted-foreground">
          <span className="text-primary">{completedLessonIds.size}</span> of {lessons.length} completed
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
                variant="ghost"
                className={cn(
                  'w-full justify-start h-auto py-3 px-3 transition-all duration-300',
                  isCurrent 
                    ? 'bg-primary/20 border-l-2 border-primary shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]' 
                    : 'hover:bg-primary/10 border-l-2 border-transparent',
                  isCompleted && !isCurrent && 'border-l-green-500/50'
                )}
                asChild
              >
                <Link to={`/courses/${courseId}/lessons/${lesson.id}`}>
                  <div className="flex items-start gap-3 w-full">
                    <div
                      className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-all',
                        isCompleted
                          ? 'bg-green-500/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                          : isCurrent
                            ? 'bg-primary/30 text-primary shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                            : 'bg-muted/30 text-muted-foreground'
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
                        <span className={cn(
                          'transition-colors',
                          isCurrent ? 'text-cyan-400' : isCompleted ? 'text-green-400/70' : 'text-muted-foreground'
                        )}>
                          {getTypeIcon(lesson.type)}
                        </span>
                        <span className={cn(
                          'text-sm font-medium truncate',
                          isCurrent ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {lesson.title}
                        </span>
                      </div>
                      {lesson.duration_minutes && (
                        <span className="text-xs text-muted-foreground/70">
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