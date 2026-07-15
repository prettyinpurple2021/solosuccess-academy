/**
 * @file AdminPlatformSettings.tsx — Admin: Platform Settings hub.
 *
 * Consolidates admin-tunable knobs that don't have their own page:
 *  • Grade Weights — global default + per-course overrides
 *    (reads via get_grade_settings RPC, saves via admin RLS on the table).
 *  • XP Config — edit XP amount per gamification action.
 *  • Maintenance — inspect and purge expired API rate-limit buckets.
 *
 * Route: /admin/platform-settings  (admin-only via AdminLayout guard).
 */
import { useMemo, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { Trash2, Save, RefreshCw, ShieldAlert } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import {
  useGradeSettings,
  useUpdateGradeSettings,
  useDeleteGradeSettingsOverride,
  getWeightsForCourse,
} from '@/hooks/useGradeSettings';
import {
  useAdminXpConfig,
  useUpdateXpConfig,
  useRecentRateLimits,
  useCleanupRateLimits,
} from '@/hooks/useAdminPlatformSettings';
import { useToast } from '@/hooks/use-toast';

// ────────────────────────────────────────────
// Grade Weights editor — global + per course
// ────────────────────────────────────────────

type WeightForm = {
  quizWeight: number;
  activityWeight: number;
  worksheetWeight: number;
  examWeight: number;
  essayWeight: number;
  projectWeight: number;
};

function weightsTotal(w: WeightForm) {
  return w.quizWeight + w.activityWeight + w.worksheetWeight + w.examWeight + w.essayWeight + w.projectWeight;
}

function GradeWeightsEditor({
  title,
  description,
  courseId,
  initial,
  allowDelete,
}: {
  title: string;
  description: string;
  courseId: string | null;
  initial: WeightForm;
  allowDelete?: boolean;
}) {
  const [form, setForm] = useState<WeightForm>(initial);
  const save = useUpdateGradeSettings();
  const del = useDeleteGradeSettingsOverride();
  const { toast } = useToast();

  useEffect(() => setForm(initial), [initial]);

  const total = weightsTotal(form);
  const balanced = total === 100;

  const set = (k: keyof WeightForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    setForm((f) => ({ ...f, [k]: n }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{title}</span>
          <Badge variant={balanced ? 'secondary' : 'destructive'}>Total: {total}%</Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {(
            [
              ['Quizzes', 'quizWeight'],
              ['Activities', 'activityWeight'],
              ['Worksheets', 'worksheetWeight'],
              ['Final Exam', 'examWeight'],
              ['Final Essay', 'essayWeight'],
              ['Capstone Project', 'projectWeight'],
            ] as const
          ).map(([label, key]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form[key]}
                onChange={set(key)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              if (!balanced) {
                toast({
                  title: 'Weights must total 100%',
                  description: `Currently at ${total}%.`,
                  variant: 'destructive',
                });
                return;
              }
              save.mutate({ courseId, ...form });
            }}
            disabled={save.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {save.isPending ? 'Saving…' : 'Save weights'}
          </Button>
          {allowDelete && courseId && (
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Remove this override? The course will fall back to the global defaults.')) {
                  del.mutate(courseId);
                }
              }}
              disabled={del.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove override
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GradeWeightsTab() {
  const { data: settings, isLoading } = useGradeSettings();
  const { data: courses } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const globalWeights: WeightForm = useMemo(() => {
    const w = getWeightsForCourse(settings, undefined);
    return { ...w };
  }, [settings]);

  const perCourseWeights: WeightForm = useMemo(() => {
    if (!selectedCourseId) return globalWeights;
    return { ...getWeightsForCourse(settings, selectedCourseId) };
  }, [settings, selectedCourseId, globalWeights]);

  const overrideExists = !!settings?.some((s) => s.courseId === selectedCourseId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <NeonSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GradeWeightsEditor
        title="Global defaults"
        description="Applied to every course that doesn't have its own override. Must total 100%."
        courseId={null}
        initial={globalWeights}
      />

      <Card>
        <CardHeader>
          <CardTitle>Per-course overrides</CardTitle>
          <CardDescription>
            Pick a course to set weights that only apply to that course. Deleting an override
            reverts the course to the global defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 max-w-md">
            <Label className="text-xs">Course</Label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a course…</option>
              {(courses || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {selectedCourseId && (
            <GradeWeightsEditor
              key={selectedCourseId}
              title={overrideExists ? 'Override active' : 'No override yet — save to create one'}
              description={
                overrideExists
                  ? 'This course uses the values below instead of the global defaults.'
                  : 'These values are the current effective weights (from global). Saving will create a course-specific override.'
              }
              courseId={selectedCourseId}
              initial={perCourseWeights}
              allowDelete={overrideExists}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// XP Config editor
// ────────────────────────────────────────────

function XpConfigTab() {
  const { data: rows, isLoading } = useAdminXpConfig();
  const update = useUpdateXpConfig();
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!rows) return;
    setDrafts(Object.fromEntries(rows.map((r) => [r.id, r.xp_amount])));
  }, [rows]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <NeonSpinner size="md" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>XP rewards</CardTitle>
        <CardDescription>
          Change how much XP each action awards. Applies immediately to new awards; existing totals
          are not retroactively recalculated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {(rows || []).map((r) => {
          const val = drafts[r.id] ?? r.xp_amount;
          const dirty = val !== r.xp_amount;
          return (
            <div
              key={r.id}
              className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-md border border-border/60 bg-card/40"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.label || r.action_key}</div>
                <div className="text-xs text-muted-foreground font-mono truncate">{r.action_key}</div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={10000}
                  value={val}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [r.id]: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="w-28"
                />
                <span className="text-xs text-muted-foreground">XP</span>
                <Button
                  size="sm"
                  disabled={!dirty || update.isPending}
                  onClick={() => update.mutate({ id: r.id, xp_amount: val })}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          );
        })}
        {(!rows || rows.length === 0) && (
          <p className="text-sm text-muted-foreground">No XP config rows found.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────
// Maintenance tab — rate limit inspection
// ────────────────────────────────────────────

function MaintenanceTab() {
  const { data: buckets, isLoading, refetch } = useRecentRateLimits();
  const cleanup = useCleanupRateLimits();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            API rate-limit maintenance
          </CardTitle>
          <CardDescription>
            Rate-limit buckets are auto-created per user/IP + endpoint. Older-than-24h rows are safe
            to purge — they no longer affect any active window.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => cleanup.mutate()} disabled={cleanup.isPending}>
            <Trash2 className="h-4 w-4 mr-2" />
            {cleanup.isPending ? 'Cleaning…' : 'Purge expired buckets'}
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh list
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent buckets (top 100)</CardTitle>
          <CardDescription>Live view of the busiest recent rate-limit windows.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <NeonSpinner size="md" />
            </div>
          ) : !buckets || buckets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rate-limit activity recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Endpoint</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Identifier</th>
                    <th className="py-2 pr-3">Window start</th>
                    <th className="py-2 pr-3 text-right">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((b, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="py-2 pr-3 font-mono text-xs">{b.endpoint}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{b.identifier_type}</Badge>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs truncate max-w-[220px]">
                        {b.identifier}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {new Date(b.window_start).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">{b.request_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────
// Page shell
// ────────────────────────────────────────────

export default function AdminPlatformSettings() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <Helmet>
        <title>Platform Settings · Admin · SoloSuccess Academy</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Tunable knobs for grading, gamification, and platform maintenance.
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Grade Weights</TabsTrigger>
          <TabsTrigger value="xp">XP Config</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          <GradeWeightsTab />
        </TabsContent>
        <TabsContent value="xp">
          <XpConfigTab />
        </TabsContent>
        <TabsContent value="maintenance">
          <MaintenanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}