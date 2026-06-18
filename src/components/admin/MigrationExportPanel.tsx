/**
 * MigrationExportPanel — Comprehensive export tool for migration.
 *
 * EXPORTS (all bundled in one timestamped ZIP):
 *  • Tables  — grouped + selectable (content / user data / comms / system)
 *  • Formats — CSV, JSON, and/or SQL INSERTs (pick any combination)
 *  • Storage — actual files from every bucket (avatars, course-assets, …)
 *  • Metadata — manifest of edge functions, secrets (names only), buckets,
 *               counts per table, plus a README with import instructions.
 *
 * WHY: The Lovable Cloud UI only exports tables one CSV at a time. This
 *      packages everything you need to rehydrate a fresh Supabase project
 *      in a single click.
 */

import { useState } from "react";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  HardDrive,
  FileJson,
  FileCode,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Table groups. Order matters within "content"
// (parents first so FK imports resolve).
// ──────────────────────────────────────────────
const TABLE_GROUPS = {
  content: {
    label: "Course Content",
    description: "Courses, lessons, textbooks, projects, blog. Authored material.",
    defaultOn: true,
    tables: [
      "courses",
      "lessons",
      "textbook_chapters",
      "textbook_chapter_objectives",
      "textbook_pages",
      "practice_labs",
      "course_projects",
      "project_milestones",
      "project_rubric_categories",
      "course_final_exams",
      "course_essays",
      "blog_posts",
      "blog_topic_queue",
      "announcements",
      "achievement_badges",
      "xp_config",
      "grade_settings",
      "testimonials",
    ],
  },
  users: {
    label: "User Data",
    description: "Profiles, roles, progress, purchases, gamification. Empty if no real users yet.",
    defaultOn: false,
    tables: [
      "profiles",
      "user_roles",
      "user_progress",
      "user_gamification",
      "user_badges",
      "user_flashcards",
      "user_objective_progress",
      "user_textbook_bookmarks",
      "user_textbook_highlights",
      "student_notes",
      "reading_sessions",
      "continue_later",
      "purchases",
      "certificates",
      "portfolio_entries",
      "practice_submissions",
      "project_milestone_submissions",
      "project_rubric_scores",
      "student_essay_submissions",
      "student_exam_attempts",
      "discussions",
      "discussion_comments",
      "discussion_votes",
      "textbook_comments",
      "ai_chat_sessions",
      "ai_chat_messages",
    ],
  },
  comms: {
    label: "Communications & Logs",
    description: "Notifications, email logs, contact form, newsletter, unsubscribe tokens.",
    defaultOn: false,
    tables: [
      "notifications",
      "newsletter_subscribers",
      "contact_submissions",
      "email_send_log",
      "email_send_state",
      "email_unsubscribe_tokens",
      "lifecycle_emails_sent",
      "suppressed_emails",
      "announcement_dismissals",
    ],
  },
  system: {
    label: "System & Security",
    description: "API keys (encrypted), rate limits, webhook events, MFA codes. Usually skip.",
    defaultOn: false,
    tables: [
      "admin_api_keys",
      "api_rate_limits",
      "stripe_webhook_events",
      "webhook_alert_state",
      "mfa_recovery_codes",
      "account_deletion_requests",
    ],
  },
} as const;

type GroupKey = keyof typeof TABLE_GROUPS;

const STORAGE_BUCKETS = [
  { name: "avatars", public: false },
  { name: "course-assets", public: true },
  { name: "lesson-videos", public: false },
  { name: "project-files", public: false },
] as const;

const EDGE_FUNCTIONS = [
  "ai-tutor", "auth-email-hook", "blog-sitemap", "bulk-generate-assessments",
  "bulk-generate-lessons", "bulk-generate-supplemental", "bulk-generate-textbooks",
  "check-student-progress", "check-video-status", "check-webhook-health",
  "create-checkout", "delete-user-account", "explain-text", "generate-blog-post",
  "generate-content", "generate-image", "generate-video", "generate-voice",
  "get-leaderboard", "handle-email-suppression", "handle-email-unsubscribe",
  "manage-api-keys", "manage-email-preferences", "milestone-feedback",
  "notify-discussion-reply", "practice-feedback", "preview-transactional-email",
  "process-email-queue", "project-feedback", "send-notification-email",
  "send-transactional-email", "stripe-webhook", "submit-contact", "verify-certificate",
];

const REQUIRED_SECRETS = [
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "LOVABLE_API_KEY",
  "RESEND_API_KEY (or SMTP_HOST/USER/PASSWORD/PORT)", "TURNSTILE_SECRET_KEY",
  "API_KEYS_ENCRYPTION_KEY", "CRON_JOB_SECRET",
];

// ──────────────────────────────────────────────
// CSV helpers (RFC 4180)
// ──────────────────────────────────────────────
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );
  return [headers.join(","), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))].join("\n");
}

// ──────────────────────────────────────────────
// SQL INSERT helpers — produces an idempotent
// script: INSERT ... ON CONFLICT (id) DO NOTHING.
// ──────────────────────────────────────────────
function sqlEscape(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function rowsToSql(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `-- ${table}: no rows\n`;
  const headers = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );
  const cols = headers.map((h) => `"${h}"`).join(", ");
  const lines = [`-- ${table} (${rows.length} rows)`];
  for (const row of rows) {
    const vals = headers.map((h) => sqlEscape(row[h])).join(", ");
    lines.push(`INSERT INTO public."${table}" (${cols}) VALUES (${vals})${"id" in row ? ' ON CONFLICT ("id") DO NOTHING' : ""};`);
  }
  return lines.join("\n") + "\n";
}

interface TableResult {
  table: string;
  rows: number;
  status: "pending" | "done" | "error" | "skipped";
  error?: string;
}

interface StorageResult {
  bucket: string;
  files: number;
  status: "pending" | "done" | "error";
  error?: string;
}

export function MigrationExportPanel() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TableResult[]>([]);
  const [storageResults, setStorageResults] = useState<StorageResult[]>([]);

  // Selection state
  const [groups, setGroups] = useState<Record<GroupKey, boolean>>(() => {
    const o = {} as Record<GroupKey, boolean>;
    (Object.keys(TABLE_GROUPS) as GroupKey[]).forEach((k) => (o[k] = TABLE_GROUPS[k].defaultOn));
    return o;
  });
  const [formats, setFormats] = useState({ csv: true, json: true, sql: false });
  const [includeStorage, setIncludeStorage] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const selectedTables = (Object.keys(TABLE_GROUPS) as GroupKey[])
    .filter((g) => groups[g])
    .flatMap((g) => TABLE_GROUPS[g].tables.map((t) => ({ table: t, group: g })));

  const runExport = async () => {
    if (selectedTables.length === 0 && !includeStorage && !includeMetadata) {
      toast.error("Pick at least one thing to export");
      return;
    }
    if (!formats.csv && !formats.json && !formats.sql && selectedTables.length > 0) {
      toast.error("Pick at least one table format");
      return;
    }

    setRunning(true);
    setProgress(0);
    const zip = new JSZip();
    const tableFolder = zip.folder("tables")!;
    const storageFolder = zip.folder("storage")!;
    const summary: string[] = ["table,group,rows,status,error"];
    const counts: Record<string, number> = {};

    setResults(selectedTables.map((t) => ({ table: t.table, rows: 0, status: "pending" })));
    setStorageResults(
      includeStorage ? STORAGE_BUCKETS.map((b) => ({ bucket: b.name, files: 0, status: "pending" })) : [],
    );

    const totalSteps = selectedTables.length + (includeStorage ? STORAGE_BUCKETS.length : 0) + 1;
    let step = 0;
    const tick = () => {
      step += 1;
      setProgress(Math.round((step / totalSteps) * 100));
    };

    // ── 1. Tables ────────────────────────────────
    for (let i = 0; i < selectedTables.length; i++) {
      const { table, group } = selectedTables[i];
      try {
        const { data, error } = await (supabase as any).from(table).select("*");
        if (error) throw error;
        const rows = (data ?? []) as Record<string, unknown>[];
        counts[table] = rows.length;
        const prefix = `${String(i + 1).padStart(2, "0")}_${table}`;
        if (formats.csv) tableFolder.file(`csv/${prefix}.csv`, rowsToCsv(rows));
        if (formats.json) tableFolder.file(`json/${prefix}.json`, JSON.stringify(rows, null, 2));
        if (formats.sql) tableFolder.file(`sql/${prefix}.sql`, rowsToSql(table, rows));
        summary.push(`${table},${group},${rows.length},ok,`);
        setResults((prev) =>
          prev.map((r) => (r.table === table ? { ...r, rows: rows.length, status: "done" } : r)),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        summary.push(`${table},${group},0,error,"${msg.replace(/"/g, '""')}"`);
        setResults((prev) =>
          prev.map((r) => (r.table === table ? { ...r, status: "error", error: msg } : r)),
        );
      }
      tick();
    }

    // ── 2. Storage buckets ───────────────────────
    if (includeStorage) {
      for (const bucket of STORAGE_BUCKETS) {
        try {
          const allFiles = await listAllFiles(bucket.name);
          for (const path of allFiles) {
            const { data, error } = await supabase.storage.from(bucket.name).download(path);
            if (error || !data) continue;
            storageFolder.file(`${bucket.name}/${path}`, data);
          }
          setStorageResults((prev) =>
            prev.map((r) => (r.bucket === bucket.name ? { ...r, files: allFiles.length, status: "done" } : r)),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          setStorageResults((prev) =>
            prev.map((r) => (r.bucket === bucket.name ? { ...r, status: "error", error: msg } : r)),
          );
        }
        tick();
      }
    }

    // ── 3. Metadata bundle ───────────────────────
    if (includeMetadata) {
      zip.file(
        "_metadata/edge-functions.json",
        JSON.stringify({ count: EDGE_FUNCTIONS.length, functions: EDGE_FUNCTIONS }, null, 2),
      );
      zip.file(
        "_metadata/secrets-required.json",
        JSON.stringify(
          {
            note: "Names only — VALUES are NEVER exported. Re-add these in the new project's Edge Function secrets.",
            secrets: REQUIRED_SECRETS,
          },
          null,
          2,
        ),
      );
      zip.file(
        "_metadata/storage-buckets.json",
        JSON.stringify({ buckets: STORAGE_BUCKETS }, null, 2),
      );
      zip.file("_metadata/table-counts.json", JSON.stringify(counts, null, 2));
    }
    tick();

    // ── 4. README + summary ──────────────────────
    zip.file("_SUMMARY.csv", summary.join("\n"));
    zip.file("_README.txt", buildReadme(selectedTables.length, formats, includeStorage));

    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.href = url;
      a.download = `solosuccess-migration-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const okCount = Object.keys(counts).length;
      toast.success(`Exported ${okCount} tables${includeStorage ? " + storage" : ""}`);
    } catch (err) {
      toast.error("Failed to build ZIP file");
      console.error(err);
    }

    setRunning(false);
  };

  return (
    <div className="mt-2 p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          Complete migration export
        </p>
        <p className="text-xs text-muted-foreground">
          Bundles tables, storage files, and metadata into one ZIP you can restore into any fresh Supabase project.
        </p>
      </div>

      {/* Table groups */}
      <div className="space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5" /> Tables
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          {(Object.keys(TABLE_GROUPS) as GroupKey[]).map((g) => {
            const grp = TABLE_GROUPS[g];
            return (
              <label
                key={g}
                className="flex items-start gap-2 p-2 rounded border border-border bg-background/60 cursor-pointer hover:border-primary/40"
              >
                <Checkbox
                  checked={groups[g]}
                  onCheckedChange={(v) => setGroups((p) => ({ ...p, [g]: v === true }))}
                  disabled={running}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">{grp.label}</span>
                    <Badge variant="outline" className="h-4 px-1 text-[10px] font-mono">
                      {grp.tables.length}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">{grp.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Formats */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Formats</p>
        <div className="flex flex-wrap gap-3">
          <FormatToggle
            icon={FileText}
            label="CSV"
            sub="Supabase importer"
            checked={formats.csv}
            onChange={(v) => setFormats((p) => ({ ...p, csv: v }))}
            disabled={running}
          />
          <FormatToggle
            icon={FileJson}
            label="JSON"
            sub="Lossless JSONB"
            checked={formats.json}
            onChange={(v) => setFormats((p) => ({ ...p, json: v }))}
            disabled={running}
          />
          <FormatToggle
            icon={FileCode}
            label="SQL"
            sub="INSERT statements"
            checked={formats.sql}
            onChange={(v) => setFormats((p) => ({ ...p, sql: v }))}
            disabled={running}
          />
        </div>
      </div>

      {/* Extras */}
      <div className="space-y-2">
        <p className="text-xs font-semibold">Extras</p>
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="flex items-start gap-2 p-2 rounded border border-border bg-background/60 cursor-pointer hover:border-primary/40">
            <Checkbox
              checked={includeStorage}
              onCheckedChange={(v) => setIncludeStorage(v === true)}
              disabled={running}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="text-xs font-medium flex items-center gap-1.5">
                <HardDrive className="h-3 w-3" /> Storage files
              </div>
              <p className="text-[10px] text-muted-foreground">Downloads every file from all 4 buckets.</p>
            </div>
          </label>
          <label className="flex items-start gap-2 p-2 rounded border border-border bg-background/60 cursor-pointer hover:border-primary/40">
            <Checkbox
              checked={includeMetadata}
              onCheckedChange={(v) => setIncludeMetadata(v === true)}
              disabled={running}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="text-xs font-medium">Metadata bundle</div>
              <p className="text-[10px] text-muted-foreground">Edge function list, secret names, bucket config, README.</p>
            </div>
          </label>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">
          {selectedTables.length} tables · {Object.values(formats).filter(Boolean).length} format(s)
          {includeStorage ? " · storage" : ""}
          {includeMetadata ? " · metadata" : ""}
        </p>
        <Button onClick={runExport} disabled={running} size="sm">
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting…
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download everything
            </>
          )}
        </Button>
      </div>

      {(running || results.length > 0) && (
        <div className="space-y-2">
          <Progress value={progress} className="h-1.5" />
          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-auto pr-1">
              {results.map((r) => (
                <RowStatus key={r.table} label={r.table} count={r.rows} status={r.status} running={running} error={r.error} />
              ))}
            </div>
          )}
          {storageResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-border">
              {storageResults.map((r) => (
                <RowStatus
                  key={r.bucket}
                  label={`📦 ${r.bucket}`}
                  count={r.files}
                  status={r.status}
                  running={running}
                  error={r.error}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────
function FormatToggle({
  icon: Icon,
  label,
  sub,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex items-center gap-2 p-2 rounded border border-border bg-background/60 cursor-pointer hover:border-primary/40 flex-1 min-w-[120px]">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} disabled={disabled} />
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </label>
  );
}

function RowStatus({
  label,
  count,
  status,
  running,
  error,
}: {
  label: string;
  count: number;
  status: TableResult["status"] | StorageResult["status"];
  running: boolean;
  error?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs gap-2 px-2 py-1 rounded bg-background/60 border border-border">
      <span className="font-mono truncate">{label}</span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {status === "done" && (
          <>
            <Badge variant="outline" className="h-5 px-1.5 font-mono">
              {count}
            </Badge>
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          </>
        )}
        {status === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive" aria-label={error} />}
        {status === "pending" && running && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
async function listAllFiles(bucket: string, prefix = ""): Promise<string[]> {
  // Supabase storage list isn't recursive — walk folders manually.
  const out: string[] = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return out;
  for (const entry of data) {
    if (!entry.name) continue;
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Folders have id === null
    if ((entry as any).id === null) {
      out.push(...(await listAllFiles(bucket, path)));
    } else {
      out.push(path);
    }
  }
  return out;
}

function buildReadme(tableCount: number, formats: { csv: boolean; json: boolean; sql: boolean }, withStorage: boolean) {
  return [
    "SoloSuccess Academy — Migration Export",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Tables: ${tableCount}`,
    `Formats: ${[formats.csv && "CSV", formats.json && "JSON", formats.sql && "SQL"].filter(Boolean).join(", ")}`,
    `Storage: ${withStorage ? "included" : "skipped"}`,
    "",
    "── HOW TO RESTORE ─────────────────────────",
    "",
    "1. Create schema in the new project by running",
    "   `supabase db push` against the migrations in",
    "   supabase/migrations/ from the GitHub repo.",
    "",
    "2. Load data — pick ONE format per table:",
    "   • CSV → Supabase Dashboard → Table Editor →",
    "     <table> → Insert → Import data from CSV.",
    "   • JSON → write a small script to bulk-insert,",
    "     or use psql with \\COPY ... FROM PROGRAM.",
    "   • SQL → run `psql -f tables/sql/NN_*.sql` in",
    "     numeric order. INSERTs are idempotent on id.",
    "",
    "3. Recreate storage buckets with the names and",
    "   public flag in _metadata/storage-buckets.json,",
    "   then upload the contents of storage/<bucket>/.",
    "",
    "4. Re-add edge function secrets — names are in",
    "   _metadata/secrets-required.json (values are",
    "   NOT exported for security; copy from your",
    "   current project's secret manager).",
    "",
    "── NOTES ──────────────────────────────────",
    "",
    "• JSONB columns are stringified in CSV. Importer",
    "  accepts them as-is.",
    "• SQL inserts use ON CONFLICT (id) DO NOTHING so",
    "  re-running is safe.",
    "• admin_api_keys.api_key_ciphertext is encrypted",
    "  with API_KEYS_ENCRYPTION_KEY — without the same",
    "  secret in the new project the keys are useless.",
    "• auth.users is NOT exported (managed by Supabase).",
    "  Users sign up fresh in the new project.",
  ].join("\n");
}

// ──────────────────────────────────────────────
// Tables to export. Order = recommended import
// order in the new project (parents first so
// foreign keys resolve cleanly).
// ──────────────────────────────────────────────
const EXPORT_TABLES: string[] = [
  // Top-level catalog
  "courses",
  // Children of courses
  "lessons",
  "textbook_chapters",
  "practice_labs",
  "course_projects",
  "course_final_exams",
  "course_essays",
  // Grandchildren
  "textbook_chapter_objectives",
  "textbook_pages",
  "project_milestones",
  "project_rubric_categories",
  // Standalone content
  "blog_posts",
  "blog_topic_queue",
  "announcements",
  "achievement_badges",
  "xp_config",
  "grade_settings",
  "testimonials",
];

// ──────────────────────────────────────────────
// CSV helpers — RFC 4180 quoting. JSON/objects
// are stringified so JSONB columns survive the
// round-trip.
// ──────────────────────────────────────────────
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (typeof value === "object") {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }
  if (/[",\n\r]/.test(str)) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  // Collect headers from union of keys to be safe with sparse rows
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

interface TableResult {
  table: string;
  rows: number;
  status: "pending" | "done" | "error";
  error?: string;
}

export function MigrationExportPanel() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TableResult[]>([]);

  const runExport = async () => {
    setRunning(true);
    setProgress(0);
    const initial: TableResult[] = EXPORT_TABLES.map((t) => ({
      table: t,
      rows: 0,
      status: "pending",
    }));
    setResults(initial);

    const zip = new JSZip();
    const summary: string[] = ["table,rows,status,error"];
    let okCount = 0;

    for (let i = 0; i < EXPORT_TABLES.length; i++) {
      const table = EXPORT_TABLES[i];
      try {
        // `as any` — table names aren't in the generated Database type union
        const { data, error } = await (supabase as any).from(table).select("*");
        if (error) throw error;
        const rows = (data ?? []) as Record<string, unknown>[];
        const csv = rowsToCsv(rows);
        const fileName = `${String(i + 1).padStart(2, "0")}_${table}.csv`;
        zip.file(fileName, csv);
        summary.push(`${table},${rows.length},ok,`);
        okCount += 1;
        setResults((prev) =>
          prev.map((r) =>
            r.table === table ? { ...r, rows: rows.length, status: "done" } : r
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        summary.push(`${table},0,error,"${msg.replace(/"/g, '""')}"`);
        setResults((prev) =>
          prev.map((r) =>
            r.table === table ? { ...r, status: "error", error: msg } : r
          )
        );
      }
      setProgress(Math.round(((i + 1) / EXPORT_TABLES.length) * 100));
    }

    // README and summary inside the zip for the user's reference
    zip.file("_SUMMARY.csv", summary.join("\n"));
    zip.file(
      "_README.txt",
      [
        "SoloSuccess Academy — Migration Export",
        `Generated: ${new Date().toISOString()}`,
        "",
        "Import these CSVs in numeric order via Supabase Dashboard →",
        "Table Editor → <table> → Insert → Import data from CSV.",
        "",
        "JSONB columns are serialized as JSON strings — Supabase's CSV",
        "importer accepts them as-is. If an import balks, open the CSV,",
        "confirm the column type, and retry.",
        "",
        "Skipped (user-specific, recreated empty in new project):",
        "  profiles, user_roles, user_progress, user_gamification,",
        "  user_badges, user_flashcards, purchases, certificates,",
        "  discussions, discussion_*, *_submissions, *_attempts,",
        "  student_*, reading_sessions, continue_later, notifications,",
        "  ai_chat_*, mfa_recovery_codes, account_deletion_requests,",
        "  contact_submissions, newsletter_subscribers, etc.",
      ].join("\n")
    );

    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `solosuccess-migration-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${okCount}/${EXPORT_TABLES.length} tables`);
    } catch (err) {
      toast.error("Failed to build ZIP file");
      console.error(err);
    }

    setRunning(false);
  };

  return (
    <div className="mt-2 p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            One-click CSV export
          </p>
          <p className="text-xs text-muted-foreground">
            Downloads every content table as a single ZIP, numbered in
            recommended import order. Skips user/student data.
          </p>
        </div>
        <Button
          onClick={runExport}
          disabled={running}
          size="sm"
          className="flex-shrink-0"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting…
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download all CSVs
            </>
          )}
        </Button>
      </div>

      {(running || results.length > 0) && (
        <div className="space-y-2">
          <Progress value={progress} className="h-1.5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-64 overflow-auto pr-1">
            {results.map((r) => (
              <div
                key={r.table}
                className="flex items-center justify-between text-xs gap-2 px-2 py-1 rounded bg-background/60 border border-border"
              >
                <span className="font-mono truncate">{r.table}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {r.status === "done" && (
                    <>
                      <Badge variant="outline" className="h-5 px-1.5 font-mono">
                        {r.rows}
                      </Badge>
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    </>
                  )}
                  {r.status === "error" && (
                    <AlertCircle
                      className="h-3.5 w-3.5 text-destructive"
                      aria-label={r.error}
                    />
                  )}
                  {r.status === "pending" && running && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}