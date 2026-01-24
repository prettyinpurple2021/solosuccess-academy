import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, CheckCircle2 } from 'lucide-react';
import { type CourseProject } from '@/hooks/useProjects';

interface ProjectFeedbackProps {
  project: CourseProject;
}

export function ProjectFeedback({ project }: ProjectFeedbackProps) {
  if (!project.ai_feedback) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Parse markdown-like content for display
  const formatFeedback = (content: string) => {
    return content
      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^• (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>')
      .replace(/^/, '<p class="mb-4">')
      .replace(/$/, '</p>');
  };

  return (
    <div className="glass-card border-success/30 overflow-hidden">
      <div className="p-6 border-b border-success/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center shadow-[0_0_20px_hsl(var(--success)/0.3)]">
              <Sparkles className="h-6 w-6 text-success" style={{ filter: 'drop-shadow(0 0 5px hsl(var(--success)))' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-success" style={{ textShadow: '0 0 10px hsl(var(--success)/0.5)' }}>AI Feedback</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {project.ai_feedback_at && formatDate(project.ai_feedback_at)}
              </p>
            </div>
          </div>
          <Badge className="bg-success/20 text-success border-success/30 shadow-[0_0_10px_hsl(var(--success)/0.3)]">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
        </div>
      </div>
      <div className="p-6">
        <div 
          className="prose prose-invert max-w-none text-foreground prose-headings:text-primary prose-strong:text-foreground prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: formatFeedback(project.ai_feedback) }}
        />
      </div>
    </div>
  );
}
