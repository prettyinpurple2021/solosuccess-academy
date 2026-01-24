import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Highlighter, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  StickyNote 
} from 'lucide-react';
import { TextbookHighlight, useUpdateHighlight, useDeleteHighlight } from '@/hooks/useTextbook';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface HighlightsPanelProps {
  highlights: TextbookHighlight[];
  pageContents: Record<string, string>;
  onNavigateToPage: (pageId: string) => void;
}

const COLOR_CLASSES: Record<string, string> = {
  yellow: 'bg-yellow-200 border-yellow-400',
  green: 'bg-green-200 border-green-400',
  blue: 'bg-blue-200 border-blue-400',
  pink: 'bg-pink-200 border-pink-400',
  purple: 'bg-purple-200 border-purple-400',
};

export function HighlightsPanel({ highlights, pageContents, onNavigateToPage }: HighlightsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const updateHighlight = useUpdateHighlight();
  const deleteHighlight = useDeleteHighlight();
  const { toast } = useToast();

  const handleStartEdit = (highlight: TextbookHighlight) => {
    setEditingId(highlight.id);
    setEditNote(highlight.note || '');
  };

  const handleSaveNote = async (highlightId: string) => {
    try {
      await updateHighlight.mutateAsync({
        highlightId,
        updates: { note: editNote || null },
      });
      setEditingId(null);
      toast({ title: 'Note saved!' });
    } catch (error: any) {
      toast({
        title: 'Failed to save note',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (highlightId: string) => {
    try {
      await deleteHighlight.mutateAsync(highlightId);
      toast({ title: 'Highlight deleted' });
    } catch (error: any) {
      toast({
        title: 'Failed to delete highlight',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getHighlightedText = (highlight: TextbookHighlight): string => {
    const content = pageContents[highlight.page_id] || '';
    return content.substring(highlight.start_offset, highlight.end_offset) || '...';
  };

  const highlightsWithNotes = highlights.filter(h => h.note);
  const highlightsWithoutNotes = highlights.filter(h => !h.note);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Highlighter className="h-4 w-4" />
          {highlights.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {highlights.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Highlighter className="h-5 w-5" />
            My Highlights & Notes
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {highlights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Highlighter className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No highlights yet</p>
              <p className="text-sm mt-1">Select text in the textbook to highlight it</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Notes section */}
              {highlightsWithNotes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Notes ({highlightsWithNotes.length})
                  </h3>
                  <div className="space-y-3">
                    {highlightsWithNotes.map((highlight) => (
                      <HighlightCard
                        key={highlight.id}
                        highlight={highlight}
                        text={getHighlightedText(highlight)}
                        isEditing={editingId === highlight.id}
                        editNote={editNote}
                        onEditNote={setEditNote}
                        onStartEdit={() => handleStartEdit(highlight)}
                        onSave={() => handleSaveNote(highlight.id)}
                        onCancelEdit={() => setEditingId(null)}
                        onDelete={() => handleDelete(highlight.id)}
                        onNavigate={() => onNavigateToPage(highlight.page_id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights without notes */}
              {highlightsWithoutNotes.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Highlighter className="h-4 w-4" />
                    Highlights ({highlightsWithoutNotes.length})
                  </h3>
                  <div className="space-y-3">
                    {highlightsWithoutNotes.map((highlight) => (
                      <HighlightCard
                        key={highlight.id}
                        highlight={highlight}
                        text={getHighlightedText(highlight)}
                        isEditing={editingId === highlight.id}
                        editNote={editNote}
                        onEditNote={setEditNote}
                        onStartEdit={() => handleStartEdit(highlight)}
                        onSave={() => handleSaveNote(highlight.id)}
                        onCancelEdit={() => setEditingId(null)}
                        onDelete={() => handleDelete(highlight.id)}
                        onNavigate={() => onNavigateToPage(highlight.page_id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface HighlightCardProps {
  highlight: TextbookHighlight;
  text: string;
  isEditing: boolean;
  editNote: string;
  onEditNote: (note: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}

function HighlightCard({
  highlight,
  text,
  isEditing,
  editNote,
  onEditNote,
  onStartEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onNavigate,
}: HighlightCardProps) {
  const colorClass = COLOR_CLASSES[highlight.color] || COLOR_CLASSES.yellow;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border-l-4 bg-card transition-colors",
        colorClass
      )}
    >
      <button
        onClick={onNavigate}
        className="text-left w-full hover:underline"
      >
        <p className="text-sm font-medium line-clamp-2">"{text}"</p>
      </button>

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={editNote}
            onChange={(e) => onEditNote(e.target.value)}
            placeholder="Add a note..."
            className="min-h-[80px] text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave} className="h-7">
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="h-7">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          {highlight.note && (
            <p className="mt-2 text-sm text-muted-foreground italic">
              {highlight.note}
            </p>
          )}
          <div className="mt-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onStartEdit}
              title="Edit note"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              title="Delete highlight"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
