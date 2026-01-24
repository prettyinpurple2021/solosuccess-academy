import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateLesson, useUpdateLesson, Lesson, LessonType, QuizData, WorksheetData, ActivityData } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { VideoUpload } from './VideoUpload';
import { QuizEditor } from './QuizEditor';
import { WorksheetEditor } from './WorksheetEditor';
import { ActivityEditor } from './ActivityEditor';
import { Loader2, Save, X } from 'lucide-react';

interface LessonEditorProps {
  courseId: string;
  lesson?: Lesson | null;
  nextOrderNumber: number;
  onClose: () => void;
}

export function LessonEditor({ courseId, lesson, nextOrderNumber, onClose }: LessonEditorProps) {
  const [title, setTitle] = useState(lesson?.title || '');
  const [type, setType] = useState<LessonType>(lesson?.type || 'text');
  const [content, setContent] = useState(lesson?.content || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [duration, setDuration] = useState(lesson?.duration_minutes?.toString() || '');
  const [quizData, setQuizData] = useState<QuizData | null>(lesson?.quiz_data || null);
  const [worksheetData, setWorksheetData] = useState<WorksheetData | null>(lesson?.worksheet_data || null);
  const [activityData, setActivityData] = useState<ActivityData | null>(lesson?.activity_data || null);

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const { toast } = useToast();

  const isEditing = !!lesson;
  const isPending = createLesson.isPending || updateLesson.isPending;

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      const lessonData = {
        title: title.trim(),
        type,
        content: content || null,
        video_url: videoUrl || null,
        duration_minutes: duration ? parseInt(duration) : null,
        quiz_data: type === 'quiz' ? quizData : null,
        worksheet_data: type === 'worksheet' ? worksheetData : null,
        activity_data: type === 'activity' ? activityData : null,
      };

      if (isEditing) {
        await updateLesson.mutateAsync({
          lessonId: lesson.id,
          courseId,
          updates: lessonData,
        });
        toast({ title: 'Lesson updated!' });
      } else {
        await createLesson.mutateAsync({
          course_id: courseId,
          order_number: nextOrderNumber,
          ...lessonData,
        });
        toast({ title: 'Lesson created!' });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isEditing ? 'Edit Lesson' : 'New Lesson'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Lesson Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as LessonType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text / Lecture</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="worksheet">Worksheet</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 15"
            />
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            {(type === 'text' || type === 'video') && (
              <div className="space-y-2">
                <Label htmlFor="content">Lesson Content (Markdown supported)</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the lesson content..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {type === 'quiz' && (
              <QuizEditor
                data={quizData}
                onChange={setQuizData}
              />
            )}

            {type === 'worksheet' && (
              <WorksheetEditor
                data={worksheetData}
                onChange={setWorksheetData}
              />
            )}

            {type === 'activity' && (
              <ActivityEditor
                data={activityData}
                onChange={setActivityData}
              />
            )}
          </TabsContent>

          <TabsContent value="media" className="space-y-4 mt-4">
            <VideoUpload
              courseId={courseId}
              lessonId={lesson?.id || 'new'}
              currentUrl={videoUrl}
              onUpload={setVideoUrl}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Lesson' : 'Create Lesson'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
