/**
 * MigrationExportPanel — One-click CSV export for migration.
 *
 * WHAT IT DOES:
 * Queries each content table from the current Supabase backend
 * (Lovable Cloud), converts each result to CSV, bundles everything
 * into a single ZIP, and triggers a browser download. The ZIP can
 * then be imported table-by-table into the new standalone project
 * via Supabase Dashboard → Table Editor → Import CSV.
 *
 * WHY:
 * Manually clicking "Download CSV" on ~18 tables in the Cloud UI is
 * tedious and error-prone. This guarantees nothing is missed and
 * preserves the recommended import order in the filenames
 * (01_courses.csv, 02_lessons.csv, ...).
 *
 * Skips all user/student tables — empty in the new project anyway.
 */

import { useState } from "react";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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