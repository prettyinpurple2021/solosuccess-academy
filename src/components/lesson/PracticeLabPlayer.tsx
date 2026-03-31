/**
 * @file PracticeLabPlayer.tsx — Hands-On Practice Exercise Component
 * 
 * Renders a practice lab within the lesson viewer. Students see:
 * 1. The practice exercise title and instructions
 * 2. What they need to deliver (deliverable description)
 * 3. A text area + file upload to submit their work
 * 4. AI feedback once graded
 * 
 * This is separate from quizzes/worksheets — it's about DOING,
 * not answering questions. Students practice real skills like
 * writing copy, building spreadsheets, creating plans, etc.
 */
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/components/gamification/GamificationProvider';
import { uploadProjectFile } from '@/hooks/useProjects';
import {
  usePracticeSubmission,
  useSavePracticeDraft,
  useSubmitPractice,
  useRequestPracticeFeedback,
  type PracticeLab,
} from '@/hooks/usePracticeLabs';
import DOMPurify from 'dompurify';
import {
  Wrench,
  Clock,
  Target,
  Upload,
  X,
  FileText,
  Image,
  File,
  Send,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface PracticeLabPlayerProps {
  /** The practice lab data */
  lab: PracticeLab;
  /** Current user ID */
  userId: string;
  /** Course ID for file uploads */
  courseId: string;
}

/** Sanitize markdown-like content for display */
const formatContent = (text: string): string => {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^• (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*)/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p class="mb-3">')
    .replace(/$/, '</p>');

  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'li', 'ul', 'ol'],
    ALLOWED_ATTR: ['class'],
  });
};

export function PracticeLabPlayer({ lab, userId, courseId }: PracticeLabPlayerProps) {
  const { toast } = useToast();
  const { awardXP, checkAndAwardBadges } = useGamification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing submission
  const { data: submission, isLoading: submissionLoading } = usePracticeSubmission(userId, lab.id);

  // Mutations
  const saveDraft = useSavePracticeDraft();
  const submitPractice = useSubmitPractice();
  const requestFeedback = useRequestPracticeFeedback();

  // Local state
  const [content, setContent] = useState('');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing submission data
  useEffect(() => {
    if (submission) {
      setContent(submission.submission_content || '');
      setFileUrls(submission.file_urls || []);
    }
  }, [submission]);

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';
  const isGraded = submission?.status === 'graded';

  /** Auto-save draft every 30 seconds while typing */
  useEffect(() => {
    if (isSubmitted || !content.trim()) return;

    const timer = setTimeout(async () => {
      try {
        await saveDraft.mutateAsync({
          userId,
          practiceLabId: lab.id,
          submissionContent: content,
          fileUrls,
        });
      } catch {
        // Silent auto-save failure
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [content, fileUrls, userId, lab.id, isSubmitted]);

  /** Save draft manually */
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveDraft.mutateAsync({
        userId,
        practiceLabId: lab.id,
        submissionContent: content,
        fileUrls,
      });
      toast({ title: 'Draft saved', description: 'Your progress has been saved.' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  /** Submit for grading */
  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please complete your practice work before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Submit the practice work
      const result = await submitPractice.mutateAsync({
        userId,
        practiceLabId: lab.id,
        submissionContent: content,
        fileUrls,
      });

      // Award XP for submitting practice work
      await awardXP('LESSON_COMPLETE');
      setTimeout(() => checkAndAwardBadges(), 1000);

      toast({
        title: '🎉 Practice submitted!',
        description: 'Requesting AI feedback on your work...',
      });

      // Request AI feedback
      try {
        await requestFeedback.mutateAsync({
          submissionId: result.id,
          userId,
          practiceLabId: lab.id,
        });
        toast({
          title: '✅ Feedback received!',
          description: 'Check your AI feedback below.',
        });
      } catch {
        toast({
          title: 'Feedback pending',
          description: 'AI feedback will be available shortly.',
        });
      }
    } catch {
      toast({
        title: 'Submission failed',
        description: 'Could not submit your work. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /** Handle file upload */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'File too large', description: `${file.name} exceeds 10MB`, variant: 'destructive' });
          continue;
        }
        const url = await uploadProjectFile(userId, courseId, file);
        newUrls.push(url);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      setFileUrls(prev => [...prev, ...newUrls]);
      toast({ title: 'Files uploaded', description: `${newUrls.length} file(s) attached` });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /** Get icon for file type */
  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <Image className="h-4 w-4" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  /** Difficulty badge color */
  const getDifficultyColor = () => {
    switch (lab.difficulty) {
      case 'beginner': return 'bg-success/20 text-success border-success/30';
      case 'advanced': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-warning/20 text-warning border-warning/30';
    }
  };

  if (submissionLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Practice Lab Header */}
      <div className="glass-card p-6 border-accent/30 bg-accent/5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center shadow-[0_0_20px_hsl(var(--accent)/0.3)] flex-shrink-0">
            <Wrench className="h-6 w-6 text-accent" style={{ filter: 'drop-shadow(0 0 5px hsl(var(--accent)))' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-display font-semibold text-accent" style={{ textShadow: '0 0 10px hsl(var(--accent)/0.5)' }}>
                🔬 Practice Lab
              </h3>
              <Badge className={getDifficultyColor()}>
                {lab.difficulty}
              </Badge>
              {isGraded && submission?.score !== null && (
                <Badge className="bg-success/20 text-success border-success/30 shadow-[0_0_10px_hsl(var(--success)/0.3)]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Score: {submission.score}%
                </Badge>
              )}
              {isSubmitted && !isGraded && (
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
            </div>
            <h4 className="text-xl font-semibold text-foreground mb-2">{lab.title}</h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                ~{lab.estimated_minutes} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card p-6">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          What You'll Practice
        </h4>
        <div
          className="prose prose-invert max-w-none text-foreground/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatContent(lab.instructions) }}
        />
      </div>

      {/* Deliverable */}
      <div className="glass-card p-6 border-secondary/30 bg-secondary/5">
        <h4 className="font-semibold text-secondary mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          What to Submit
        </h4>
        <p className="text-foreground/80 leading-relaxed">{lab.deliverable_description}</p>
      </div>

      {/* Submission Area */}
      <div className="glass-card p-6 space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <Wrench className="h-4 w-4 text-accent" />
          Your Work
        </h4>

        {/* Text area for submission */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your work here... Write your deliverable, share your thinking process, and explain your approach."
          className="min-h-[200px] resize-y bg-background/50 border-primary/30 focus:border-accent focus:ring-accent/30 transition-all"
          disabled={isSubmitted}
        />
        <p className="text-xs text-muted-foreground">{content.length} characters</p>

        {/* File Upload */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Supporting Files</label>
            {!isSubmitted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="border-secondary/50 hover:border-secondary hover:bg-secondary/10 hover:text-secondary transition-all"
              >
                <Upload className="h-4 w-4 mr-2" />
                Attach Files
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,.csv"
          />

          {isUploading && (
            <div className="mb-3">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
            </div>
          )}

          {fileUrls.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {fileUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-background/30 border border-primary/20 group">
                  <div className="text-primary">{getFileIcon(url)}</div>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm truncate hover:text-primary transition-colors">
                    {url.split('/').pop()?.replace(/^\d+-[a-z0-9]+\./, '') || 'File'}
                  </a>
                  {!isSubmitted && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => setFileUrls(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground border border-dashed border-primary/30 rounded-lg p-4 text-center bg-background/20">
              Attach screenshots, documents, or files that demonstrate your work.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isSubmitted && (
          <div className="flex gap-3 pt-4 border-t border-primary/20">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || !content.trim()}
              className="gap-2 border-primary/30 hover:border-primary"
            >
              {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </Button>
            <Button
              variant="neon"
              onClick={handleSubmit}
              disabled={isSaving || !content.trim()}
              className="gap-2 flex-1"
            >
              {submitPractice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit for Grading
            </Button>
          </div>
        )}

        {/* Resubmit option */}
        {isSubmitted && !isGraded && (
          <div className="pt-4 border-t border-primary/20 text-center">
            <p className="text-sm text-muted-foreground mb-2">Your work has been submitted and is being reviewed.</p>
          </div>
        )}
      </div>

      {/* AI Feedback Section */}
      {submission?.ai_feedback && (
        <div className="glass-card border-success/30 overflow-hidden">
          <div className="p-6 border-b border-success/20 bg-success/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center shadow-[0_0_15px_hsl(var(--success)/0.3)]">
                <Sparkles className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="font-semibold text-success">AI Feedback</h4>
                {submission.score !== null && (
                  <p className="text-sm text-muted-foreground">Score: {submission.score}/100</p>
                )}
              </div>
              {submission.score !== null && (
                <Badge className="ml-auto bg-success/20 text-success border-success/30">
                  {submission.score >= 80 ? '🌟 Excellent' : submission.score >= 60 ? '👍 Good' : '📝 Needs Work'}
                </Badge>
              )}
            </div>
          </div>
          <div className="p-6">
            <div
              className="prose prose-invert max-w-none text-foreground prose-headings:text-primary prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: formatContent(submission.ai_feedback) }}
            />
          </div>

          {/* Allow revision after feedback */}
          {isGraded && (
            <div className="p-4 border-t border-success/20 bg-background/30">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Reset to allow revision
                  // The student can edit and resubmit
                }}
                className="gap-2 border-accent/50 hover:border-accent"
              >
                <RotateCcw className="h-4 w-4" />
                Revise & Resubmit
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
