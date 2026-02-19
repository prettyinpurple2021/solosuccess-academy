import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  FileText, 
  HelpCircle, 
  ClipboardList, 
  Zap, 
  BookOpen,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Video,
  Mic,
} from 'lucide-react';
import { useAdminLessons, useAdminCourses, useUpdateLesson, Lesson, LessonType, QuizData, WorksheetData, ActivityData } from '@/hooks/useAdmin';
import { useTextbookChapters, useTextbookPages } from '@/hooks/useTextbook';
import { useToast } from '@/hooks/use-toast';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { 
  LessonContentSection,
  LessonQuizSection,
  LessonWorksheetSection,
  LessonActivitySection,
  LessonTextbookSection,
  UnsavedChangesIndicator,
} from '@/components/admin/lesson-detail';

export default function AdminLessonDetail() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { data: courses } = useAdminCourses();
  const { data: lessons, isLoading: lessonsLoading } = useAdminLessons(courseId);
  const { data: chapters } = useTextbookChapters(courseId);
  const updateLesson = useUpdateLesson();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('content');
  const [hasChanges, setHasChanges] = useState(false);

  // Local state for lesson data
  const [content, setContent] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [worksheetData, setWorksheetData] = useState<WorksheetData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);

  const course = courses?.find(c => c.id === courseId);
  const lesson = lessons?.find(l => l.id === lessonId);

  // Find textbook chapter linked to this lesson
  const linkedChapter = chapters?.find(c => c.lesson_id === lessonId);

  // Initialize state from lesson when it loads
  useState(() => {
    if (lesson) {
      setContent(lesson.content || '');
      setVideoUrl(lesson.video_url || '');
      setQuizData(lesson.quiz_data);
      setWorksheetData(lesson.worksheet_data);
      setActivityData(lesson.activity_data);
    }
  });

  // Update local state when lesson changes
  if (lesson && content === '' && !hasChanges) {
    if (lesson.content) setContent(lesson.content);
    if (lesson.video_url) setVideoUrl(lesson.video_url);
    if (lesson.quiz_data) setQuizData(lesson.quiz_data);
    if (lesson.worksheet_data) setWorksheetData(lesson.worksheet_data);
    if (lesson.activity_data) setActivityData(lesson.activity_data);
  }

  // Browser beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Ctrl+S / Cmd+S keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !updateLesson.isPending) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, updateLesson.isPending, content, videoUrl, quizData, worksheetData, activityData]);

  if (lessonsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="p-6 md:p-8 lg:p-12">
        <Card className="max-w-md mx-auto glass-card">
          <CardHeader>
            <CardTitle>Lesson Not Found</CardTitle>
            <CardDescription>The lesson you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="neon" onClick={() => navigate('/admin')}>
              Back to Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateLesson.mutateAsync({
        lessonId: lesson.id,
        courseId: courseId!,
        updates: {
          content: content || null,
          video_url: videoUrl || null,
          quiz_data: quizData,
          worksheet_data: worksheetData,
          activity_data: activityData,
        },
      });
      setHasChanges(false);
      toast({ title: 'Lesson saved successfully!' });
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async () => {
    try {
      await updateLesson.mutateAsync({
        lessonId: lesson.id,
        courseId: courseId!,
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

  const lessonTypeIcon = {
    text: FileText,
    video: Video,
    quiz: HelpCircle,
    worksheet: ClipboardList,
    activity: Zap,
    assignment: FileText,
  };

  const LessonIcon = lessonTypeIcon[lesson.type] || FileText;

  const getSmartPrompt = (contentType: string) => {
    const baseContext = `Course: "${course.title}"\nLesson: "${lesson.title}"`;
    
    switch (contentType) {
      case 'content':
        return `Create comprehensive lesson content for:\n${baseContext}\n\nMake it practical and actionable for solo entrepreneurs. Include:\n- Key concepts and explanations\n- Real-world examples\n- Action steps the learner can take immediately`;
      case 'quiz':
        return `Create a quiz to assess understanding of:\n${baseContext}\n\nInclude 5 multiple-choice questions that test:\n- Key concepts from the lesson\n- Practical application\n- Common misconceptions`;
      case 'worksheet':
        return `Create a practical worksheet for:\n${baseContext}\n\nInclude:\n- Reflection questions\n- Fill-in-the-blank exercises\n- Action planning sections`;
      case 'activity':
        return `Create a hands-on activity for:\n${baseContext}\n\nInclude:\n- Clear objectives\n- Step-by-step instructions\n- Expected deliverables\n- Estimated time to complete`;
      case 'textbook':
        return `Create textbook content for:\n${baseContext}\n\nInclude:\n- Detailed explanations\n- Examples and case studies\n- An embedded quiz question`;
      default:
        return baseContext;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="hover:bg-primary/10 hover:text-primary shrink-0"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CourseBreadcrumb
            segments={[
              { label: 'Admin', href: '/admin' },
              { label: course?.title || 'Course', href: '/admin' },
              { label: lesson?.title || 'Lesson' },
            ]}
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
              <LessonIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold neon-text">{lesson.title}</h1>
                <Badge 
                  variant={lesson.is_published ? 'default' : 'secondary'}
                  className={lesson.is_published 
                    ? 'bg-success/20 text-success border-success/30' 
                    : 'bg-muted/50 text-muted-foreground border-muted-foreground/30'}
                >
                  {lesson.is_published ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="outline" className="border-secondary/50 text-secondary capitalize">
                  {lesson.type}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {course.title} • Lesson {lesson.order_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleTogglePublish}
              disabled={updateLesson.isPending}
              className={lesson.is_published 
                ? 'border-warning/50 hover:border-warning hover:bg-warning/10 hover:text-warning' 
                : 'border-success/50 hover:border-success hover:bg-success/10 hover:text-success'}
            >
              {lesson.is_published ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
            <Button
              variant="neon"
              onClick={handleSave}
              disabled={updateLesson.isPending || !hasChanges}
            >
              {updateLesson.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Separator className="bg-primary/20" />

      {/* Content Sections Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-background/50 border border-primary/30 backdrop-blur-md grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger 
            value="content"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2 relative"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Lecture</span>
            {/* Content status dot */}
            {content && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success))]" title="Has content" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="quiz"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2 relative"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Quiz</span>
            {quizData && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success))]" title="Has quiz" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="worksheet"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2 relative"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Worksheet</span>
            {worksheetData && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success))]" title="Has worksheet" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="activity"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2 relative"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
            {activityData && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success))]" title="Has activity" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="textbook"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2 relative"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Textbook</span>
            {linkedChapter && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-success shadow-[0_0_6px_hsl(var(--success))]" title="Has textbook" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <LessonContentSection
            lessonTitle={lesson.title}
            courseTitle={course.title}
            content={content}
            videoUrl={videoUrl}
            onContentChange={(val) => { setContent(val); setHasChanges(true); }}
            onVideoUrlChange={(val) => { setVideoUrl(val); setHasChanges(true); }}
            smartPrompt={getSmartPrompt('content')}
          />
        </TabsContent>

        <TabsContent value="quiz" className="space-y-4">
          <LessonQuizSection
            lessonTitle={lesson.title}
            courseTitle={course.title}
            quizData={quizData}
            onQuizDataChange={(val) => { setQuizData(val); setHasChanges(true); }}
            smartPrompt={getSmartPrompt('quiz')}
          />
        </TabsContent>

        <TabsContent value="worksheet" className="space-y-4">
          <LessonWorksheetSection
            lessonTitle={lesson.title}
            courseTitle={course.title}
            worksheetData={worksheetData}
            onWorksheetDataChange={(val) => { setWorksheetData(val); setHasChanges(true); }}
            smartPrompt={getSmartPrompt('worksheet')}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <LessonActivitySection
            lessonTitle={lesson.title}
            courseTitle={course.title}
            activityData={activityData}
            onActivityDataChange={(val) => { setActivityData(val); setHasChanges(true); }}
            smartPrompt={getSmartPrompt('activity')}
          />
        </TabsContent>

        <TabsContent value="textbook" className="space-y-4">
          <LessonTextbookSection
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            courseId={courseId!}
            courseTitle={course.title}
            linkedChapter={linkedChapter}
            smartPrompt={getSmartPrompt('textbook')}
          />
        </TabsContent>
      </Tabs>

      {/* Sticky Unsaved Changes Indicator */}
      <UnsavedChangesIndicator
        hasChanges={hasChanges}
        isSaving={updateLesson.isPending}
        onSave={handleSave}
      />
    </div>
  );
}
