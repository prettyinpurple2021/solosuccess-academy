/**
 * @file MilestoneCard.tsx — Displays a single milestone with its submission state.
 * 
 * Shows the milestone title, description, deliverable prompt,
 * and current status (not started / draft / submitted / reviewed).
 * Clicking expands it to show the submission form.
 */
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/components/gamification/GamificationProvider';
import {
  type ProjectMilestone,
  type MilestoneSubmission,
  useSaveMilestoneDraft,
  useSubmitMilestone,
  useRequestMilestoneFeedback,
} from '@/hooks/useProjectMilestones';
import { uploadProjectFile, deleteProjectFile } from '@/hooks/useProjects';
import {
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  FileEdit,
  Upload,
  X,
  FileText,
  Image,
  File,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { RubricScorecard } from './RubricScorecard';

interface MilestoneCardProps {
  /** The milestone definition */
  milestone: ProjectMilestone;
  /** Existing submission (if any) */
  submission?: MilestoneSubmission;
  /** Current user ID */
  userId: string;
  /** Course ID for file uploads */
  courseId: string;
  /** The milestone number (1-based) for display */
  number: number;
  /** Whether this milestone is "unlocked" (previous milestones completed) */
  isUnlocked: boolean;
}

export function MilestoneCard({
  milestone,
  submission,
  userId,
  courseId,
  number,
  isUnlocked,
}: MilestoneCardProps) {
  const { toast } = useToast();
  const { awardXP, checkAndAwardBadges } = useGamification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState(submission?.submission_content || '');
  const [fileUrls, setFileUrls] = useState<string[]>(submission?.file_urls || []);
  const [isUploading, setIsUploading] = useState(false);

  // Mutations
  const saveDraft = useSaveMilestoneDraft();
  const submitMilestone = useSubmitMilestone();
  const requestFeedback = useRequestMilestoneFeedback();

  // Sync when submission data loads
  useEffect(() => {
    if (submission) {
      setContent(submission.submission_content || '');
      setFileUrls(submission.file_urls || []);
    }
  }, [submission]);

  /* ─── Derived state ─── */
  const status = submission?.status || 'not_started';
  const isReviewed = status === 'reviewed';
  const isSubmitted = status === 'submitted';
  const hasFeedback = !!submission?.ai_feedback;
  const isLocked = !isUnlocked;
  const isPending = submitMilestone.isPending || requestFeedback.isPending;

  /* ─── Status display helpers ─── */
  const statusConfig = {
    not_started: { label: 'Not Started', icon: Clock, className: 'border-muted-foreground/30 text-muted-foreground' },
    draft: { label: 'Draft', icon: FileEdit, className: 'border-warning/30 text-warning bg-warning/10' },
    submitted: { label: 'Submitted', icon: Send, className: 'border-secondary/30 text-secondary bg-secondary/10' },
    reviewed: { label: 'Reviewed', icon: CheckCircle2, className: 'border-success/30 text-success bg-success/10 shadow-[0_0_10px_hsl(var(--success)/0.2)]' },
  };
  const cfg = statusConfig[status] || statusConfig.not_started;
  const StatusIcon = cfg.icon;

  /* ─── Handlers ─── */
  const handleSave = async () => {
    try {
      await saveDraft.mutateAsync({ userId, milestoneId: milestone.id, submissionContent: content, fileUrls });
      toast({ title: 'Draft saved', description: 'Your progress has been saved.' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: 'Content required', description: 'Write your deliverable before submitting.', variant: 'destructive' });
      return;
    }
    try {
      const { submissionId } = await submitMilestone.mutateAsync({ userId, milestoneId: milestone.id, submissionContent: content, fileUrls });
      toast({ title: 'Milestone submitted!', description: 'Requesting AI feedback…' });
      await awardXP('PROJECT_SUBMIT');
      await requestFeedback.mutateAsync({ submissionId });
      toast({ title: 'Feedback received!', description: 'Check your rubric scores below.' });
      await awardXP('PROJECT_FEEDBACK');
      setTimeout(() => checkAndAwardBadges(), 1000);
    } catch (error: any) {
      toast({ title: 'Submission failed', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleResubmit = async () => {
    // Reset status to allow re-editing — just save as draft
    try {
      await saveDraft.mutateAsync({ userId, milestoneId: milestone.id, submissionContent: content, fileUrls });
      toast({ title: 'Ready to revise', description: 'Edit your work and resubmit for new feedback.' });
    } catch {
      toast({ title: 'Failed', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} exceeds 10MB`, variant: 'destructive' });
          continue;
        }
        const url = await uploadProjectFile(userId, courseId, file);
        newUrls.push(url);
      }
      setFileUrls((prev) => [...prev, ...newUrls]);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = async (url: string) => {
    try {
      await deleteProjectFile(url);
      setFileUrls((prev) => prev.filter((u) => u !== url));
    } catch {
      toast({ title: 'Remove failed', variant: 'destructive' });
    }
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <Image className="h-4 w-4" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div
      className={`glass-card overflow-hidden transition-all duration-300 ${
        isLocked ? 'opacity-50 pointer-events-none' : ''
      } ${isReviewed ? 'border-success/30' : 'border-primary/30'}`}
    >
      {/* ─── Header (always visible) ─── */}
      <button
        className="w-full p-5 flex items-center gap-4 text-left hover:bg-primary/5 transition-colors"
        onClick={() => !isLocked && setIsExpanded(!isExpanded)}
        disabled={isLocked}
        aria-expanded={isExpanded}
      >
        {/* Milestone number circle */}
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
            isReviewed
              ? 'bg-success/20 text-success shadow-[0_0_15px_hsl(var(--success)/0.3)]'
              : status === 'draft' || status === 'submitted'
              ? 'bg-primary/20 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {isReviewed ? <CheckCircle2 className="h-5 w-5" /> : number}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{milestone.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-1">{milestone.description}</p>
        </div>

        <Badge variant="outline" className={cfg.className}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {cfg.label}
        </Badge>

        {!isLocked && (isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />)}
      </button>

      {/* ─── Expanded content ─── */}
      {isExpanded && (
        <div className="border-t border-primary/20 p-5 space-y-5">
          {/* Deliverable prompt */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-accent mb-1">📋 Deliverable</h5>
            <p className="text-sm text-muted-foreground">{milestone.deliverable_prompt}</p>
          </div>

          {/* Submission textarea */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your milestone deliverable here…"
              className="min-h-[200px] resize-y bg-background/50 border-primary/30 focus:border-primary focus:ring-primary/30"
              disabled={isSubmitted}
            />
            <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
          </div>

          {/* File upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Attachments</span>
              {!isSubmitted && (
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="border-secondary/50 hover:border-secondary hover:bg-secondary/10 hover:text-secondary">
                  <Upload className="h-4 w-4 mr-1" /> Upload
                </Button>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp" />

            {fileUrls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fileUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/30 border border-primary/20 group">
                    <span className="text-primary">{getFileIcon(url)}</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm truncate hover:text-primary">
                      {url.split('/').pop()?.replace(/^\d+-[a-z0-9]+\./, '') || 'file'}
                    </a>
                    {!isSubmitted && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive" onClick={() => handleRemoveFile(url)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isSubmitted && !isReviewed && (
            <div className="flex flex-wrap gap-3 pt-3 border-t border-primary/20">
              <Button variant="outline" onClick={handleSave} disabled={saveDraft.isPending} className="border-muted-foreground/50 hover:border-primary hover:bg-primary/10 hover:text-primary">
                {saveDraft.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Draft
              </Button>
              <Button variant="neon" onClick={handleSubmit} disabled={isPending || !content.trim()}>
                {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submit for Feedback
              </Button>
            </div>
          )}

          {/* Revision button for reviewed milestones */}
          {(isSubmitted || isReviewed) && (
            <div className="pt-3 border-t border-primary/20">
              <Button variant="outline" onClick={handleResubmit} className="w-full border-secondary/50 hover:border-secondary hover:bg-secondary/10 hover:text-secondary group">
                <RefreshCw className="h-4 w-4 mr-2 group-hover:animate-spin" />
                Revise & Resubmit
              </Button>
            </div>
          )}

          {/* AI Feedback display */}
          {hasFeedback && (
            <div className="bg-success/5 border border-success/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-success" style={{ filter: 'drop-shadow(0 0 5px hsl(var(--success)))' }} />
                <h5 className="font-semibold text-success">AI Feedback</h5>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{submission?.ai_feedback}</div>
            </div>
          )}

          {/* Rubric scorecard */}
          {hasFeedback && submission && (
            <RubricScorecard submissionId={submission.id} courseId={courseId} />
          )}
        </div>
      )}
    </div>
  );
}
