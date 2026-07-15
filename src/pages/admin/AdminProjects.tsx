/**
 * AdminProjects — admin queue of student project submissions.
 * Left: filterable list. Right: grading panel for the selected project.
 */
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminProjectSubmissions, type AdminProjectRow } from '@/hooks/useProjects';
import { AdminProjectGrader } from '@/components/admin/AdminProjectGrader';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { FolderCheck } from 'lucide-react';

type Filter = 'all' | 'pending' | 'approved' | 'needs_revision';

function statusBadge(row: AdminProjectRow) {
  if (row.admin_status === 'approved')
    return <Badge className="bg-success/20 text-success border-success/30">Approved</Badge>;
  if (row.admin_status === 'needs_revision')
    return <Badge className="bg-warning/20 text-warning border-warning/30">Needs Revision</Badge>;
  return <Badge className="bg-secondary/20 text-secondary border-secondary/30">Pending</Badge>;
}

export default function AdminProjects() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useAdminProjectSubmissions({
    status: filter === 'all' ? undefined : filter,
  });

  return (
    <div className="p-6 md:p-8 space-y-6">
      <Helmet>
        <title>Project Submissions — Admin</title>
      </Helmet>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold neon-text flex items-center gap-2">
            <FolderCheck className="h-6 w-6 text-primary" /> Project Submissions
          </h1>
          <p className="text-sm text-muted-foreground">Review student submissions and assign grades.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filter:</label>
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending review</SelectItem>
              <SelectItem value="needs_revision">Needs revision</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-6">
        <div className="glass-card border-primary/20 overflow-hidden">
          <div className="p-4 border-b border-primary/10 text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${rows.length} submission${rows.length === 1 ? '' : 's'}`}
          </div>
          <ul className="max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <li className="p-6 flex justify-center"><NeonSpinner size="sm" /></li>
            ) : rows.length === 0 ? (
              <li className="p-6 text-sm text-muted-foreground text-center">No submissions match this filter.</li>
            ) : (
              rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full text-left p-4 border-b border-primary/10 hover:bg-primary/5 transition-colors ${
                      selectedId === row.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium truncate">{row.student_name}</span>
                      {statusBadge(row)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{row.course_title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                      <span>Attempt #{row.current_version}</span>
                      <span>
                        {row.admin_score !== null
                          ? `${row.admin_score}/100`
                          : row.ai_proposed_score !== null
                            ? `AI: ${row.ai_proposed_score}`
                            : '—'}
                      </span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          {selectedId ? (
            <AdminProjectGrader projectId={selectedId} />
          ) : (
            <div className="glass-card border-primary/20 p-12 text-center text-muted-foreground">
              Select a submission to review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}