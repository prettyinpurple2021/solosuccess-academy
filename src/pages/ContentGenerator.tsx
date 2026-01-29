import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  ClipboardList,
  Zap,
  GraduationCap,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  Edit,
  FileUp,
} from 'lucide-react';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useContentGenerator, GenerateContext, ContentType } from '@/hooks/useContentGenerator';
import { useToast } from '@/hooks/use-toast';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { DocumentUpload } from '@/components/admin/DocumentUpload';
import { useDocumentParser } from '@/hooks/useDocumentParser';

const buildDefaultPrompt = (
  contentType: ContentType,
  topic: string,
  courseTitle: string,
  courseDescription: string,
  lessonTitle: string,
  difficulty: string,
  questionCount: number
): string => {
  const base = `Topic: ${topic || '[Enter topic]'}\nDifficulty: ${difficulty}`;
  
  switch (contentType) {
    case 'course_outline':
      return `Create a comprehensive course outline for solo entrepreneurs.\n${base}\n\nInclude:\n- Engaging course title and description\n- 6-8 lessons with varied types (text, video, quiz, activity)\n- A discussion question for community engagement\n- A final project with clear deliverables`;
    
    case 'lesson_content':
      return `Create detailed lesson content.\n${base}${courseTitle ? `\nCourse: ${courseTitle}` : ''}${lessonTitle ? `\nLesson: ${lessonTitle}` : ''}\n\nMake it practical and actionable for solo founders.`;
    
    case 'quiz':
      return `Create a quiz with ${questionCount} multiple-choice questions.\n${base}${courseTitle ? `\nCourse: ${courseTitle}` : ''}${lessonTitle ? `\nLesson: ${lessonTitle}` : ''}\n\nInclude explanations for each correct answer.`;
    
    case 'worksheet':
      return `Create a practical worksheet with exercises.\n${base}${courseTitle ? `\nCourse: ${courseTitle}` : ''}${lessonTitle ? `\nLesson: ${lessonTitle}` : ''}\n\nInclude fill-in sections, reflection prompts, and action items.`;
    
    case 'activity':
      return `Create a hands-on activity with clear steps.\n${base}${courseTitle ? `\nCourse: ${courseTitle}` : ''}${lessonTitle ? `\nLesson: ${lessonTitle}` : ''}\n\nInclude objectives, step-by-step instructions, and deliverables.`;
    
    case 'exam':
      return `Create a comprehensive final exam with ${questionCount} questions.\n${base}${courseDescription ? `\nCourse Description: ${courseDescription}` : ''}\n\nCover all major course topics with varied question difficulty.`;
    
    default:
      return base;
  }
};

export default function ContentGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);
  const { generateContent, isGenerating } = useContentGenerator();
  const { toast } = useToast();
  const { documentContent, fileName, handleDocumentParsed, clearDocument } = useDocumentParser();

  const [activeTab, setActiveTab] = useState<ContentType>('course_outline');
  const [topic, setTopic] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // Update prompt when inputs change
  useEffect(() => {
    if (!showPromptEditor) {
      setCustomPrompt(buildDefaultPrompt(activeTab, topic, courseTitle, courseDescription, lessonTitle, difficulty, questionCount));
    }
  }, [activeTab, topic, courseTitle, courseDescription, lessonTitle, difficulty, questionCount, showPromptEditor]);

  const handleShowPromptEditor = () => {
    setCustomPrompt(buildDefaultPrompt(activeTab, topic, courseTitle, courseDescription, lessonTitle, difficulty, questionCount));
    setShowPromptEditor(true);
  };

  if (adminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="max-w-md glass-card">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page is only accessible to administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="neon" onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGenerate = async () => {
    const context: GenerateContext = {
      topic,
      courseTitle,
      courseDescription,
      lessonTitle,
      difficulty,
      questionCount: activeTab === 'quiz' || activeTab === 'exam' ? questionCount : undefined,
      documentContent: documentContent || undefined,
      documentFileName: fileName || undefined,
    };

    const content = await generateContent(activeTab, context, customPrompt);
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

  const contentTypes = [
    { value: 'course_outline', label: 'Course Outline', icon: BookOpen, description: 'Generate full course structure' },
    { value: 'lesson_content', label: 'Lesson Content', icon: FileText, description: 'Generate text lesson content' },
    { value: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Generate quiz questions' },
    { value: 'worksheet', label: 'Worksheet', icon: ClipboardList, description: 'Generate practical exercises' },
    { value: 'activity', label: 'Activity', icon: Zap, description: 'Generate hands-on activities' },
    { value: 'exam', label: 'Final Exam', icon: GraduationCap, description: 'Generate comprehensive exam' },
    { value: 'bulk_curriculum', label: 'Bulk Curriculum', icon: FileUp, description: 'Generate complete curriculum from document' },
  ];

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    if (typeof generatedContent === 'string') {
      return (
        <div className="prose prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
        </div>
      );
    }

    // Render structured content based on type
    if (activeTab === 'course_outline' && generatedContent.title) {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-primary">{generatedContent.title}</h3>
            <p className="text-muted-foreground mt-1">{generatedContent.description}</p>
          </div>
          
          {generatedContent.discussion_question && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">Discussion Question:</p>
              <p className="text-sm text-muted-foreground">{generatedContent.discussion_question}</p>
            </div>
          )}
          
          {generatedContent.project_title && (
            <div className="p-3 bg-secondary/10 rounded-lg">
              <p className="text-sm font-medium">{generatedContent.project_title}</p>
              <p className="text-sm text-muted-foreground">{generatedContent.project_description}</p>
            </div>
          )}
          
          {generatedContent.lessons && (
            <div className="space-y-2">
              <p className="font-medium">Lessons ({generatedContent.lessons.length}):</p>
              {generatedContent.lessons.map((lesson: any, i: number) => (
                <div key={i} className="p-2 border border-border/50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{lesson.type}</Badge>
                    <span className="font-medium text-sm">{lesson.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{lesson.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'quiz' && generatedContent.questions) {
      return (
        <div className="space-y-4">
          {generatedContent.questions.map((q: any, i: number) => (
            <div key={i} className="p-3 border border-border/50 rounded-lg">
              <p className="font-medium text-sm">Q{i + 1}: {q.question}</p>
              <div className="mt-2 space-y-1">
                {q.options.map((opt: string, j: number) => (
                  <div key={j} className={`text-xs p-1 rounded ${j === q.correctIndex ? 'bg-green-500/20 text-green-400' : 'text-muted-foreground'}`}>
                    {String.fromCharCode(65 + j)}. {opt}
                  </div>
                ))}
              </div>
              {q.explanation && (
                <p className="text-xs text-muted-foreground mt-2 italic">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Render bulk curriculum
    if (activeTab === 'bulk_curriculum' && generatedContent.course) {
      return (
        <div className="space-y-4">
          {/* Course Info */}
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
            <h3 className="text-lg font-semibold text-primary">{generatedContent.course.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{generatedContent.course.description?.substring(0, 200)}...</p>
          </div>

          {/* Lessons Summary */}
          {generatedContent.lessons && (
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Lessons ({generatedContent.lessons.length})
              </p>
              <div className="grid gap-2">
                {generatedContent.lessons.slice(0, 4).map((lesson: any, i: number) => (
                  <div key={i} className="p-2 border border-border/50 rounded text-sm">
                    <Badge variant="secondary" className="text-xs mr-2">{lesson.type}</Badge>
                    {lesson.title}
                  </div>
                ))}
                {generatedContent.lessons.length > 4 && (
                  <p className="text-xs text-muted-foreground">+{generatedContent.lessons.length - 4} more lessons...</p>
                )}
              </div>
            </div>
          )}

          {/* Textbook Chapters */}
          {generatedContent.textbook_chapters && (
            <div className="space-y-2">
              <p className="font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-secondary" />
                Textbook Chapters ({generatedContent.textbook_chapters.length})
              </p>
              <div className="grid gap-2">
                {generatedContent.textbook_chapters.map((chapter: any, i: number) => (
                  <div key={i} className="p-2 border border-border/50 rounded text-sm">
                    {chapter.title} ({chapter.pages?.length || 0} pages)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Exam */}
          {generatedContent.final_exam && (
            <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/30">
              <p className="font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-secondary" />
                {generatedContent.final_exam.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {generatedContent.final_exam.questions?.length || 0} questions • Passing score: {generatedContent.final_exam.passingScore}%
              </p>
            </div>
          )}
        </div>
      );
    }

    // Default JSON display
    return (
      <pre className="text-sm bg-black/30 p-4 rounded-lg overflow-auto">
        {JSON.stringify(generatedContent, null, 2)}
      </pre>
    );
  };

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="mb-4 hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold neon-text">AI Content Generator</h1>
            <p className="text-muted-foreground">Generate courses, lessons, quizzes, and more with AI</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel - Input */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle>Generate Content</CardTitle>
            <CardDescription>Choose content type and provide context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
              <TabsList className="grid grid-cols-4 gap-1 h-auto">
                {contentTypes.slice(0, 4).map((ct) => (
                  <TabsTrigger key={ct.value} value={ct.value} className="flex flex-col gap-1 p-2 h-auto">
                    <ct.icon className="h-4 w-4" />
                    <span className="text-xs">{ct.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsList className="grid grid-cols-4 gap-1 h-auto mt-1">
                {contentTypes.slice(4).map((ct) => (
                  <TabsTrigger key={ct.value} value={ct.value} className="flex flex-col gap-1 p-2 h-auto">
                    <ct.icon className="h-4 w-4" />
                    <span className="text-xs">{ct.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              {/* Document Upload - Required for bulk curriculum, optional for others */}
              <DocumentUpload
                onDocumentParsed={handleDocumentParsed}
                onClear={clearDocument}
                documentContent={documentContent}
                fileName={fileName}
                isLoading={isGenerating}
              />

              {activeTab === 'bulk_curriculum' && !documentContent && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/10">
                  <p className="text-sm text-primary">
                    <strong>Bulk Curriculum:</strong> Upload a document above to generate a complete curriculum including course outline, lessons, textbook chapters, and a final exam.
                  </p>
                </div>
              )}

              {activeTab !== 'bulk_curriculum' && (
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic / Subject</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Building a personal brand as a solo founder"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
              )}

              {(activeTab === 'lesson_content' || activeTab === 'quiz' || activeTab === 'worksheet' || activeTab === 'activity') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="courseTitle">Course Title (optional)</Label>
                    <Input
                      id="courseTitle"
                      placeholder="e.g., Solo Founder Essentials"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lessonTitle">Lesson Title (optional)</Label>
                    <Input
                      id="lessonTitle"
                      placeholder="e.g., Finding Your Niche"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                    />
                  </div>
                </>
              )}

              {activeTab === 'exam' && (
                <div className="space-y-2">
                  <Label htmlFor="courseDesc">Course Description</Label>
                  <Textarea
                    id="courseDesc"
                    placeholder="Describe the course content for comprehensive exam coverage..."
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
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

                {(activeTab === 'quiz' || activeTab === 'exam') && (
                  <div className="space-y-2">
                    <Label>Questions</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                    />
                  </div>
                )}
              </div>

              {/* Editable Prompt Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>AI Prompt</Label>
                  {!showPromptEditor && (
                    <Button variant="ghost" size="sm" onClick={handleShowPromptEditor}>
                      <Edit className="mr-2 h-3 w-3" />
                      Edit Prompt
                    </Button>
                  )}
                </div>
                {showPromptEditor ? (
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder="Enter your custom prompt..."
                  />
                ) : (
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/30">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                      {buildDefaultPrompt(activeTab, topic, courseTitle, courseDescription, lessonTitle, difficulty, questionCount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Click "Edit Prompt" to customize the AI instructions
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (activeTab === 'bulk_curriculum' ? !documentContent : !topic.trim())}
                className="w-full"
                size="lg"
                variant="neon"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Output */}
        <Card className="glass-card border-secondary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>Review and copy your generated content</CardDescription>
              </div>
              {generatedContent && (
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {generatedContent ? (
                renderGeneratedContent()
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                  <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                  <p>Your generated content will appear here</p>
                  <p className="text-sm">Fill in the form and click Generate</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}