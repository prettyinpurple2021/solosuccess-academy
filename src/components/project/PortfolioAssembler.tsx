/**
 * @file PortfolioAssembler.tsx — Student Portfolio Builder
 * 
 * Lets students manually select, refine, and organize deliverables
 * from Courses 1-9 into a custom professional dossier.
 * 
 * FEATURES:
 * - Browse available deliverables from completed courses
 * - Add deliverables to portfolio with custom title, executive summary, narrative
 * - Reorder entries via move up/down buttons
 * - Edit/remove entries
 * - View original submission content as reference
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  usePortfolioEntries,
  useAvailableDeliverables,
  useSavePortfolioEntry,
  useDeletePortfolioEntry,
  useReorderPortfolioEntries,
  type PortfolioEntry,
  type AvailableDeliverable,
} from '@/hooks/usePortfolioAssembler';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  Edit3,
  Save,
  X,
  Briefcase,
  BookOpen,
  Check,
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

interface PortfolioAssemblerProps {
  userId: string;
  graduationCourseId: string;
}

export function PortfolioAssembler({ userId, graduationCourseId }: PortfolioAssemblerProps) {
  const { toast } = useToast();

  // Data hooks
  const { data: entries = [], isLoading: entriesLoading } = usePortfolioEntries(userId);
  const { data: deliverables = [], isLoading: deliverablesLoading } = useAvailableDeliverables(userId, graduationCourseId);
  const saveMutation = useSavePortfolioEntry();
  const deleteMutation = useDeletePortfolioEntry();
  const reorderMutation = useReorderPortfolioEntries();

  // UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);

  // Form state for adding/editing
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formNarrative, setFormNarrative] = useState('');
  const [formContent, setFormContent] = useState('');

  /** Start adding a deliverable from a course */
  const handleStartAdd = (deliverable: AvailableDeliverable) => {
    setAddingCourseId(deliverable.courseId);
    setEditingId(null);
    setFormTitle(deliverable.projectTitle);
    setFormSummary('');
    setFormNarrative('');
    setFormContent(deliverable.submissionContent);
  };

  /** Start editing an existing entry */
  const handleStartEdit = (entry: PortfolioEntry) => {
    setEditingId(entry.id);
    setAddingCourseId(null);
    setFormTitle(entry.title);
    setFormSummary(entry.executive_summary);
    setFormNarrative(entry.connective_narrative);
    setFormContent(entry.deliverable_content);
  };

  /** Cancel add/edit */
  const handleCancel = () => {
    setAddingCourseId(null);
    setEditingId(null);
  };

  /** Save new or edited entry */
  const handleSave = async (courseId: string, existingOrder?: number) => {
    if (!formTitle.trim()) {
      toast({ title: 'Title Required', description: 'Give your portfolio piece a title.', variant: 'destructive' });
      return;
    }

    try {
      await saveMutation.mutateAsync({
        userId,
        courseId,
        title: formTitle.trim(),
        executiveSummary: formSummary.trim(),
        connectiveNarrative: formNarrative.trim(),
        deliverableContent: formContent.trim(),
        orderNumber: existingOrder ?? entries.length + 1,
      });
      toast({ title: 'Saved', description: 'Portfolio piece saved successfully.' });
      handleCancel();
    } catch (err: any) {
      toast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
    }
  };

  /** Delete an entry */
  const handleDelete = async (entryId: string) => {
    try {
      await deleteMutation.mutateAsync(entryId);
      toast({ title: 'Removed', description: 'Portfolio piece removed.' });
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    }
  };

  /** Move an entry up or down */
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= entries.length) return;

    const updated = entries.map((e, i) => {
      if (i === index) return { id: e.id, order_number: entries[swapIndex].order_number };
      if (i === swapIndex) return { id: e.id, order_number: entries[index].order_number };
      return { id: e.id, order_number: e.order_number };
    });

    try {
      await reorderMutation.mutateAsync(updated);
    } catch (err: any) {
      toast({ title: 'Reorder Failed', description: err.message, variant: 'destructive' });
    }
  };

  if (entriesLoading || deliverablesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <NeonSpinner size="md" />
      </div>
    );
  }

  // Courses not yet added to the portfolio
  const availableCourses = deliverables.filter(d => !d.alreadyAdded && d.submissionContent);

  return (
    <div className="space-y-6">
      {/* ─── Portfolio Entries (Student's Curated Pieces) ─── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5 text-primary" />
          Your Portfolio ({entries.length} piece{entries.length !== 1 ? 's' : ''})
        </h2>

        {entries.length === 0 && !addingCourseId && (
          <Card className="glass-card border-dashed border-muted-foreground/30">
            <CardContent className="p-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Your portfolio is empty. Add deliverables from your completed courses below.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Existing entries */}
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <Card key={entry.id} className="glass-card border-primary/20">
              {editingId === entry.id ? (
                /* ─── Edit Mode ─── */
                <CardContent className="p-5 space-y-4">
                  <EntryForm
                    title={formTitle}
                    summary={formSummary}
                    narrative={formNarrative}
                    content={formContent}
                    onTitleChange={setFormTitle}
                    onSummaryChange={setFormSummary}
                    onNarrativeChange={setFormNarrative}
                    onContentChange={setFormContent}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button
                      variant="neon"
                      size="sm"
                      onClick={() => handleSave(entry.course_id, entry.order_number)}
                      disabled={saveMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </CardContent>
              ) : (
                /* ─── View Mode ─── */
                <>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                            #{index + 1}
                          </Badge>
                          <CardTitle className="text-base">{entry.title}</CardTitle>
                        </div>
                        {entry.executive_summary && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.executive_summary}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, 'down')} disabled={index === entries.length - 1}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(entry)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(entry.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {entry.connective_narrative && (
                    <CardContent className="pt-0 pb-4">
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto">
                            <BookOpen className="h-3 w-3 mr-1" /> View narrative & deliverable
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          <div className="rounded-md bg-muted/30 p-3 border border-border/50">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Connective Narrative</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{entry.connective_narrative}</p>
                          </div>
                          <div className="rounded-md bg-muted/30 p-3 border border-border/50">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Deliverable Content</p>
                            <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-6">{entry.deliverable_content}</p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* ─── Add New Entry (form when actively adding) ─── */}
      {addingCourseId && (
        <Card className="glass-card border-accent/30 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" />
              Adding Portfolio Piece
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EntryForm
              title={formTitle}
              summary={formSummary}
              narrative={formNarrative}
              content={formContent}
              onTitleChange={setFormTitle}
              onSummaryChange={setFormSummary}
              onNarrativeChange={setFormNarrative}
              onContentChange={setFormContent}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                variant="neon"
                size="sm"
                onClick={() => handleSave(addingCourseId)}
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" /> Add to Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Available Deliverables (courses not yet added) ─── */}
      {!addingCourseId && availableCourses.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Available Deliverables — Select a course to add
          </h3>
          <div className="grid gap-2">
            {availableCourses.map(d => (
              <button
                key={d.courseId}
                onClick={() => handleStartAdd(d)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <span className="text-xs font-bold text-primary">{String(d.courseOrderNumber).padStart(2, '0')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{d.courseTitle}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.projectTitle}</p>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All courses added */}
      {!addingCourseId && availableCourses.length === 0 && entries.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-accent">
          <Check className="h-4 w-4" />
          All available deliverables have been added to your portfolio.
        </div>
      )}
    </div>
  );
}

/* ─── Entry Form (shared between add and edit) ─── */

function EntryForm({
  title, summary, narrative, content,
  onTitleChange, onSummaryChange, onNarrativeChange, onContentChange,
}: {
  title: string; summary: string; narrative: string; content: string;
  onTitleChange: (v: string) => void;
  onSummaryChange: (v: string) => void;
  onNarrativeChange: (v: string) => void;
  onContentChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Portfolio Piece Title</label>
        <Input
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          placeholder="e.g. Brand Identity System"
          maxLength={200}
        />
      </div>

      {/* Executive Summary */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Executive Summary
          <span className="text-muted-foreground/60 ml-1">(brief overview of this piece)</span>
        </label>
        <Textarea
          value={summary}
          onChange={e => onSummaryChange(e.target.value)}
          placeholder="In 2-3 sentences, what is this deliverable and what does it demonstrate?"
          rows={3}
          maxLength={1000}
        />
      </div>

      {/* Connective Narrative */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Connective Narrative
          <span className="text-muted-foreground/60 ml-1">(how this piece fits your overall journey)</span>
        </label>
        <Textarea
          value={narrative}
          onChange={e => onNarrativeChange(e.target.value)}
          placeholder="Explain how this deliverable connects to your broader entrepreneurial goals and what you learned creating it..."
          rows={4}
          maxLength={2000}
        />
      </div>

      {/* Deliverable Content */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">
          Deliverable Content
          <span className="text-muted-foreground/60 ml-1">(refine your original submission)</span>
        </label>
        <Textarea
          value={content}
          onChange={e => onContentChange(e.target.value)}
          placeholder="Your deliverable content — feel free to refine and polish your original submission..."
          rows={8}
          maxLength={10000}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}
