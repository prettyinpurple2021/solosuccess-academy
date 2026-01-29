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
import { Sparkles, Loader2, Copy, Check, BookOpen, FileText, Plus } from 'lucide-react';
import {
  useContentGenerator,
  GeneratedTextbookChapter,
  GeneratedTextbookPage,
} from '@/hooks/useContentGenerator';
import {
  useCreateChapter,
  useCreatePage,
  useTextbookChapters,
  useTextbookPages,
} from '@/hooks/useTextbook';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentUpload } from './DocumentUpload';
import { useDocumentParser } from '@/hooks/useDocumentParser';

interface TextbookGenerateDialogProps {
  courseId: string;
  courseTitle: string;
  chapterId?: string;
  chapterTitle?: string;
  mode: 'chapter' | 'page';
  trigger?: React.ReactNode;
}

const buildDefaultPrompt = (
  mode: 'chapter' | 'page',
  courseTitle: string,
  chapterTitle: string,
  topic: string,
  difficulty: string,
  pageCount: number
): string => {
  if (mode === 'chapter') {
    return `Create a complete textbook chapter for:
Course: ${courseTitle}
Chapter Title: ${chapterTitle || topic || 'Introduction'}
Number of pages: ${pageCount}
Difficulty: ${difficulty}
Make it comprehensive and practical for solo entrepreneurs.`;
  }
  
  return `Create a textbook page for:
Course: ${courseTitle}
Chapter: ${chapterTitle || 'Introduction'}
Topic: ${topic || 'Key Concepts'}
Difficulty: ${difficulty}
Include an embedded quiz to test understanding.`;
};

export function TextbookGenerateDialog({
  courseId,
  courseTitle,
  chapterId,
  chapterTitle: existingChapterTitle,
  mode,
  trigger,
}: TextbookGenerateDialogProps) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [chapterTitle, setChapterTitle] = useState(existingChapterTitle || '');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [pageCount, setPageCount] = useState(5);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const { generateContent, isGenerating } = useContentGenerator();
  const createChapter = useCreateChapter();
  const createPage = useCreatePage();
  const { data: existingChapters } = useTextbookChapters(courseId);
  const { data: existingPages } = useTextbookPages(chapterId || '');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { documentContent, fileName, handleDocumentParsed, clearDocument } = useDocumentParser();

  // Update prompt when inputs change
  useEffect(() => {
    if (!showPromptEditor) {
      setCustomPrompt(buildDefaultPrompt(mode, courseTitle, chapterTitle, topic, difficulty, pageCount));
    }
  }, [mode, courseTitle, chapterTitle, topic, difficulty, pageCount, showPromptEditor]);

  const handleShowPromptEditor = () => {
    setCustomPrompt(buildDefaultPrompt(mode, courseTitle, chapterTitle, topic, difficulty, pageCount));
    setShowPromptEditor(true);
  };

  const handleGenerate = async () => {
    const contentType = mode === 'chapter' ? 'textbook_chapter' : 'textbook_page';
    const context = {
      courseTitle,
      chapterTitle: chapterTitle || topic,
      topic,
      difficulty,
      pageCount: mode === 'chapter' ? pageCount : undefined,
      documentContent: documentContent || undefined,
      documentFileName: fileName || undefined,
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

  const handleApplyContent = async () => {
    if (!generatedContent) return;

    setIsApplying(true);
    try {
      if (mode === 'chapter') {
        const chapterData = generatedContent as GeneratedTextbookChapter;
        const nextOrderNumber = (existingChapters?.length || 0) + 1;

        // Create the chapter
        const newChapter = await createChapter.mutateAsync({
          course_id: courseId,
          title: chapterData.title || chapterTitle || topic || 'AI Generated Chapter',
          order_number: nextOrderNumber,
          is_preview: false,
        });

        // Create pages for the chapter
        if (chapterData.pages && newChapter) {
          for (let i = 0; i < chapterData.pages.length; i++) {
            const page = chapterData.pages[i];
            await createPage.mutateAsync({
              chapter_id: newChapter.id,
              content: page.content,
              page_number: i + 1,
              embedded_quiz: page.embedded_quiz,
            });
          }
        }

        toast({
          title: 'Chapter created!',
          description: `"${chapterData.title || 'New Chapter'}" with ${chapterData.pages?.length || 0} pages added.`,
        });

        queryClient.invalidateQueries({ queryKey: ['textbook-chapters', courseId] });
      } else if (mode === 'page' && chapterId) {
        const pageData = generatedContent as GeneratedTextbookPage;
        const nextPageNumber = (existingPages?.length || 0) + 1;

        await createPage.mutateAsync({
          chapter_id: chapterId,
          content: pageData.content,
          page_number: nextPageNumber,
          embedded_quiz: pageData.embedded_quiz,
        });

        toast({
          title: 'Page created!',
          description: `New page added to ${existingChapterTitle || 'the chapter'}.`,
        });

        queryClient.invalidateQueries({ queryKey: ['textbook-pages', chapterId] });
      }

      setOpen(false);
      resetDialog();
    } catch (error: any) {
      toast({
        title: 'Failed to apply content',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const resetDialog = () => {
    setTopic('');
    setChapterTitle(existingChapterTitle || '');
    setGeneratedContent(null);
    setCopied(false);
    setIsApplying(false);
    setShowPromptEditor(false);
    setCustomPrompt('');
    clearDocument();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetDialog();
    }
  };

  const renderGeneratedContent = () => {
    if (!generatedContent) return null;

    if (mode === 'chapter' && generatedContent.pages) {
      return (
        <div className="space-y-3">
          <div className="font-medium text-sm">
            {generatedContent.title || 'Generated Chapter'}
          </div>
          {generatedContent.pages.map((page: any, i: number) => (
            <div key={i} className="p-3 border border-border/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">Page {i + 1}</Badge>
                {page.embedded_quiz && (
                  <Badge variant="secondary" className="text-xs">Quiz</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {page.content?.substring(0, 200)}...
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (mode === 'page') {
      return (
        <div className="space-y-3">
          <div className="p-3 border border-border/50 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">
              {generatedContent.content?.substring(0, 500)}...
            </p>
            {generatedContent.embedded_quiz && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <Badge variant="secondary" className="text-xs mb-2">Embedded Quiz</Badge>
                <p className="text-sm font-medium">{generatedContent.embedded_quiz.question}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <pre className="text-sm bg-black/30 p-4 rounded-lg overflow-auto">
        {JSON.stringify(generatedContent, null, 2)}
      </pre>
    );
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="border-accent/50 hover:border-accent hover:bg-accent/10 hover:text-accent"
    >
      <Sparkles className="mr-2 h-4 w-4" />
      {mode === 'chapter' ? 'Generate Chapter' : 'Generate Page'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'chapter' ? (
              <BookOpen className="h-5 w-5 text-primary" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
            Generate {mode === 'chapter' ? 'Chapter' : 'Page'} for "{courseTitle}"
          </DialogTitle>
          <DialogDescription>
            {mode === 'chapter'
              ? 'Generate a complete textbook chapter with multiple pages'
              : `Generate a new page for ${existingChapterTitle || 'this chapter'}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{mode === 'chapter' ? 'Chapter Title' : 'Page Topic'}</Label>
                <Input
                  placeholder={mode === 'chapter' ? 'e.g., Building Your Brand' : 'e.g., Key Concepts'}
                  value={mode === 'chapter' ? chapterTitle : topic}
                  onChange={(e) => mode === 'chapter' ? setChapterTitle(e.target.value) : setTopic(e.target.value)}
                />
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

            {mode === 'chapter' && (
              <div className="space-y-2">
                <Label>Number of Pages</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={pageCount}
                  onChange={(e) => setPageCount(parseInt(e.target.value) || 5)}
                />
              </div>
            )}

            {mode === 'page' && (
              <div className="space-y-2">
                <Label>Topic / Subject</Label>
                <Input
                  placeholder="e.g., Understanding Your Target Audience"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            )}

            {/* Document Upload Section */}
            <DocumentUpload
              onDocumentParsed={handleDocumentParsed}
              onClear={clearDocument}
              documentContent={documentContent}
              fileName={fileName}
              isLoading={isGenerating}
            />

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
                    {buildDefaultPrompt(mode, courseTitle, chapterTitle, topic, difficulty, pageCount)}
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
                  Generate {mode === 'chapter' ? 'Chapter' : 'Page'}
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
                    onClick={handleApplyContent}
                    disabled={isApplying}
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
                        Apply to Textbook
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 max-h-[250px] rounded-lg border border-border/30 p-3">
                {renderGeneratedContent()}
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
