import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminLessons, useDeleteLesson, Lesson } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { LessonEditor } from './LessonEditor';
import { 
  Plus, 
  Loader2, 
  FileText, 
  Video, 
  HelpCircle, 
  FileSpreadsheet, 
  Zap,
  Pencil,
  Trash2,
  GripVertical,
  Clock
} from 'lucide-react';

interface LessonListProps {
  courseId: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  quiz: <HelpCircle className="h-4 w-4" />,
  worksheet: <FileSpreadsheet className="h-4 w-4" />,
  activity: <Zap className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  text: 'Lecture',
  video: 'Video',
  quiz: 'Quiz',
  worksheet: 'Worksheet',
  activity: 'Activity',
};

export function LessonList({ courseId }: LessonListProps) {
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { data: lessons, isLoading } = useAdminLessons(courseId);
  const deleteLesson = useDeleteLesson();
  const { toast } = useToast();

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return;

    try {
      await deleteLesson.mutateAsync({ lessonId: lesson.id, courseId });
      toast({ title: 'Lesson deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nextOrderNumber = (lessons?.length || 0) + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lessons ({lessons?.length || 0})</h3>
        {!isCreating && !editingLesson && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lesson
          </Button>
        )}
      </div>

      {(isCreating || editingLesson) && (
        <LessonEditor
          courseId={courseId}
          lesson={editingLesson}
          nextOrderNumber={nextOrderNumber}
          onClose={() => {
            setIsCreating(false);
            setEditingLesson(null);
          }}
        />
      )}

      {!isCreating && !editingLesson && (
        <div className="space-y-2">
          {lessons?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No lessons yet</h4>
                <p className="text-muted-foreground mb-4">
                  Start building your course by adding the first lesson.
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Lesson
                </Button>
              </CardContent>
            </Card>
          ) : (
            lessons?.map((lesson, index) => (
              <Card key={lesson.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    
                    <span className="text-sm font-medium text-muted-foreground w-8">
                      {index + 1}.
                    </span>

                    <div className="flex items-center gap-2">
                      {typeIcons[lesson.type]}
                      <Badge variant="secondary" className="text-xs">
                        {typeLabels[lesson.type]}
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{lesson.title}</h4>
                    </div>

                    {lesson.duration_minutes && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {lesson.duration_minutes}m
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingLesson(lesson)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(lesson)}
                        disabled={deleteLesson.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
