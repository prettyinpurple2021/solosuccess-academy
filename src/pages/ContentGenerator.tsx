import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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
} from 'lucide-react';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useContentGenerator, GenerateContext, ContentType } from '@/hooks/useContentGenerator';
import { useToast } from '@/hooks/use-toast';

export default function ContentGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(user?.id);
  const { generateContent, isGenerating } = useContentGenerator();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ContentType>('course_outline');
  const [topic, setTopic] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                This page is only accessible to administrators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')}>Return Home</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
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
    };

    const content = await generateContent(activeTab, context);
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

    // Default JSON display
    return (
      <pre className="text-sm bg-black/30 p-4 rounded-lg overflow-auto">
        {JSON.stringify(generatedContent, null, 2)}
      </pre>
    );
  };

  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
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
                <TabsList className="grid grid-cols-3 gap-1 h-auto">
                  {contentTypes.slice(0, 3).map((ct) => (
                    <TabsTrigger key={ct.value} value={ct.value} className="flex flex-col gap-1 p-2 h-auto">
                      <ct.icon className="h-4 w-4" />
                      <span className="text-xs">{ct.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-3 gap-1 h-auto mt-1">
                  {contentTypes.slice(3).map((ct) => (
                    <TabsTrigger key={ct.value} value={ct.value} className="flex flex-col gap-1 p-2 h-auto">
                      <ct.icon className="h-4 w-4" />
                      <span className="text-xs">{ct.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic / Subject</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Building a personal brand as a solo founder"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

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

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate {contentTypes.find(c => c.value === activeTab)?.label}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Output */}
          <Card className="glass-card border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>Review and copy your AI-generated content</CardDescription>
              </div>
              {generatedContent && (
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {generatedContent ? (
                  renderGeneratedContent()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Sparkles className="h-12 w-12 mb-4 opacity-30" />
                    <p>Generated content will appear here</p>
                    <p className="text-sm">Enter a topic and click Generate</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
