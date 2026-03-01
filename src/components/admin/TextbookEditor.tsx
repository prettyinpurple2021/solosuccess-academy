/**
 * @file TextbookEditor.tsx — Admin Textbook Chapter & Page Manager
 *
 * PURPOSE: Full CRUD interface for managing textbook content. Supports:
 * - Creating/editing/deleting chapters with ordering
 * - Creating/editing/deleting pages within chapters
 * - Embedded quiz creation within pages
 * - Preview toggle for free/preview chapters
 *
 * DATA FLOW:
 *   useTextbookChapters → chapter list → expand → useTextbookPages → page list
 *   useCreateChapter/Page, useUpdateChapter/Page, useDeleteChapter/Page → mutations
 *
 * PRODUCTION TODO:
 * - Add drag-and-drop chapter/page reordering
 * - Add markdown preview for page content
 * - Support bulk page import from documents
 * - Add page content character/word count
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // DnD sensors for chapter reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  /**
   * Handle drag-and-drop chapter reorder.
   * Updates order_number for each affected chapter in parallel.
   */
  const handleChapterDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !chapters) return;

      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // Build reordered list
      const reordered = [...chapters];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Optimistic update — also fix order_number so UI reflects new positions
      const reorderedWithOrder = reordered.map((ch, i) => ({ ...ch, order_number: i + 1 }));
      queryClient.setQueryData(['textbook-chapters', courseId], reorderedWithOrder);

      // Update order numbers in DB
      try {
        const updates = reordered.map((ch, i) =>
          supabase
            .from('textbook_chapters')
            .update({ order_number: i + 1 })
            .eq('id', ch.id)
        );
        const results = await Promise.all(updates);
        const error = results.find((r) => r.error)?.error;
        if (error) throw error;
        toast({ title: 'Chapters reordered!' });
      } catch (error: any) {
        // Revert on failure
        queryClient.invalidateQueries({ queryKey: ['textbook-chapters', courseId] });
        toast({ title: 'Reorder failed', description: error.message, variant: 'destructive' });
      }
    },
    [chapters, courseId, queryClient, toast]
  );

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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleChapterDragEnd}>
              <SortableContext items={chapters?.map((c) => c.id) || []} strategy={verticalListSortingStrategy}>
                {chapters?.map((chapter, index) => (
                  <SortableChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
                    onTogglePreview={togglePreview}
                    onSelectPages={setSelectedChapterId}
                    onEdit={setEditingChapter}
                    onDelete={handleDeleteChapter}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Sortable chapter item for drag-and-drop reordering.
 * Uses @dnd-kit/sortable for smooth drag interactions.
 */
function SortableChapterItem({
  chapter,
  index,
  onTogglePreview,
  onSelectPages,
  onEdit,
  onDelete,
}: {
  chapter: TextbookChapter;
  index: number;
  onTogglePreview: (chapter: TextbookChapter) => void;
  onSelectPages: (id: string) => void;
  onEdit: (chapter: TextbookChapter) => void;
  onDelete: (chapter: TextbookChapter) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="hover:bg-muted/50 transition-colors">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground w-8">{index + 1}.</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{chapter.title}</h4>
              {chapter.is_preview && <Badge variant="secondary" className="text-xs">Preview</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => onTogglePreview(chapter)}
              title={chapter.is_preview ? 'Disable preview' : 'Enable preview'}>
              {chapter.is_preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onSelectPages(chapter.id)}>
              <FileText className="h-4 w-4 mr-2" />Pages
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(chapter)}>
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(chapter)}
              className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
        {/* Content editor with word count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Page Content (Markdown supported)</Label>
            <span className="text-xs text-muted-foreground font-mono">
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Editor */}
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Heading&#10;&#10;Paragraph text..."
              rows={12}
              className="font-mono text-sm"
            />
            {/* Live markdown preview */}
            <div className="border rounded-lg p-4 prose prose-sm prose-invert max-w-none overflow-auto max-h-[300px] bg-black/20">
              {content ? content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-2 text-cyan-300">{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mb-2 text-primary">{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium mb-1 text-purple-300">{line.slice(4)}</h3>;
                if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-foreground/90">{line.slice(2)}</li>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="mb-1 text-foreground/90">{line}</p>;
              }) : <p className="text-muted-foreground italic">Preview will appear here...</p>}
            </div>
          </div>
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
