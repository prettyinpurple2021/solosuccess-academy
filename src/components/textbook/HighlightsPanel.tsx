/**
 * @file HighlightsPanel.tsx — Highlights & Notes Management Side Panel
 *
 * PURPOSE: Displays all user highlights across the textbook, grouped by
 * "Notes" (highlights with attached notes) and "Highlights" (color-only).
 * Supports inline note editing, deletion, color changes, search/filter,
 * export as markdown, and click-to-navigate to the highlighted page.
 *
 * DATA FLOW:
 *   highlights prop (from TextbookViewer) → rendered as HighlightCard components
 *   useUpdateHighlight → edit note text or color on a highlight
 *   useDeleteHighlight → remove a highlight entirely
 */
import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Highlighter, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  StickyNote,
  Search,
  Download,
  Palette,
} from 'lucide-react';
import { TextbookHighlight, useUpdateHighlight, useDeleteHighlight } from '@/hooks/useTextbook';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface HighlightsPanelProps {
  highlights: TextbookHighlight[];
  pageContents: Record<string, string>;
  onNavigateToPage: (pageId: string) => void;
}

const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'purple'] as const;

const COLOR_CLASSES: Record<string, string> = {
  yellow: 'bg-yellow-200 border-yellow-400',
  green: 'bg-green-200 border-green-400',
  blue: 'bg-blue-200 border-blue-400',
  pink: 'bg-pink-200 border-pink-400',
  purple: 'bg-purple-200 border-purple-400',
};

const COLOR_DOT_CLASSES: Record<string, string> = {
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  pink: 'bg-pink-400',
  purple: 'bg-purple-400',
};

export function HighlightsPanel({ highlights, pageContents, onNavigateToPage }: HighlightsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [changingColorId, setChangingColorId] = useState<string | null>(null);
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

  /** Change the color of a highlight */
  const handleChangeColor = async (highlightId: string, color: string) => {
    try {
      await updateHighlight.mutateAsync({
        highlightId,
        updates: { color },
      });
      setChangingColorId(null);
      toast({ title: 'Color updated!' });
    } catch (error: any) {
      toast({
        title: 'Failed to change color',
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

  /** Export all highlights and notes as a markdown file */
  const handleExportMarkdown = () => {
    const lines: string[] = ['# My Highlights & Notes\n'];
    const withNotes = highlights.filter(h => h.note);
    const withoutNotes = highlights.filter(h => !h.note);

    if (withNotes.length > 0) {
      lines.push('## Notes\n');
      withNotes.forEach(h => {
        lines.push(`> "${getHighlightedText(h)}"\n`);
        lines.push(`**Note:** ${h.note}\n`);
        lines.push('---\n');
      });
    }

    if (withoutNotes.length > 0) {
      lines.push('## Highlights\n');
      withoutNotes.forEach(h => {
        lines.push(`> "${getHighlightedText(h)}"\n`);
        lines.push('---\n');
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'highlights-and-notes.md';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Highlights exported!' });
  };

  // Filter highlights by search query
  const filteredHighlights = useMemo(() => {
    if (!searchQuery.trim()) return highlights;
    const q = searchQuery.toLowerCase();
    return highlights.filter(h => {
      const text = getHighlightedText(h).toLowerCase();
      const note = (h.note || '').toLowerCase();
      return text.includes(q) || note.includes(q);
    });
  }, [highlights, searchQuery, pageContents]);

  const highlightsWithNotes = filteredHighlights.filter(h => h.note);
  const highlightsWithoutNotes = filteredHighlights.filter(h => !h.note);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/20 text-foreground">
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
        
        {/* Search and Export toolbar */}
        {highlights.length > 0 && (
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search highlights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportMarkdown}
              title="Export as Markdown"
              className="h-9"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-140px)] mt-4">
          {highlights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Highlighter className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No highlights yet</p>
              <p className="text-sm mt-1">Select text in the textbook to highlight it</p>
            </div>
          ) : filteredHighlights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No highlights match your search</p>
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
                        isChangingColor={changingColorId === highlight.id}
                        onToggleColorPicker={() => setChangingColorId(changingColorId === highlight.id ? null : highlight.id)}
                        onChangeColor={(color) => handleChangeColor(highlight.id, color)}
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
                        isChangingColor={changingColorId === highlight.id}
                        onToggleColorPicker={() => setChangingColorId(changingColorId === highlight.id ? null : highlight.id)}
                        onChangeColor={(color) => handleChangeColor(highlight.id, color)}
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
  isChangingColor: boolean;
  onToggleColorPicker: () => void;
  onChangeColor: (color: string) => void;
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
  isChangingColor,
  onToggleColorPicker,
  onChangeColor,
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

      {/* Color picker */}
      {isChangingColor && (
        <div className="flex gap-1.5 mt-2 p-2 bg-background/80 rounded-md">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChangeColor(color)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                COLOR_DOT_CLASSES[color],
                highlight.color === color ? "border-foreground scale-110" : "border-transparent hover:scale-110"
              )}
              title={color}
            />
          ))}
        </div>
      )}

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
              className="h-7 w-7"
              onClick={onToggleColorPicker}
              title="Change color"
            >
              <Palette className="h-3 w-3" />
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
