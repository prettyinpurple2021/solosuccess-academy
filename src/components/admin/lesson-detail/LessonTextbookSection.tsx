import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, BookOpen, Plus, Trash2, Link2, LinkIcon, FileText } from 'lucide-react';
import { TextbookChapter, useTextbookPages, useCreateChapter, useCreatePage, useUpdatePage, useDeletePage } from '@/hooks/useTextbook';
import { useContentGenerator, GeneratedTextbookChapter } from '@/hooks/useContentGenerator';
import { SmartPromptDialog } from './SmartPromptDialog';
import { useToast } from '@/hooks/use-toast';

interface LessonTextbookSectionProps {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  linkedChapter?: TextbookChapter;
  smartPrompt: string;
}

export function LessonTextbookSection({
  lessonId,
  lessonTitle,
  courseId,
  courseTitle,
  linkedChapter,
  smartPrompt,
}: LessonTextbookSectionProps) {
  const { generateContent, isGenerating } = useContentGenerator();
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const { toast } = useToast();
  
  const { data: pages, isLoading: pagesLoading } = useTextbookPages(linkedChapter?.id);
  const createChapter = useCreateChapter();
  const createPage = useCreatePage();
  const updatePage = useUpdatePage();
  const deletePage = useDeletePage();

  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleGenerate = async (customPrompt: string) => {
    const result = await generateContent<GeneratedTextbookChapter>('textbook_chapter', {
      lessonTitle,
      courseTitle,
      topic: lessonTitle,
      chapterTitle: lessonTitle,
      pageCount: 3,
    }, customPrompt);
    
    if (result && result.pages) {
      try {
        // Create chapter if doesn't exist
        let chapterId = linkedChapter?.id;
        
        if (!chapterId) {
          const newChapter = await createChapter.mutateAsync({
            course_id: courseId,
            title: result.title || lessonTitle,
            order_number: 1,
            lesson_id: lessonId,
          });
          chapterId = newChapter.id;
        }
        
        // Create pages
        for (let i = 0; i < result.pages.length; i++) {
          const page = result.pages[i];
          await createPage.mutateAsync({
            chapter_id: chapterId,
            content: page.content,
            page_number: (pages?.length || 0) + i + 1,
            embedded_quiz: page.embedded_quiz,
          });
        }
        
        toast({ title: 'Textbook content generated!' });
      } catch (error: any) {
        toast({
          title: 'Failed to save',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
    setShowPromptDialog(false);
  };

  const handleCreateChapter = async () => {
    try {
      await createChapter.mutateAsync({
        course_id: courseId,
        title: lessonTitle,
        order_number: 1,
        lesson_id: lessonId,
      });
      toast({ title: 'Chapter created!' });
    } catch (error: any) {
      toast({
        title: 'Failed to create chapter',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddPage = async () => {
    if (!linkedChapter) return;
    
    try {
      await createPage.mutateAsync({
        chapter_id: linkedChapter.id,
        content: '',
        page_number: (pages?.length || 0) + 1,
      });
      toast({ title: 'Page added!' });
    } catch (error: any) {
      toast({
        title: 'Failed to add page',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSavePage = async (pageId: string) => {
    if (!linkedChapter) return;
    
    try {
      await updatePage.mutateAsync({
        pageId,
        chapterId: linkedChapter.id,
        updates: { content: editingContent },
      });
      setEditingPageId(null);
      setEditingContent('');
      toast({ title: 'Page saved!' });
    } catch (error: any) {
      toast({
        title: 'Failed to save page',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!linkedChapter || !confirm('Delete this page?')) return;
    
    try {
      await deletePage.mutateAsync({
        pageId,
        chapterId: linkedChapter.id,
      });
      toast({ title: 'Page deleted!' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete page',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <CardTitle>Textbook Pages</CardTitle>
                <CardDescription>
                  {linkedChapter ? (
                    <>
                      <Badge variant="secondary" className="mr-2">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Linked
                      </Badge>
                      {pages?.length || 0} page{(pages?.length || 0) !== 1 ? 's' : ''} in chapter
                    </>
                  ) : (
                    'No textbook chapter linked to this lesson'
                  )}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPromptDialog(true)}
              disabled={isGenerating}
              className="border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate with AI
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!linkedChapter ? (
            <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-lg">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Create a textbook chapter for this lesson</p>
              <div className="flex items-center justify-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCreateChapter}
                  disabled={createChapter.isPending}
                >
                  {createChapter.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Chapter
                </Button>
                <Button 
                  variant="neon" 
                  onClick={() => setShowPromptDialog(true)}
                  disabled={isGenerating}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          ) : pagesLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            </div>
          ) : pages?.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-muted-foreground/30 rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No pages in this chapter yet</p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" onClick={handleAddPage}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Page
                </Button>
                <Button 
                  variant="neon" 
                  onClick={() => setShowPromptDialog(true)}
                  disabled={isGenerating}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {pages?.map((page, index) => (
                <Card key={page.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Page {index + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        {editingPageId === page.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPageId(null);
                                setEditingContent('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="neon"
                              size="sm"
                              onClick={() => handleSavePage(page.id)}
                              disabled={updatePage.isPending}
                            >
                              {updatePage.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Save'
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPageId(page.id);
                                setEditingContent(page.content);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePage(page.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingPageId === page.id ? (
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg max-h-40 overflow-auto">
                          {page.content || '(Empty page)'}
                        </pre>
                      </div>
                    )}
                    {page.embedded_quiz && (
                      <Badge variant="secondary" className="mt-2">
                        <HelpCircle className="h-3 w-3 mr-1" />
                        Has embedded quiz
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={handleAddPage} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SmartPromptDialog
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        title="Generate Textbook Content"
        description="AI will create textbook pages with detailed content."
        defaultPrompt={smartPrompt}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </>
  );
}

// Import for the badge
import { HelpCircle } from 'lucide-react';
