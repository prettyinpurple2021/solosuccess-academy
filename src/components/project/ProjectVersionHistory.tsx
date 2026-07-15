/**
 * ProjectVersionHistory — read-only accordion listing archived submissions
 * created every time a student resubmits after "needs revision".
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { History, Paperclip } from 'lucide-react';
import { useProjectVersions, type CourseProjectVersion } from '@/hooks/useProjects';

interface Props {
  projectId: string | undefined;
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusBadge(v: CourseProjectVersion) {
  if (v.admin_status === 'approved') {
    return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
  }
  if (v.admin_status === 'needs_revision') {
    return <Badge className="bg-warning/20 text-warning border-warning/30">Needs Revision</Badge>;
  }
  return <Badge variant="outline" className="border-muted-foreground/30">Pending</Badge>;
}

export function ProjectVersionHistory({ projectId }: Props) {
  const { data: versions = [], isLoading } = useProjectVersions(projectId);

  if (isLoading || versions.length === 0) return null;

  return (
    <div className="glass-card border-primary/20 overflow-hidden">
      <div className="p-6 border-b border-primary/10 flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold neon-text">Submission History</h3>
        <span className="text-sm text-muted-foreground ml-auto font-mono">
          {versions.length} previous {versions.length === 1 ? 'version' : 'versions'}
        </span>
      </div>
      <div className="p-4">
        <Accordion type="single" collapsible className="w-full">
          {versions.map((v) => (
            <AccordionItem key={v.id} value={v.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1 mr-4">
                  <span className="font-mono text-sm text-primary">v{v.version_number}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(v.submitted_at)}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {v.admin_score !== null && (
                      <span className="text-sm font-semibold">{v.admin_score}/100</span>
                    )}
                    {statusBadge(v)}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-2">
                  {v.submission_content && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Submission</p>
                      <div className="text-sm whitespace-pre-wrap bg-background/40 p-3 rounded border border-primary/10 max-h-64 overflow-y-auto">
                        {v.submission_content}
                      </div>
                    </div>
                  )}
                  {v.file_urls && v.file_urls.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1 flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> Attachments
                      </p>
                      <ul className="text-sm space-y-1">
                        {v.file_urls.map((u, i) => (
                          <li key={i}>
                            <a href={u} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                              {u.split('/').pop()}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {v.admin_notes && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Admin notes</p>
                      <p className="text-sm whitespace-pre-wrap">{v.admin_notes}</p>
                    </div>
                  )}
                  {v.ai_feedback && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">Show AI feedback</summary>
                      <p className="whitespace-pre-wrap mt-2">{v.ai_feedback}</p>
                    </details>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}