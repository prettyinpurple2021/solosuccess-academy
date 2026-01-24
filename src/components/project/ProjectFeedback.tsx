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
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Feedback</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {project.ai_feedback_at && formatDate(project.ai_feedback_at)}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-success/10 text-success border-success/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="prose prose-invert max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: formatFeedback(project.ai_feedback) }}
        />
      </CardContent>
    </Card>
  );
}
