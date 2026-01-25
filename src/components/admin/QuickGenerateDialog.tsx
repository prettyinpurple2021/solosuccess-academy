import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Copy, Check, Zap, Plus } from 'lucide-react';
import { useContentGenerator, ContentType, GenerateContext } from '@/hooks/useContentGenerator';
import { useCreateLesson, useAdminLessons, LessonType, QuizData, WorksheetData, ActivityData } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface QuickGenerateDialogProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string | null;
}

const contentTypeOptions = [
  { value: 'lesson_content', label: 'Lesson Content' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'activity', label: 'Activity' },
  { value: 'exam', label: 'Final Exam' },
];

const buildDefaultPrompt = (
  contentType: ContentType,
  courseTitle: string,
  courseDescription: string | null,
  topic: string,
  lessonTitle: string,
  difficulty: string,
  questionCount: number
): string => {
  const effectiveTopic = topic || courseTitle;
  switch (contentType) {
    case 'lesson_content':
      return `Create lesson content for:
Course: ${courseTitle}
Lesson Title: ${lessonTitle || effectiveTopic}
Difficulty: ${difficulty}
${effectiveTopic !== courseTitle ? `Topic focus: ${effectiveTopic}` : ''}`;
    case 'quiz':
      return `Create ${questionCount} quiz questions about:
Topic: ${effectiveTopic}
Course context: ${courseTitle}
Difficulty: ${difficulty}`;
    case 'worksheet':
      return `Create a practical worksheet for:
Topic: ${effectiveTopic}
Course: ${courseTitle}
Focus on actionable exercises that entrepreneurs can apply immediately.`;
    case 'activity':
      return `Create an interactive activity for:
Topic: ${effectiveTopic}
Course: ${courseTitle}
Make it hands-on and practical for solo entrepreneurs.`;
    case 'exam':
      return `Create a comprehensive final exam for:
Course: ${courseTitle}
Course Description: ${courseDescription || 'A course for solo entrepreneurs'}
Include ${questionCount} questions covering all major topics.`;
    default:
      return '';
  }
};

export function QuickGenerateDialog({ courseId, courseTitle, courseDescription }: QuickGenerateDialogProps) {
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('lesson_content');
  const [topic, setTopic] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const { generateContent, isGenerating } = useContentGenerator();
  const createLesson = useCreateLesson();
  const { data: existingLessons } = useAdminLessons(courseId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Update prompt when inputs change
  useEffect(() => {
    if (!showPromptEditor) {
      setCustomPrompt(buildDefaultPrompt(contentType, courseTitle, courseDescription, topic, lessonTitle, difficulty, questionCount));
    }
  }, [contentType, courseTitle, courseDescription, topic, lessonTitle, difficulty, questionCount, showPromptEditor]);

  const handleShowPromptEditor = () => {
    setCustomPrompt(buildDefaultPrompt(contentType, courseTitle, courseDescription, topic, lessonTitle, difficulty, questionCount));
    setShowPromptEditor(true);
  };

  const handleGenerate = async () => {
    const context: GenerateContext = {
      topic: topic || courseTitle,
      courseTitle,
      courseDescription: courseDescription || undefined,
      lessonTitle: lessonTitle || undefined,
      difficulty,
      questionCount: contentType === 'quiz' || contentType === 'exam' ? questionCount : undefined,
    };

    const content = await generateContent(contentType, context, customPrompt);
    if (content) {
      setGeneratedContent(content);
    }
  };

  const handleCopy = () => {
    const textContent = typeof generatedContent === 'string'
      ? generatedContent
      : JSON.stringify(generatedContent, null, 2);

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDialog = () => {
    setTopic('');
    setLessonTitle('');
    setGeneratedContent(null);
    setCopied(false);
    setIsApplying(false);
    setShowPromptEditor(false);
    setCustomPrompt('');
  };

  // Map content type to lesson type
  const getLessonType = (): LessonType => {
    switch (contentType) {
      case 'lesson_content':
        return 'text';
      case 'quiz':
      case 'exam':
        return 'quiz';
      case 'worksheet':
        return 'worksheet';
      case 'activity':
        return 'activity';
      default:
        return 'text';
    }
  };

  // Transform generated content to lesson data format
  const transformToLessonData = () => {
    if (!generatedContent) return {};

    const lessonType = getLessonType();

    if (lessonType === 'text') {
      return { content: typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent, null, 2) };
    }

    if (lessonType === 'quiz' && generatedContent.questions) {
      const quizData: QuizData = {
        questions: generatedContent.questions.map((q: any, index: number) => ({
          id: crypto.randomUUID(),
          question: q.question,
          options: q.options,
          correctAnswer: q.correctIndex,
          explanation: q.explanation,
        })),
        passingScore: generatedContent.passingScore || 70,
      };
      return { quiz_data: quizData };
    }

    if (lessonType === 'worksheet' && generatedContent.sections) {
      const worksheetData: WorksheetData = {
        instructions: generatedContent.instructions || '',
        sections: generatedContent.sections.map((s: any) => ({
          id: crypto.randomUUID(),
          title: s.title,
          prompts: s.exercises?.map((e: any) => e.prompt) || [],
        })),
      };
      return { worksheet_data: worksheetData };
    }

    if (lessonType === 'activity' && generatedContent.steps) {
      const activityData: ActivityData = {
        instructions: generatedContent.description || '',
        type: 'exercise',
        steps: generatedContent.steps.map((s: any) => ({
          id: crypto.randomUUID(),
          title: s.title,
          description: s.instructions,
        })),
      };
      return { activity_data: activityData };
    }

    return {};
  };

  const handleApplyToLesson = async () => {
    if (!generatedContent) return;

    setIsApplying(true);
    try {
      const nextOrderNumber = (existingLessons?.length || 0) + 1;
      const lessonType = getLessonType();
      const lessonData = transformToLessonData();

      const newLessonTitle = lessonTitle || topic || `AI Generated ${contentTypeOptions.find(c => c.value === contentType)?.label}`;

      await createLesson.mutateAsync({
        course_id: courseId,
        title: newLessonTitle,
        type: lessonType,
        order_number: nextOrderNumber,
        ...lessonData,
        is_published: false,
      });

      toast({
        title: 'Lesson created!',
        description: `"${newLessonTitle}" has been added to the course as a draft.`,
      });

      // Invalidate lessons query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['admin-lessons', courseId] });

      setOpen(false);
      resetDialog();
    } catch (error: any) {
      toast({
        title: 'Failed to create lesson',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetDialog();
    }
  };

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    if (typeof generatedContent === 'string') {
      return (
        <div className="prose prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
        </div>
      );
    }

    if (contentType === 'quiz' && generatedContent.questions) {
      return (
        <div className="space-y-3">
          {generatedContent.questions.map((q: any, i: number) => (
            <div key={i} className="p-3 border border-border/50 rounded-lg">
              <p className="font-medium text-sm">Q{i + 1}: {q.question}</p>
              <div className="mt-2 space-y-1">
                {q.options.map((opt: string, j: number) => (
                  <div
                    key={j}
                    className={`text-xs p-1 rounded ${j === q.correctIndex ? 'bg-green-500/20 text-green-400' : 'text-muted-foreground'}`}
                  >
                    {String.fromCharCode(65 + j)}. {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <pre className="text-sm bg-black/30 p-4 rounded-lg overflow-auto">
        {JSON.stringify(generatedContent, null, 2)}
      </pre>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-accent/50 hover:border-accent hover:bg-accent/10 hover:text-accent"
        >
          <Zap className="mr-2 h-4 w-4" />
          Quick Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Generate for "{courseTitle}"
          </DialogTitle>
          <DialogDescription>
            Generate content directly for this course using AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-topic">
                Topic / Subject
                <Badge variant="secondary" className="ml-2 text-xs">
                  Pre-filled with course title
                </Badge>
              </Label>
              <Input
                id="quick-topic"
                placeholder={courseTitle}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the course title: "{courseTitle}"
              </p>
            </div>

            {(contentType === 'lesson_content' || contentType === 'quiz' || contentType === 'worksheet' || contentType === 'activity') && (
              <div className="space-y-2">
                <Label htmlFor="quick-lesson">Lesson Title (optional)</Label>
                <Input
                  id="quick-lesson"
                  placeholder="e.g., Getting Started with Your Brand"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                />
              </div>
            )}

            {(contentType === 'quiz' || contentType === 'exam') && (
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                />
              </div>
            )}

            {/* Editable Prompt Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>AI Prompt</Label>
                {!showPromptEditor && (
                  <Button variant="ghost" size="sm" onClick={handleShowPromptEditor}>
                    Edit Prompt
                  </Button>
                )}
              </div>
              {showPromptEditor ? (
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                  placeholder="Enter your custom prompt..."
                />
              ) : (
                <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {buildDefaultPrompt(contentType, courseTitle, courseDescription, topic, lessonTitle, difficulty, questionCount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click "Edit Prompt" to customize the AI instructions
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {contentTypeOptions.find((c) => c.value === contentType)?.label}
                </>
              )}
            </Button>
          </div>

          {/* Output Section */}
          {generatedContent && (
            <div className="flex-1 min-h-0 flex flex-col border-t border-border/50 pt-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <Label>Generated Content</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="mr-2 h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyToLesson}
                    disabled={isApplying || contentType === 'course_outline'}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-3 w-3" />
                        Apply to Lesson
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 max-h-[250px] rounded-lg border border-border/30 p-3">
                {renderGeneratedContent()}
              </ScrollArea>
              {contentType === 'course_outline' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Course outlines cannot be applied directly. Use the full Content Generator to create courses.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
