import DOMPurify from 'dompurify';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, CheckCircle2, Award, AlertTriangle } from 'lucide-react';
import { type CourseProject } from '@/hooks/useProjects';

interface ProjectFeedbackProps {
  project: CourseProject;
}

// Sanitize and format feedback content to prevent XSS attacks
const formatFeedback = (content: string): string => {
  const formatted = content
    .replace(/## (.*)/g, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^• (.*)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>');
  
  return DOMPurify.sanitize(formatted, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h3', 'li', 'ul', 'ol'],
    ALLOWED_ATTR: ['class']
  });
};

export function ProjectFeedback({ project }: ProjectFeedbackProps) {
  const hasGrade = project.admin_status !== 'pending' && project.admin_score !== null;
  if (!project.ai_feedback && !hasGrade) {
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

  return (
    <div className="space-y-6">
      {hasGrade && <AdminGradeCard project={project} formatDate={formatDate} />}
      {project.ai_feedback && (
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
          {project.ai_proposed_score !== null && (
            <Badge className="bg-success/20 text-success border-success/30 shadow-[0_0_10px_hsl(var(--success)/0.3)]">
              AI Score: {project.ai_proposed_score}/100
            </Badge>
          )}
        </div>
      </div>
      <div className="p-6">
        <div 
          className="prose prose-invert max-w-none text-foreground prose-headings:text-primary prose-strong:text-foreground prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: formatFeedback(project.ai_feedback!) }}
        />
      </div>
        </div>
      )}
    </div>
  );
}

function AdminGradeCard({
  project,
  formatDate,
}: {
  project: CourseProject;
  formatDate: (d: string) => string;
}) {
  const approved = project.admin_status === 'approved';
  const wrapper = approved
    ? 'glass-card overflow-hidden border-success/30'
    : 'glass-card overflow-hidden border-warning/30';
  const headerBorder = approved ? 'p-6 border-b border-success/20' : 'p-6 border-b border-warning/20';
  const iconWrap = approved
    ? 'h-12 w-12 rounded-full bg-success/20 flex items-center justify-center shadow-[0_0_20px_hsl(var(--success)/0.3)]'
    : 'h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center shadow-[0_0_20px_hsl(var(--warning)/0.3)]';
  const iconClass = approved ? 'h-6 w-6 text-success' : 'h-6 w-6 text-warning';
  const titleClass = approved ? 'text-lg font-semibold text-success' : 'text-lg font-semibold text-warning';
  const scoreClass = approved ? 'text-3xl font-bold text-success' : 'text-3xl font-bold text-warning';

  return (
    <div className={wrapper}>
      <div className={`${headerBorder} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={iconWrap}>
            {approved ? <Award className={iconClass} /> : <AlertTriangle className={iconClass} />}
          </div>
          <div>
            <h3 className={titleClass}>
              {approved ? 'Approved by Admin' : 'Revisions Requested'}
            </h3>
            {project.graded_at && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {formatDate(project.graded_at)}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={scoreClass}>
            {project.admin_score}
            <span className="text-base text-muted-foreground">/100</span>
          </div>
        </div>
      </div>
      {project.admin_notes && (
        <div className="p-6">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Admin notes</p>
          <p className="text-foreground whitespace-pre-wrap">{project.admin_notes}</p>
        </div>
      )}
    </div>
  );
}
