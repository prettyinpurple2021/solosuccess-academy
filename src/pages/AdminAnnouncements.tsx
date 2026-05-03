/**
 * @file AdminAnnouncements.tsx — Admin CRUD page for site-wide announcement
 * banners. Lets admins compose, schedule, edit, deactivate, and delete
 * announcements that appear at the top of the authenticated app shell.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  useAdminAnnouncements,
  useDeleteAnnouncement,
  useUpsertAnnouncement,
  type Announcement,
  type AnnouncementInput,
  type AnnouncementSeverity,
} from '@/hooks/useAnnouncements';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { NeonSpinner } from '@/components/ui/neon-spinner';

/** Convert an ISO timestamp to a value suitable for <input type="datetime-local">. */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  // strip seconds and timezone
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local string back to an ISO string. */
function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

const SEVERITY_BADGE: Record<AnnouncementSeverity, string> = {
  info: 'bg-info/20 text-info border-info/40',
  success: 'bg-success/20 text-success border-success/40',
  warning: 'bg-warning/20 text-warning border-warning/40',
};

function emptyForm(): AnnouncementInput {
  const now = new Date();
  return {
    title: '',
    body: '',
    severity: 'info',
    cta_label: '',
    cta_url: '',
    starts_at: now.toISOString(),
    ends_at: null,
    is_active: true,
  };
}

export default function AdminAnnouncements() {
  const { data: announcements, isLoading } = useAdminAnnouncements();
  const upsert = useUpsertAnnouncement();
  const remove = useDeleteAnnouncement();
  const { toast } = useToast();

  const [editing, setEditing] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);

  const isOpen = creating || !!editing;
  const initial: AnnouncementInput = useMemo(() => {
    if (editing) {
      return {
        id: editing.id,
        title: editing.title,
        body: editing.body ?? '',
        severity: editing.severity,
        cta_label: editing.cta_label ?? '',
        cta_url: editing.cta_url ?? '',
        starts_at: editing.starts_at,
        ends_at: editing.ends_at,
        is_active: editing.is_active,
      };
    }
    return emptyForm();
  }, [editing]);

  const close = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleSave = async (form: AnnouncementInput) => {
    if (!form.title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    try {
      await upsert.mutateAsync({
        ...form,
        title: form.title.trim(),
        body: form.body?.trim() || null,
        cta_label: form.cta_label?.trim() || null,
        cta_url: form.cta_url?.trim() || null,
      });
      toast({ title: form.id ? 'Announcement updated' : 'Announcement created' });
      close();
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement permanently?')) return;
    try {
      await remove.mutateAsync(id);
      toast({ title: 'Announcement deleted' });
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
          <Link to="/admin"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
          <Megaphone className="h-8 w-8 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }} />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold neon-text">Announcements</h1>
          <p className="text-muted-foreground">
            Broadcast banners shown at the top of the app for all signed-in students.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><NeonSpinner /></div>
      ) : !announcements || announcements.length === 0 ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="p-12 text-center text-muted-foreground">
            No announcements yet. Click <strong>New</strong> to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => {
            const now = new Date();
            const starts = new Date(a.starts_at);
            const ends = a.ends_at ? new Date(a.ends_at) : null;
            const isLive = a.is_active && starts <= now && (!ends || ends > now);
            return (
              <Card key={a.id} className="glass-card border-primary/20">
                <CardHeader className="pb-3 flex-row items-start gap-3 space-y-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <Badge variant="outline" className={SEVERITY_BADGE[a.severity]}>
                        {a.severity}
                      </Badge>
                      {isLive ? (
                        <Badge variant="outline" className="bg-success/20 text-success border-success/40 gap-1">
                          <Eye className="h-3 w-3" /> Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1">
                          <EyeOff className="h-3 w-3" /> {a.is_active ? 'Scheduled / Expired' : 'Inactive'}
                        </Badge>
                      )}
                    </div>
                    {a.body ? <p className="text-sm text-muted-foreground">{a.body}</p> : null}
                    <p className="text-xs font-mono text-muted-foreground mt-2">
                      {format(starts, 'PPp')} → {ends ? format(ends, 'PPp') : 'no end'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditing(a)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(a.id)}
                      aria-label="Delete"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>
          <AnnouncementForm
            key={editing?.id ?? 'new'}
            initial={initial}
            saving={upsert.isPending}
            onCancel={close}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Form ─────────────────────────────────────────────── */

function AnnouncementForm({
  initial,
  saving,
  onCancel,
  onSave,
}: {
  initial: AnnouncementInput;
  saving: boolean;
  onCancel: () => void;
  onSave: (form: AnnouncementInput) => void;
}) {
  const [form, setForm] = useState<AnnouncementInput>(initial);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ann-title">Title</Label>
        <Input
          id="ann-title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. New course just launched!"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ann-body">Body (optional)</Label>
        <Textarea
          id="ann-body"
          value={form.body ?? ''}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={3}
          placeholder="Optional supporting text shown under the title"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Severity</Label>
          <Select
            value={form.severity}
            onValueChange={(v: AnnouncementSeverity) => setForm({ ...form, severity: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info (blue)</SelectItem>
              <SelectItem value="success">Success (green)</SelectItem>
              <SelectItem value="warning">Warning (amber)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex flex-col">
          <Label>Active</Label>
          <div className="flex items-center gap-2 h-10">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm({ ...form, is_active: v })}
            />
            <span className="text-sm text-muted-foreground">
              {form.is_active ? 'Will show during window' : 'Hidden everywhere'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ann-cta-label">CTA label (optional)</Label>
          <Input
            id="ann-cta-label"
            value={form.cta_label ?? ''}
            onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
            placeholder="e.g. Learn more"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ann-cta-url">CTA URL (optional)</Label>
          <Input
            id="ann-cta-url"
            value={form.cta_url ?? ''}
            onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
            placeholder="/courses or https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ann-start">Start</Label>
          <Input
            id="ann-start"
            type="datetime-local"
            value={toDatetimeLocal(form.starts_at)}
            onChange={(e) =>
              setForm({ ...form, starts_at: fromDatetimeLocal(e.target.value) ?? new Date().toISOString() })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ann-end">End (optional)</Label>
          <Input
            id="ann-end"
            type="datetime-local"
            value={toDatetimeLocal(form.ends_at)}
            onChange={(e) => setForm({ ...form, ends_at: fromDatetimeLocal(e.target.value) })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  );
}