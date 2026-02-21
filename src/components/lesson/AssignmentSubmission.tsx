/**
 * @file AssignmentSubmission.tsx — In-Lesson Assignment Submission Form
 * 
 * Renders an inline submission form for assignment-type lessons.
 * Students can write a text response and upload supporting files.
 * The submission is stored in the user_progress table's `notes` field
 * and marks the lesson as complete upon submission.
 * 
 * Unlike the CourseProject submission, this is a simpler per-lesson
 * submission that doesn't go through AI feedback — it just records
 * the student's work and marks the lesson done.
 */
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMarkLessonComplete, useUpdateLessonNotes, useCourseProgress } from '@/hooks/useProgress';
import { useGamification } from '@/components/gamification/GamificationProvider';
import { uploadProjectFile } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { type Lesson } from '@/lib/courseData';
import {
  Upload,
  X,
  FileText,
  Image,
  File,
  Send,
  Loader2,
  CheckCircle2,
  PenLine,
} from 'lucide-react';

interface AssignmentSubmissionProps {
  /** The current assignment lesson */
  lesson: Lesson;
  /** Whether this lesson is already completed */
  isCompleted: boolean;
  /** Existing notes/submission content from user_progress */
  existingNotes: string | null;
}

/**
 * Inline assignment submission form shown inside the LessonViewer
 * for lessons with type === 'assignment'.
 * 
 * FLOW:
 * 1. Student writes their response in the textarea
 * 2. Optionally uploads supporting files
 * 3. Clicks "Submit Assignment" → saves notes + marks lesson complete
 */
export function AssignmentSubmission({ lesson, isCompleted, existingNotes }: AssignmentSubmissionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardXP, checkAndAwardBadges } = useGamification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mutations for saving progress
  const markComplete = useMarkLessonComplete();
  const updateNotes = useUpdateLessonNotes();

  // Local state
  const [content, setContent] = useState(existingNotes || '');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Handle file upload to Supabase Storage */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user?.id) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 10MB limit`,
            variant: 'destructive',
          });
          continue;
        }

        const url = await uploadProjectFile(user.id, lesson.course_id, file);
        newUrls.push(url);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      setFileUrls(prev => [...prev, ...newUrls]);
      toast({
        title: 'Files uploaded',
        description: `${newUrls.length} file(s) attached successfully`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Could not upload files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /** Remove a file from the attachment list */
  const handleRemoveFile = (url: string) => {
    setFileUrls(prev => prev.filter(u => u !== url));
  };

  /** Submit the assignment — saves notes and marks lesson complete */
  const handleSubmit = async () => {
    if (!user?.id || !content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please write your assignment response before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the full submission text (content + file links)
      const fullSubmission = fileUrls.length > 0
        ? `${content}\n\n---\nAttached files:\n${fileUrls.map(u => `- ${u}`).join('\n')}`
        : content;

      // Save the submission as notes on the progress record
      await updateNotes.mutateAsync({
        userId: user.id,
        lessonId: lesson.id,
        notes: fullSubmission,
      });

      // Mark the lesson as complete if not already
      if (!isCompleted) {
        await markComplete.mutateAsync({
          userId: user.id,
          lessonId: lesson.id,
          completed: true,
        });

        // Award XP for completing the assignment
        await awardXP('LESSON_COMPLETE');
        setTimeout(() => checkAndAwardBadges(), 1000);
      }

      toast({
        title: '✅ Assignment submitted!',
        description: 'Your work has been saved and the lesson is marked complete.',
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Could not submit your assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Get the right icon based on file extension */
  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Assignment Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shadow-[0_0_15px_hsl(var(--accent)/0.3)]">
          <PenLine className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Your Assignment</h3>
          <p className="text-sm text-muted-foreground">
            {isCompleted ? 'You\'ve already submitted this assignment.' : 'Write your response and submit when ready.'}
          </p>
        </div>
        {isCompleted && (
          <Badge className="ml-auto bg-success/20 text-success border-success/30 shadow-[0_0_10px_hsl(var(--success)/0.3)]">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        )}
      </div>

      {/* Submission Textarea */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Write your assignment response here...\n\nConsider:\n• What approach did you take?\n• What did you learn?\n• How would you apply this?`}
        className="min-h-[250px] resize-y bg-background/50 border-primary/30 focus:border-accent focus:ring-accent/30 transition-all"
        disabled={isCompleted && !content}
      />
      <p className="text-xs text-muted-foreground">{content.length} characters</p>

      {/* File Upload Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-foreground">Supporting Files</label>
          {!isCompleted && (
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
        />

        {/* Upload progress bar */}
        {isUploading && (
          <div className="mb-3">
            <Progress value={uploadProgress} className="h-2" style={{ boxShadow: '0 0 10px hsl(var(--primary)/0.5)' }} />
            <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
          </div>
        )}

        {/* Attached files list */}
        {fileUrls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fileUrls.map((url, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg bg-background/30 border border-primary/20 hover:border-primary/40 transition-all group"
              >
                <div className="text-primary">{getFileIcon(url)}</div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm truncate hover:text-primary transition-colors"
                >
                  {url.split('/').pop()?.replace(/^\d+-[a-z0-9]+\./, '') || 'File'}
                </a>
                {!isCompleted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
                    onClick={() => handleRemoveFile(url)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border border-dashed border-primary/30 rounded-lg p-4 text-center bg-background/20">
            No files attached yet. Upload PDFs, documents, or images to support your work.
          </div>
        )}
      </div>

      {/* Submit Button */}
      {!isCompleted && (
        <div className="pt-4 border-t border-primary/20">
          <Button
            variant="neon"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="w-full gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Submit Assignment
          </Button>
        </div>
      )}

      {/* Re-submit option if already completed */}
      {isCompleted && (
        <div className="pt-4 border-t border-primary/20">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="w-full gap-2 border-secondary/50 hover:border-secondary hover:bg-secondary/10 hover:text-secondary transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Update Submission
          </Button>
        </div>
      )}
    </div>
  );
}
