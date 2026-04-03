/**
 * @file FlashcardsPanel.tsx — Flashcard Management Side Panel
 *
 * PURPOSE: Provides a Sheet panel for managing flashcards within the textbook.
 * Students can create cards manually, from highlighted text + notes, edit,
 * delete, and launch study sessions.
 *
 * TABS:
 * - "My Cards": lists all flashcards with due status, review counts
 * - "Create from Highlights": shows highlights with notes as card templates
 *
 * DATA FLOW:
 *   useFlashcards(courseId) → all user's cards for this course
 *   useDueFlashcards(courseId) → cards where next_review_at <= now
 *   useCreateFlashcard / useUpdateFlashcard / useDeleteFlashcard → CRUD mutations
 *
 * PRODUCTION TODO:
 * - Add bulk import/export of flashcard decks
 * - Support shared flashcard decks between students
 * - Add tagging/categorization for large card sets
 */
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Brain, 
  Plus, 
  Trash2, 
  Edit2,
  Play,
  Clock,
  Check,
  Sparkles
} from 'lucide-react';
import { 
  Flashcard, 
  useFlashcards, 
  useDueFlashcards,
  useCreateFlashcard, 
  useUpdateFlashcard,
  useDeleteFlashcard 
} from '@/hooks/useFlashcards';
import { TextbookHighlight } from '@/hooks/useTextbook';
import { FlashcardViewer } from './FlashcardViewer';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface FlashcardsPanelProps {
  courseId: string;
  highlights: TextbookHighlight[];
  pageContents: Record<string, string>;
}

export function FlashcardsPanel({ courseId, highlights, pageContents }: FlashcardsPanelProps) {
  const { data: flashcards = [], isLoading } = useFlashcards(courseId);
  const { data: dueCards = [] } = useDueFlashcards(courseId);
  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<TextbookHighlight | null>(null);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  const getHighlightedText = (highlight: TextbookHighlight): string => {
    const content = pageContents[highlight.page_id] || '';
    return content.substring(highlight.start_offset, highlight.end_offset) || '...';
  };

  const handleCreateFromHighlight = (highlight: TextbookHighlight) => {
    setSelectedHighlight(highlight);
    setFrontText(getHighlightedText(highlight));
    setBackText(highlight.note || '');
    setIsCreateDialogOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedHighlight(null);
    setFrontText('');
    setBackText('');
    setIsCreateDialogOpen(true);
  };

  const handleSaveFlashcard = async () => {
    if (!frontText.trim() || !backText.trim()) {
      toast({
        title: 'Missing content',
        description: 'Both front and back text are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCard) {
        await updateFlashcard.mutateAsync({
          flashcardId: editingCard.id,
          courseId,
          frontText,
          backText,
        });
        toast({ title: 'Flashcard updated!' });
      } else {
        await createFlashcard.mutateAsync({
          courseId,
          highlightId: selectedHighlight?.id,
          frontText,
          backText,
        });
        toast({ title: 'Flashcard created!' });
      }
      setIsCreateDialogOpen(false);
      setEditingCard(null);
      setFrontText('');
      setBackText('');
    } catch (error: any) {
      toast({
        title: 'Failed to save flashcard',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (card: Flashcard) => {
    setEditingCard(card);
    setFrontText(card.front_text);
    setBackText(card.back_text);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (cardId: string) => {
    try {
      await deleteFlashcard.mutateAsync({ flashcardId: cardId, courseId });
      toast({ title: 'Flashcard deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete flashcard',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const highlightsWithNotes = highlights.filter(h => h.note);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative hover:bg-primary/20 text-foreground">
            <Brain className="h-4 w-4" />
            {dueCards.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {dueCards.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Flashcards
            </SheetTitle>
          </SheetHeader>

          {isStudyMode ? (
            <div className="mt-4">
              <FlashcardViewer 
                courseId={courseId} 
                onClose={() => setIsStudyMode(false)} 
              />
            </div>
          ) : (
            <Tabs defaultValue="cards" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cards">
                  My Cards ({flashcards.length})
                </TabsTrigger>
                <TabsTrigger value="create">
                  Create from Highlights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cards" className="mt-4">
                {/* Study button */}
                {dueCards.length > 0 && (
                  <Button 
                    className="w-full mb-4"
                    onClick={() => setIsStudyMode(true)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Study Now ({dueCards.length} due)
                  </Button>
                )}

                {/* Create new button */}
                <Button 
                  variant="outline" 
                  className="w-full mb-4"
                  onClick={handleCreateNew}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Flashcard
                </Button>

                <ScrollArea className="h-[calc(100vh-280px)]">
                  {flashcards.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No flashcards yet</p>
                      <p className="text-sm mt-1">Create cards from your highlights or start fresh</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flashcards.map((card) => {
                        const isDue = new Date(card.next_review_at) <= new Date();
                        return (
                          <Card 
                            key={card.id}
                            className={cn(
                              "transition-colors",
                              isDue && "border-primary/50 bg-primary/5"
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm line-clamp-2">
                                    {card.front_text}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {card.back_text}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {isDue ? (
                                      <Badge variant="default" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Due now
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">
                                        <Check className="h-3 w-3 mr-1" />
                                        Next: {formatDistanceToNow(new Date(card.next_review_at), { addSuffix: true })}
                                      </Badge>
                                    )}
                                    {card.repetitions > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {card.repetitions} reviews
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEdit(card)}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(card.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="create" className="mt-4">
                <ScrollArea className="h-[calc(100vh-220px)]">
                  {highlightsWithNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No highlights with notes yet</p>
                      <p className="text-sm mt-1">
                        Add notes to your highlights to quickly create flashcards
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground mb-4">
                        Create flashcards from your highlighted text and notes:
                      </p>
                      {highlightsWithNotes.map((highlight) => (
                        <Card 
                          key={highlight.id}
                          className="hover:border-primary/50 cursor-pointer transition-colors"
                          onClick={() => handleCreateFromHighlight(highlight)}
                        >
                          <CardContent className="p-4">
                            <p className="font-medium text-sm line-clamp-2">
                              {getHighlightedText(highlight)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              Note: {highlight.note}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateFromHighlight(highlight);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Create Flashcard
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCard ? 'Edit Flashcard' : 'Create Flashcard'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Front (Question)
              </label>
              <Textarea
                placeholder="Enter the question or term..."
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Back (Answer)
              </label>
              <Textarea
                placeholder="Enter the answer or definition..."
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingCard(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveFlashcard}
              disabled={createFlashcard.isPending || updateFlashcard.isPending}
            >
              {editingCard ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
