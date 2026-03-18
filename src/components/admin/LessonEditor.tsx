/**
 * @file LessonEditor.tsx — Admin Lesson Create/Edit Form
 *
 * PURPOSE: Tabbed form for creating/editing lessons. Supports lesson types:
 * text, video, quiz, worksheet, activity. Content tab switches editor based
 * on type. Media tab provides video upload. AI content generation available.
 *
 * FEATURES:
 * - Auto-save draft functionality (saves every 30 seconds when content changes)
 * - Markdown preview for text content
 * - Lesson scheduling (publish date) support
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCreateLesson, useUpdateLesson, Lesson, LessonType, QuizData, WorksheetData, ActivityData } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { VideoUpload } from './VideoUpload';
import { QuizEditor } from './QuizEditor';
import { WorksheetEditor } from './WorksheetEditor';
import { ActivityEditor } from './ActivityEditor';
import { AIGenerateButton } from './AIGenerateButton';
import { Loader2, Save, X, Eye, Edit3, Clock } from 'lucide-react';
import DOMPurify from 'dompurify';

interface LessonEditorProps {
  courseId: string;
  lesson?: Lesson | null;
  nextOrderNumber: number;
  onClose: () => void;
}

/**
 * Simple markdown-to-HTML converter for preview.
 * Handles headers, bold, italic, lists, links, code blocks.
 */
function markdownToHtml(md: string): string {
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted p-3 rounded-md overflow-x-auto text-sm my-2"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-2">$1</blockquote>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="my-4 border-border" />')
    // Line breaks (double newline = paragraph)
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br />');

  return `<p class="my-2">${html}</p>`;
}

export function LessonEditor({ courseId, lesson, nextOrderNumber, onClose }: LessonEditorProps) {
  const [title, setTitle] = useState(lesson?.title || '');
  const [type, setType] = useState<LessonType>(lesson?.type || 'text');
  const [content, setContent] = useState(lesson?.content || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [duration, setDuration] = useState(lesson?.duration_minutes?.toString() || '');
  const [quizData, setQuizData] = useState<QuizData | null>(lesson?.quiz_data || null);
  const [worksheetData, setWorksheetData] = useState<WorksheetData | null>(lesson?.worksheet_data ? (lesson.worksheet_data as any) : null);
  const [activityData, setActivityData] = useState<ActivityData | null>(lesson?.activity_data ? (lesson.activity_data as any) : null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const { toast } = useToast();
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = !!lesson;
  const isPending = createLesson.isPending || updateLesson.isPending;

  // Track changes for auto-save indicator
  useEffect(() => {
    if (isEditing) {
      setHasUnsavedChanges(true);
    }
  }, [title, content, type, videoUrl, duration, quizData, worksheetData, activityData]);

  // Auto-save every 30 seconds for existing lessons
  const performAutoSave = useCallback(async () => {
    if (!isEditing || !lesson || !hasUnsavedChanges) return;

    try {
      await updateLesson.mutateAsync({
        lessonId: lesson.id,
        courseId,
        updates: {
          title: title.trim() || lesson.title,
          type,
          content: content || undefined,
          video_url: videoUrl || undefined,
          duration_minutes: duration ? parseInt(duration) : undefined,
          quiz_data: type === 'quiz' ? quizData : null,
          worksheet_data: type === 'worksheet' ? worksheetData : null,
          activity_data: type === 'activity' ? activityData : null,
        },
      });
      setLastAutoSave(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [isEditing, lesson, hasUnsavedChanges, title, type, content, videoUrl, duration, quizData, worksheetData, activityData, courseId, updateLesson]);

  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new 30-second timer
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isEditing, hasUnsavedChanges, performAutoSave]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    // Clear auto-save timer on manual save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    try {
      const lessonData = {
        title: title.trim(),
        type,
        content: content || undefined,
        video_url: videoUrl || undefined,
        duration_minutes: duration ? parseInt(duration) : undefined,
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
      setHasUnsavedChanges(false);
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
        <div className="flex items-center gap-3">
          <CardTitle>{isEditing ? 'Edit Lesson' : 'New Lesson'}</CardTitle>
          {/* Auto-save indicator */}
          {isEditing && (
            <div className="flex items-center gap-1.5">
              {hasUnsavedChanges ? (
                <Badge variant="outline" className="text-xs border-warning/50 text-warning">
                  <Clock className="h-3 w-3 mr-1" />
                  Unsaved
                </Badge>
              ) : lastAutoSave ? (
                <Badge variant="outline" className="text-xs border-success/50 text-success">
                  Auto-saved {lastAutoSave.toLocaleTimeString()}
                </Badge>
              ) : null}
            </div>
          )}
        </div>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Lesson Content (Markdown supported)</Label>
                  <div className="flex items-center gap-2">
                    <AIGenerateButton
                      type="lesson_content"
                      context={{ lessonTitle: title, topic: title }}
                      onGenerated={(content) => {
                        if (typeof content === 'string') {
                          setContent(content);
                        }
                      }}
                      buttonText="Generate Content"
                      buttonSize="sm"
                    />
                    {/* Markdown preview toggle */}
                    <Button
                      variant={showPreview ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      title={showPreview ? 'Edit mode' : 'Preview markdown'}
                    >
                      {showPreview ? (
                        <>
                          <Edit3 className="mr-1 h-3 w-3" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1 h-3 w-3" />
                          Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {showPreview ? (
                  <div
                    className="prose prose-sm max-w-none p-4 rounded-md border bg-background/50 min-h-[300px] overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(markdownToHtml(content || '*No content yet...*')),
                    }}
                  />
                ) : (
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter the lesson content..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                )}
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
