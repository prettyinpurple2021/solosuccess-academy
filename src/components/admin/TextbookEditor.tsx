import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  useTextbookChapters,
  useTextbookPages,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  useCreatePage,
  useUpdatePage,
  useDeletePage,
  TextbookChapter,
  TextbookPage,
  EmbeddedQuiz,
} from '@/hooks/useTextbook';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  BookOpen,
  FileText,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Sparkles,
} from 'lucide-react';
import { TextbookGenerateDialog } from './TextbookGenerateDialog';

interface TextbookEditorProps {
  courseId: string;
  courseTitle?: string;
}

export function TextbookEditor({ courseId, courseTitle = 'Course' }: TextbookEditorProps) {
  const [editingChapter, setEditingChapter] = useState<TextbookChapter | null>(null);
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const { data: chapters, isLoading } = useTextbookChapters(courseId);
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const { toast } = useToast();

  const handleDeleteChapter = async (chapter: TextbookChapter) => {
    if (!confirm(`Delete chapter "${chapter.title}"? All pages will be deleted.`)) return;

    try {
      await deleteChapter.mutateAsync({ chapterId: chapter.id, courseId });
      toast({ title: 'Chapter deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const togglePreview = async (chapter: TextbookChapter) => {
    try {
      await updateChapter.mutateAsync({
        chapterId: chapter.id,
        courseId,
        updates: { is_preview: !chapter.is_preview },
      });
      toast({ title: chapter.is_preview ? 'Preview disabled' : 'Preview enabled' });
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nextChapterOrder = (chapters?.length || 0) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Textbook Chapters ({chapters?.length || 0})</h3>
        </div>
        {!isCreatingChapter && !editingChapter && !selectedChapterId && (
          <div className="flex items-center gap-2">
            <TextbookGenerateDialog
              courseId={courseId}
              courseTitle={courseTitle}
              mode="chapter"
            />
            <Button onClick={() => setIsCreatingChapter(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Chapter
            </Button>
          </div>
        )}
      </div>

      {/* Chapter Form */}
      {(isCreatingChapter || editingChapter) && (
        <ChapterForm
          courseId={courseId}
          chapter={editingChapter}
          nextOrderNumber={nextChapterOrder}
          onClose={() => {
            setIsCreatingChapter(false);
            setEditingChapter(null);
          }}
        />
      )}

      {/* Pages Editor */}
      {selectedChapterId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              Editing: {chapters?.find(c => c.id === selectedChapterId)?.title}
            </h4>
            <Button variant="outline" onClick={() => setSelectedChapterId(null)}>
              Back to Chapters
            </Button>
          </div>
          <PageEditor 
            chapterId={selectedChapterId} 
            courseId={courseId}
            courseTitle={courseTitle}
            chapterTitle={chapters?.find(c => c.id === selectedChapterId)?.title}
          />
        </div>
      )}

      {/* Chapters List */}
      {!isCreatingChapter && !editingChapter && !selectedChapterId && (
        <div className="space-y-2">
          {chapters?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">No chapters yet</h4>
                <p className="text-muted-foreground mb-4">
                  Start building your textbook by adding the first chapter.
                </p>
                <Button onClick={() => setIsCreatingChapter(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Chapter
                </Button>
              </CardContent>
            </Card>
          ) : (
            chapters?.map((chapter, index) => (
              <Card key={chapter.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    
                    <span className="text-sm font-medium text-muted-foreground w-8">
                      {index + 1}.
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{chapter.title}</h4>
                        {chapter.is_preview && (
                          <Badge variant="secondary" className="text-xs">Preview</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePreview(chapter)}
                        title={chapter.is_preview ? 'Disable preview' : 'Enable preview'}
                      >
                        {chapter.is_preview ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedChapterId(chapter.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Pages
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingChapter(chapter)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteChapter(chapter)}
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

// Chapter Form Component
function ChapterForm({
  courseId,
  chapter,
  nextOrderNumber,
  onClose,
}: {
  courseId: string;
  chapter: TextbookChapter | null;
  nextOrderNumber: number;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(chapter?.title || '');
  const [isPreview, setIsPreview] = useState(chapter?.is_preview || false);

  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const { toast } = useToast();

  const isEditing = !!chapter;
  const isPending = createChapter.isPending || updateChapter.isPending;

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      if (isEditing) {
        await updateChapter.mutateAsync({
          chapterId: chapter.id,
          courseId,
          updates: { title: title.trim(), is_preview: isPreview },
        });
        toast({ title: 'Chapter updated!' });
      } else {
        await createChapter.mutateAsync({
          course_id: courseId,
          title: title.trim(),
          order_number: nextOrderNumber,
          is_preview: isPreview,
        });
        toast({ title: 'Chapter created!' });
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
        <CardTitle>{isEditing ? 'Edit Chapter' : 'New Chapter'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chapter-title">Chapter Title</Label>
          <Input
            id="chapter-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chapter title"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={isPreview}
            onCheckedChange={setIsPreview}
            id="is-preview"
          />
          <Label htmlFor="is-preview">Available as free preview</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Page Editor Component
interface PageEditorProps {
  chapterId: string;
  courseId: string;
  courseTitle: string;
  chapterTitle?: string;
}

function PageEditor({ chapterId, courseId, courseTitle, chapterTitle }: PageEditorProps) {
  const [editingPage, setEditingPage] = useState<TextbookPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: pages, isLoading } = useTextbookPages(chapterId);
  const deletePage = useDeletePage();
  const { toast } = useToast();

  const handleDelete = async (page: TextbookPage) => {
    if (!confirm(`Delete page ${page.page_number}?`)) return;

    try {
      await deletePage.mutateAsync({ pageId: page.id, chapterId });
      toast({ title: 'Page deleted' });
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
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nextPageNumber = (pages?.length || 0) + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Pages ({pages?.length || 0})</h4>
        {!isCreating && !editingPage && (
          <div className="flex items-center gap-2">
            <TextbookGenerateDialog
              courseId={courseId}
              courseTitle={courseTitle}
              chapterId={chapterId}
              chapterTitle={chapterTitle}
              mode="page"
            />
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Page
            </Button>
          </div>
        )}
      </div>

      {(isCreating || editingPage) && (
        <PageForm
          chapterId={chapterId}
          page={editingPage}
          nextPageNumber={nextPageNumber}
          onClose={() => {
            setIsCreating(false);
            setEditingPage(null);
          }}
        />
      )}

      {!isCreating && !editingPage && (
        <Accordion type="single" collapsible className="w-full">
          {pages?.map((page) => (
            <AccordionItem key={page.id} value={page.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Page {page.page_number}</span>
                  {page.embedded_quiz && (
                    <Badge variant="outline" className="text-xs">Quiz</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {page.content.substring(0, 200)}...
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingPage(page)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(page)}
                      className="text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {!isCreating && !editingPage && pages?.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No pages yet</p>
            <Button size="sm" className="mt-4" onClick={() => setIsCreating(true)}>
              Add First Page
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Page Form Component
function PageForm({
  chapterId,
  page,
  nextPageNumber,
  onClose,
}: {
  chapterId: string;
  page: TextbookPage | null;
  nextPageNumber: number;
  onClose: () => void;
}) {
  const [content, setContent] = useState(page?.content || '');
  const [hasQuiz, setHasQuiz] = useState(!!page?.embedded_quiz);
  const [quizQuestion, setQuizQuestion] = useState(page?.embedded_quiz?.question || '');
  const [quizOptions, setQuizOptions] = useState<string[]>(
    page?.embedded_quiz?.options || ['', '', '', '']
  );
  const [correctAnswer, setCorrectAnswer] = useState(page?.embedded_quiz?.correctAnswer || 0);
  const [explanation, setExplanation] = useState(page?.embedded_quiz?.explanation || '');

  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const { toast } = useToast();

  const isEditing = !!page;
  const isPending = createPage.isPending || updatePage.isPending;

  const handleSave = async () => {
    if (!content.trim()) {
      toast({ title: 'Content is required', variant: 'destructive' });
      return;
    }

    let embeddedQuiz: EmbeddedQuiz | null = null;
    if (hasQuiz && quizQuestion.trim()) {
      embeddedQuiz = {
        question: quizQuestion.trim(),
        options: quizOptions.filter(o => o.trim()),
        correctAnswer,
        explanation: explanation.trim() || undefined,
      };
    }

    try {
      if (isEditing) {
        await updatePage.mutateAsync({
          pageId: page.id,
          chapterId,
          updates: { content, embedded_quiz: embeddedQuiz },
        });
        toast({ title: 'Page updated!' });
      } else {
        await createPage.mutateAsync({
          chapter_id: chapterId,
          content,
          page_number: nextPageNumber,
          embedded_quiz: embeddedQuiz,
        });
        toast({ title: 'Page created!' });
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
        <CardTitle>{isEditing ? 'Edit Page' : 'New Page'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Page Content (Markdown supported)</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Heading&#10;&#10;Paragraph text..."
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            <Switch checked={hasQuiz} onCheckedChange={setHasQuiz} id="has-quiz" />
            <Label htmlFor="has-quiz">Add embedded quiz</Label>
          </div>

          {hasQuiz && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="What is...?"
                />
              </div>

              <div className="space-y-2">
                <Label>Options (mark correct answer)</Label>
                {quizOptions.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={correctAnswer === idx}
                      onChange={() => setCorrectAnswer(idx)}
                    />
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...quizOptions];
                        newOptions[idx] = e.target.value;
                        setQuizOptions(newOptions);
                      }}
                      placeholder={`Option ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Explanation (optional)</Label>
                <Textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why this is the correct answer..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
