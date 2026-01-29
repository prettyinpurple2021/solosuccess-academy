import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  BookOpen,
  FileText,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { LessonEditCard, LessonData } from './LessonEditCard';
import type { GeneratedBulkCurriculum } from '@/hooks/useContentGenerator';
import { useContentGenerator } from '@/hooks/useContentGenerator';
import { useToast } from '@/hooks/use-toast';

interface CurriculumPreviewEditorProps {
  curriculum: GeneratedBulkCurriculum;
  onUpdate: (curriculum: GeneratedBulkCurriculum) => void;
  documentContent?: string;
}

export function CurriculumPreviewEditor({ curriculum, onUpdate, documentContent }: CurriculumPreviewEditorProps) {
  const [activeTab, setActiveTab] = useState('course');
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});
  const [regeneratingLessonIndex, setRegeneratingLessonIndex] = useState<number | null>(null);
  const [regeneratingChapterIndex, setRegeneratingChapterIndex] = useState<number | null>(null);
  
  const { generateContent, isGenerating } = useContentGenerator();
  const { toast } = useToast();

  const toggleChapter = (index: number) => {
    setExpandedChapters((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Course info handlers
  const handleCourseChange = (field: keyof GeneratedBulkCurriculum['course'], value: string) => {
    onUpdate({
      ...curriculum,
      course: { ...curriculum.course, [field]: value },
    });
  };

  // Lesson handlers
  const handleLessonUpdate = (index: number, lesson: LessonData) => {
    const newLessons = [...curriculum.lessons];
    newLessons[index] = lesson;
    onUpdate({ ...curriculum, lessons: newLessons });
  };

  const handleLessonDelete = (index: number) => {
    const newLessons = curriculum.lessons.filter((_, i) => i !== index);
    onUpdate({ ...curriculum, lessons: newLessons });
  };

  const handleAddLesson = () => {
    const newLesson: LessonData = {
      title: 'New Lesson',
      type: 'text',
      content: '',
    };
    onUpdate({ ...curriculum, lessons: [...curriculum.lessons, newLesson] });
  };

  // Regenerate individual lesson with AI
  const handleRegenerateLesson = async (index: number) => {
    const lesson = curriculum.lessons[index];
    setRegeneratingLessonIndex(index);
    
    try {
      let contentType: 'lesson_content' | 'quiz' | 'worksheet' | 'activity' = 'lesson_content';
      if (lesson.type === 'quiz') contentType = 'quiz';
      else if (lesson.type === 'worksheet') contentType = 'worksheet';
      else if (lesson.type === 'activity') contentType = 'activity';

      const result = await generateContent(contentType, {
        courseTitle: curriculum.course.title,
        lessonTitle: lesson.title,
        lessonType: lesson.type,
        topic: lesson.title,
        documentContent: documentContent,
      });

      if (result) {
        const newLessons = [...curriculum.lessons];
        if (contentType === 'lesson_content') {
          newLessons[index] = { ...lesson, content: result as string };
        } else if (contentType === 'quiz') {
          newLessons[index] = { ...lesson, quiz_data: result as any };
        } else if (contentType === 'worksheet') {
          newLessons[index] = { ...lesson, worksheet_data: result };
        } else if (contentType === 'activity') {
          newLessons[index] = { ...lesson, activity_data: result };
        }
        onUpdate({ ...curriculum, lessons: newLessons });
        toast({
          title: 'Lesson regenerated',
          description: `"${lesson.title}" has been regenerated with AI.`,
        });
      }
    } catch (error) {
      console.error('Failed to regenerate lesson:', error);
      toast({
        title: 'Regeneration failed',
        description: 'Could not regenerate the lesson. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRegeneratingLessonIndex(null);
    }
  };

  // Regenerate textbook chapter with AI
  const handleRegenerateChapter = async (chapterIndex: number) => {
    const chapter = curriculum.textbook_chapters[chapterIndex];
    setRegeneratingChapterIndex(chapterIndex);
    
    try {
      const result = await generateContent<{ title: string; pages: Array<{ content: string; embedded_quiz: any }> }>('textbook_chapter', {
        courseTitle: curriculum.course.title,
        chapterTitle: chapter.title,
        pageCount: chapter.pages?.length || 3,
        documentContent: documentContent,
      });

      if (result) {
        const newChapters = [...curriculum.textbook_chapters];
        newChapters[chapterIndex] = {
          ...chapter,
          title: result.title || chapter.title,
          pages: result.pages || chapter.pages,
        };
        onUpdate({ ...curriculum, textbook_chapters: newChapters });
        toast({
          title: 'Chapter regenerated',
          description: `"${chapter.title}" has been regenerated with AI.`,
        });
      }
    } catch (error) {
      console.error('Failed to regenerate chapter:', error);
      toast({
        title: 'Regeneration failed',
        description: 'Could not regenerate the chapter. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRegeneratingChapterIndex(null);
    }
  };

  // Chapter handlers
  const handleChapterTitleChange = (index: number, title: string) => {
    const newChapters = [...curriculum.textbook_chapters];
    newChapters[index] = { ...newChapters[index], title };
    onUpdate({ ...curriculum, textbook_chapters: newChapters });
  };

  const handlePageContentChange = (chapterIndex: number, pageIndex: number, content: string) => {
    const newChapters = [...curriculum.textbook_chapters];
    const newPages = [...newChapters[chapterIndex].pages];
    newPages[pageIndex] = { ...newPages[pageIndex], content };
    newChapters[chapterIndex] = { ...newChapters[chapterIndex], pages: newPages };
    onUpdate({ ...curriculum, textbook_chapters: newChapters });
  };

  const handleDeleteChapter = (index: number) => {
    const newChapters = curriculum.textbook_chapters.filter((_, i) => i !== index);
    onUpdate({ ...curriculum, textbook_chapters: newChapters });
  };

  const handleAddChapter = () => {
    const newChapter = {
      title: 'New Chapter',
      pages: [{ content: '', embedded_quiz: null }],
    };
    onUpdate({
      ...curriculum,
      textbook_chapters: [...curriculum.textbook_chapters, newChapter],
    });
  };

  // Exam handlers
  const handleExamChange = (field: string, value: any) => {
    onUpdate({
      ...curriculum,
      final_exam: { ...curriculum.final_exam, [field]: value },
    });
  };

  const handleExamQuestionChange = (qIndex: number, field: string, value: any) => {
    const newQuestions = [...curriculum.final_exam.questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], [field]: value };
    onUpdate({
      ...curriculum,
      final_exam: { ...curriculum.final_exam, questions: newQuestions },
    });
  };

  const handleExamOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const newQuestions = [...curriculum.final_exam.questions];
    const newOptions = [...newQuestions[qIndex].options];
    newOptions[optIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    onUpdate({
      ...curriculum,
      final_exam: { ...curriculum.final_exam, questions: newQuestions },
    });
  };

  const handleDeleteExamQuestion = (qIndex: number) => {
    const newQuestions = curriculum.final_exam.questions.filter((_, i) => i !== qIndex);
    onUpdate({
      ...curriculum,
      final_exam: { ...curriculum.final_exam, questions: newQuestions },
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="course" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Course
          </TabsTrigger>
          <TabsTrigger value="lessons" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Lessons ({curriculum.lessons?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="textbook" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Textbook ({curriculum.textbook_chapters?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="exam" className="text-xs">
            <GraduationCap className="h-3 w-3 mr-1" />
            Exam
          </TabsTrigger>
        </TabsList>

        {/* Course Info Tab */}
        <TabsContent value="course" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Course Title</Label>
            <Input
              value={curriculum.course.title}
              onChange={(e) => handleCourseChange('title', e.target.value)}
              placeholder="Course title"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={curriculum.course.description}
              onChange={(e) => handleCourseChange('description', e.target.value)}
              placeholder="Course description..."
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Discussion Question</Label>
            <Textarea
              value={curriculum.course.discussion_question}
              onChange={(e) => handleCourseChange('discussion_question', e.target.value)}
              placeholder="Discussion question for the course..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input
                value={curriculum.course.project_title}
                onChange={(e) => handleCourseChange('project_title', e.target.value)}
                placeholder="Project title"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Project Description</Label>
            <Textarea
              value={curriculum.course.project_description}
              onChange={(e) => handleCourseChange('project_description', e.target.value)}
              placeholder="Project description..."
              rows={3}
            />
          </div>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="mt-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {curriculum.lessons?.map((lesson, index) => (
                <LessonEditCard
                  key={index}
                  lesson={lesson}
                  index={index}
                  onUpdate={handleLessonUpdate}
                  onDelete={handleLessonDelete}
                  onRegenerate={handleRegenerateLesson}
                  isRegenerating={regeneratingLessonIndex === index}
                />
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={handleAddLesson}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Textbook Tab */}
        <TabsContent value="textbook" className="mt-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {curriculum.textbook_chapters?.map((chapter, chapterIndex) => (
                <Card key={chapterIndex} className="border-border/50">
                  <Collapsible
                    open={expandedChapters[chapterIndex]}
                    onOpenChange={() => toggleChapter(chapterIndex)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-primary/5">
                        <Badge variant="secondary" className="text-xs">
                          Ch. {chapterIndex + 1}
                        </Badge>
                        <Input
                          value={chapter.title}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleChapterTitleChange(chapterIndex, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 h-8 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">
                          {chapter.pages?.length || 0} pages
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateChapter(chapterIndex);
                          }}
                          disabled={regeneratingChapterIndex === chapterIndex}
                          title="Regenerate with AI"
                        >
                          {regeneratingChapterIndex === chapterIndex ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapterIndex);
                          }}
                          disabled={regeneratingChapterIndex === chapterIndex}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {expandedChapters[chapterIndex] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-3 space-y-2">
                        {chapter.pages?.map((page, pageIndex) => (
                          <div key={pageIndex} className="space-y-1">
                            <Label className="text-xs">Page {pageIndex + 1}</Label>
                            <Textarea
                              value={page.content}
                              onChange={(e) =>
                                handlePageContentChange(chapterIndex, pageIndex, e.target.value)
                              }
                              placeholder="Page content..."
                              rows={4}
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={handleAddChapter}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Exam Tab */}
        <TabsContent value="exam" className="mt-4">
          {curriculum.final_exam ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exam Title</Label>
                    <Input
                      value={curriculum.final_exam.title}
                      onChange={(e) => handleExamChange('title', e.target.value)}
                      placeholder="Exam title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passing Score (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={curriculum.final_exam.passingScore}
                      onChange={(e) =>
                        handleExamChange('passingScore', parseInt(e.target.value) || 70)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={curriculum.final_exam.instructions}
                    onChange={(e) => handleExamChange('instructions', e.target.value)}
                    placeholder="Exam instructions..."
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Questions ({curriculum.final_exam.questions?.length || 0})</Label>
                  {curriculum.final_exam.questions?.map((q, qIndex) => (
                    <Card key={qIndex} className="p-3 border-border/50 bg-muted/20">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <Badge variant="secondary" className="text-xs mt-1">
                            Q{qIndex + 1}
                          </Badge>
                          <Textarea
                            value={q.question}
                            onChange={(e) =>
                              handleExamQuestionChange(qIndex, 'question', e.target.value)
                            }
                            placeholder="Question..."
                            rows={2}
                            className="flex-1 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteExamQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-8">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={q.correctIndex === optIndex}
                                onChange={() =>
                                  handleExamQuestionChange(qIndex, 'correctIndex', optIndex)
                                }
                                className="accent-primary"
                              />
                              <Input
                                value={opt}
                                onChange={(e) =>
                                  handleExamOptionChange(qIndex, optIndex, e.target.value)
                                }
                                placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                className="text-sm h-8"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="pl-8">
                          <Input
                            value={q.explanation || ''}
                            onChange={(e) =>
                              handleExamQuestionChange(qIndex, 'explanation', e.target.value)
                            }
                            placeholder="Explanation..."
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No final exam generated</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
