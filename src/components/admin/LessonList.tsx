import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminLessons, useDeleteLesson, useUpdateLesson, useReorderLessons, Lesson } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { LessonEditor } from './LessonEditor';
import { SortableLessonItem } from './SortableLessonItem';
import { Plus, FileText } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

interface LessonListProps {
  courseId: string;
}

export function LessonList({ courseId }: LessonListProps) {
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { data: lessons, isLoading } = useAdminLessons(courseId);
  const deleteLesson = useDeleteLesson();
  const updateLesson = useUpdateLesson();
  const reorderLessons = useReorderLessons();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !lessons) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedLessons = arrayMove(lessons, oldIndex, newIndex);
    const updates = reorderedLessons.map((lesson, index) => ({
      id: lesson.id,
      order_number: index + 1,
    }));

    try {
      await reorderLessons.mutateAsync({ courseId, updates });
      toast({ title: 'Lessons reordered' });
    } catch (error: any) {
      toast({
        title: 'Failed to reorder',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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

  const toggleLessonPublish = async (lesson: Lesson) => {
    try {
      await updateLesson.mutateAsync({
        lessonId: lesson.id,
        courseId,
        updates: { is_published: !lesson.is_published },
      });
      toast({ title: lesson.is_published ? 'Lesson unpublished' : 'Lesson published!' });
    } catch (error: any) {
      toast({
        title: 'Failed to update',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={lessons?.map((l) => l.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {lessons?.map((lesson, index) => (
                    <SortableLessonItem
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      onEdit={setEditingLesson}
                      onDelete={handleDelete}
                      onTogglePublish={toggleLessonPublish}
                      isUpdating={updateLesson.isPending}
                      isDeleting={deleteLesson.isPending}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}
