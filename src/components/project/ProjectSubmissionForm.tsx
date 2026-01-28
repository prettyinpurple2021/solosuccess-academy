import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/components/gamification/GamificationProvider';
import { 
  useCourseProject, 
  useSaveProjectDraft, 
  useSubmitProject, 
  useRequestFeedback,
  uploadProjectFile,
  deleteProjectFile 
} from '@/hooks/useProjects';
import { type Course } from '@/lib/courseData';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  File, 
  Save, 
  Send, 
  Sparkles,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface ProjectSubmissionFormProps {
  course: Course;
  userId: string;
}

export function ProjectSubmissionForm({ course, userId }: ProjectSubmissionFormProps) {
  const { toast } = useToast();
  const { awardXP, checkAndAwardBadges } = useGamification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: project, isLoading } = useCourseProject(userId, course.id);
  const saveDraft = useSaveProjectDraft();
  const submitProject = useSubmitProject();
  const requestFeedback = useRequestFeedback();

  const [content, setContent] = useState(project?.submission_content || '');
  const [fileUrls, setFileUrls] = useState<string[]>(project?.file_urls || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Sync content when project loads
  useState(() => {
    if (project) {
      setContent(project.submission_content || '');
      setFileUrls(project.file_urls || []);
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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

        const url = await uploadProjectFile(userId, course.id, file);
        newUrls.push(url);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      setFileUrls(prev => [...prev, ...newUrls]);
      toast({
        title: 'Files uploaded',
        description: `${newUrls.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async (url: string) => {
    try {
      await deleteProjectFile(url);
      setFileUrls(prev => prev.filter(u => u !== url));
      toast({
        title: 'File removed',
      });
    } catch (error) {
      toast({
        title: 'Failed to remove file',
        variant: 'destructive',
      });
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft.mutateAsync({
        userId,
        courseId: course.id,
        submissionContent: content,
        fileUrls,
      });
      toast({
        title: 'Draft saved',
        description: 'Your progress has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Failed to save',
        description: 'Could not save your draft. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please add your project submission content.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { projectId } = await submitProject.mutateAsync({
        userId,
        courseId: course.id,
        submissionContent: content,
        fileUrls,
      });

      toast({
        title: 'Project submitted!',
        description: 'Requesting AI feedback...',
      });

      // Award XP for project submission
      await awardXP('PROJECT_SUBMIT');

      // Request AI feedback
      await requestFeedback.mutateAsync({ projectId, userId, courseId: course.id });

      toast({
        title: 'Feedback received!',
        description: 'Your AI feedback is ready to view.',
      });

      // Award XP for receiving feedback and check badges
      await awardXP('PROJECT_FEEDBACK');
      setTimeout(() => checkAndAwardBadges(), 1000);
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message || 'Could not submit your project. Please try again.',
        variant: 'destructive',
      });
    }
  };

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

  const getFileName = (url: string) => {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    // Remove timestamp prefix
    return fileName.replace(/^\d+-[a-z0-9]+\./, '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSubmitted = project?.status === 'submitted' || project?.status === 'reviewed';
  const hasFeedback = !!project?.ai_feedback;

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="glass-card border-accent/30 bg-accent/5 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold neon-text">{course.project_title}</h3>
            {project?.status && (
              <Badge 
                variant={project.status === 'reviewed' ? 'default' : project.status === 'submitted' ? 'secondary' : 'outline'}
                className={
                  project.status === 'reviewed' 
                    ? 'bg-success/20 text-success border-success/30 shadow-[0_0_10px_hsl(var(--success)/0.3)]' 
                    : project.status === 'submitted'
                    ? 'bg-secondary/20 text-secondary border-secondary/30 shadow-[0_0_10px_hsl(var(--secondary)/0.3)]'
                    : 'border-muted-foreground/30'
                }
              >
                {project.status === 'reviewed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{course.project_description}</p>
        </div>
      </div>

      {/* Submission Form */}
      <div className="glass-card border-primary/30 overflow-hidden">
        <div className="p-6 border-b border-primary/20">
          <h3 className="text-lg font-semibold neon-text">Your Submission</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Write your project submission below. You can also attach files to support your work.
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Text Input */}
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your project submission here...

Include:
• Your approach and methodology
• Key decisions and rationale
• Results and outcomes
• Lessons learned"
              className="min-h-[300px] resize-y bg-background/50 border-primary/30 focus:border-primary focus:ring-primary/30 transition-all"
              disabled={isSubmitted}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {content.length} characters
            </p>
          </div>

          {/* File Upload */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">Attachments</label>
              {!isSubmitted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="border-secondary/50 hover:border-secondary hover:bg-secondary/10 hover:text-secondary transition-all"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
            />

            {isUploading && (
              <div className="mb-3">
                <Progress value={uploadProgress} className="h-2" style={{ boxShadow: '0 0 10px hsl(var(--primary)/0.5)' }} />
                <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
              </div>
            )}

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
                      {getFileName(url)}
                    </a>
                    {!isSubmitted && (
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
              <div className="text-sm text-muted-foreground border border-dashed border-primary/30 rounded-lg p-6 text-center bg-background/20">
                No files attached. Upload PDFs, documents, or images to support your submission.
              </div>
            )}
          </div>

          {/* Actions */}
          {!isSubmitted && (
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-primary/20">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saveDraft.isPending}
                className="border-muted-foreground/50 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all"
              >
                {saveDraft.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                variant="neon"
                onClick={handleSubmit}
                disabled={submitProject.isPending || requestFeedback.isPending || !content.trim()}
              >
                {submitProject.isPending || requestFeedback.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit for AI Feedback
              </Button>
            </div>
          )}

          {/* Re-submit option */}
          {isSubmitted && (
            <div className="pt-4 border-t border-primary/20">
              <Button
                variant="outline"
                onClick={() => {
                  // Allow re-editing
                  setContent(project?.submission_content || '');
                }}
                className="w-full border-secondary/50 hover:border-secondary hover:bg-secondary/10 hover:text-secondary transition-all group"
              >
                <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" style={{ filter: 'drop-shadow(0 0 5px hsl(var(--secondary)))' }} />
                Request New Feedback
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
