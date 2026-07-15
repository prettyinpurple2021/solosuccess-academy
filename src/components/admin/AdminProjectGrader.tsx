/**
 * AdminProjectGrader — admin-only panel for reviewing a submitted project
 * and assigning a score/status/notes. Pre-fills score from AI proposal.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Paperclip } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminGradeProject, useProjectById, useProjectVersions, type CourseProject } from '@/hooks/useProjects';
import { ProjectVersionHistory } from '@/components/project/ProjectVersionHistory';

type AdminStatus = 'pending' | 'approved' | 'needs_revision';

interface Props {
  projectId: string;
}

export function AdminProjectGrader({ projectId }: Props) {
  const { toast } = useToast();
  const { data: project, isLoading } = useProjectById(projectId);
  const grade = useAdminGradeProject();

  const [score, setScore] = useState<number>(0);
  const [status, setStatus] = useState<AdminStatus>('pending');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (!project) return;
    setScore(project.admin_score ?? project.ai_proposed_score ?? 70);
    setStatus(project.admin_status ?? 'pending');
    setNotes(project.admin_notes ?? '');
  }, [project?.id, project?.admin_status]);

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    if (status === 'pending') {
      toast({ title: 'Choose a decision', description: 'Select approved or needs revision.', variant: 'destructive' });
      return;
    }
    try {
      await grade.mutateAsync({ projectId: project.id, score, status, notes });
      toast({ title: 'Grade saved', description: 'Student can see your decision now.' });
    } catch (err: any) {
      toast({ title: 'Failed to save grade', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Submission preview */}
      <div className="glass-card border-primary/20 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold neon-text">Current Submission</h3>
          <Badge variant="outline" className="font-mono">Attempt #{project.current_version}</Badge>
        </div>
        {project.submission_content ? (
          <div className="text-sm whitespace-pre-wrap bg-background/40 p-4 rounded border border-primary/10 max-h-96 overflow-y-auto">
            {project.submission_content}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No text submission.</p>
        )}
        {project.file_urls && project.file_urls.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1 flex items-center gap-1">
              <Paperclip className="h-3 w-3" /> Attachments
            </p>
            <ul className="text-sm space-y-1">
              {project.file_urls.map((u, i) => (
                <li key={i}>
                  <a href={u} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                    {u.split('/').pop()}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {project.ai_feedback && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted-foreground">Show AI feedback (proposed score: {project.ai_proposed_score ?? '—'}/100)</summary>
            <p className="whitespace-pre-wrap mt-2">{project.ai_feedback}</p>
          </details>
        )}
      </div>

      {/* Grading form */}
      <div className="glass-card border-primary/30 p-6 space-y-6">
        <h3 className="text-lg font-semibold neon-text">Grade this submission</h3>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Score</label>
            <span className="text-2xl font-bold text-primary">{score}<span className="text-sm text-muted-foreground">/100</span></span>
          </div>
          <Slider
            value={[score]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => setScore(v[0])}
          />
          {project.ai_proposed_score !== null && (
            <p className="text-xs text-muted-foreground mt-2">AI proposed: {project.ai_proposed_score}/100</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Decision</label>
          <Select value={status} onValueChange={(v) => setStatus(v as AdminStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending (keep for later)</SelectItem>
              <SelectItem value="approved">Approve</SelectItem>
              <SelectItem value="needs_revision">Request revision</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-2">Notes for the student</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Explain your decision and what to improve if you're requesting a revision."
          />
        </div>

        <Button variant="neon" onClick={handleSave} disabled={grade.isPending}>
          {grade.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Grade
        </Button>
      </div>

      <ProjectVersionHistory projectId={project.id} />
    </div>
  );
}