/**
 * @file AdminMigrationPrint.tsx — Per-Phase Printable Migration Checklist
 *
 * WHAT THIS DOES:
 * Renders every migration phase fully expanded, with a "why this matters"
 * intro, every step, every command (with copy button), and every link.
 * Includes a "Print / Save as PDF" button that triggers window.print().
 *
 * WHY:
 * The interactive dashboard is great on-screen but cluttered on paper.
 * This view is laid out for a clean printout — light background, black
 * text, page-break-friendly cards, and copy buttons that vanish in print.
 *
 * HOW TO SAVE AS PDF:
 * Click "Print / Save as PDF" → in the print dialog choose destination
 * "Save as PDF" → Save. Works in Chrome, Edge, Safari, Firefox.
 */

import { useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Copy,
  ExternalLink,
  Printer,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import {
  MIGRATION_PHASES,
  MIGRATION_TOTAL_STEPS,
} from "@/lib/migrationPhases";

export default function AdminMigrationPrint() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);

  const copy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`Copied ${label}`));
  }, []);

  if (!user) return <Navigate to="/auth" replace />;
  if (isAdmin === false) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {/* Print-only styles. Tailwind print: variants are not enough for
          @page margins, so we inject a small <style> block. */}
      <style>{`
        @media print {
          @page { margin: 16mm; size: A4; }
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .page-break { break-before: page; page-break-before: always; }
          .phase-card { break-inside: avoid; page-break-inside: avoid; }
          a { color: #000 !important; text-decoration: underline; }
          code { background: #f1f5f9 !important; color: #000 !important; }
        }
      `}</style>

      {/* Top action bar (hidden when printing) */}
      <div className="no-print sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-black hover:bg-black/5"
          >
            <Link to="/admin/migration">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-black text-white hover:bg-black/85 shadow-none"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-8 py-10 print:py-0">
        {/* Document header */}
        <header className="mb-10 border-b border-black/20 pb-6">
          <p className="text-xs uppercase tracking-widest text-black/60">
            SoloSuccess Academy
          </p>
          <h1 className="text-3xl font-bold mt-1">
            Lovable Cloud → Standalone Supabase: Migration Playbook
          </h1>
          <p className="mt-3 text-sm text-black/70 leading-relaxed">
            A printable, per-phase checklist with the exact commands and links you
            need at each step. {MIGRATION_PHASES.length} phases,{" "}
            {MIGRATION_TOTAL_STEPS} steps. Realistic time with no real users:
            4–8 hours of focused work.
          </p>
          <p className="mt-2 text-xs text-black/50">
            Tip: print the checkboxes and tick them off by hand, or use the
            interactive dashboard at /admin/migration to track progress online.
          </p>
        </header>

        {/* Table of contents */}
        <section className="mb-10 phase-card">
          <h2 className="text-lg font-semibold mb-3">Contents</h2>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            {MIGRATION_PHASES.map((p) => (
              <li key={p.id}>
                <a href={`#${p.id}`} className="hover:underline">
                  {p.title}
                </a>
                <span className="text-black/50"> — {p.steps.length} steps</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Phase cards */}
        {MIGRATION_PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          return (
            <section
              key={phase.id}
              id={phase.id}
              className={`phase-card mb-10 ${idx > 0 ? "print:page-break" : ""}`}
            >
              <div className="flex items-start gap-3 border-b border-black/20 pb-3 mb-4">
                <div className="p-2 rounded-md border border-black/30">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold leading-tight">
                    {phase.title}
                  </h2>
                  <p className="text-sm text-black/70 mt-1 leading-relaxed">
                    {phase.summary}
                  </p>
                </div>
              </div>

              <ol className="space-y-4">
                {phase.steps.map((step, sIdx) => (
                  <li
                    key={step.id}
                    className="flex items-start gap-3 phase-card"
                  >
                    {/* Printable checkbox */}
                    <span
                      aria-hidden
                      className="mt-1 inline-block h-4 w-4 border border-black/60 rounded-sm flex-shrink-0"
                    />
                    <div className="flex-1 space-y-2">
                      <p className="font-medium leading-snug">
                        <span className="text-black/50 mr-1">
                          {sIdx + 1}.
                        </span>
                        {step.label}
                      </p>

                      {step.detail && (
                        <p className="text-sm text-black/70 leading-relaxed">
                          {step.detail}
                        </p>
                      )}

                      {step.warning && (
                        <div className="flex items-start gap-2 text-sm border border-black/40 bg-black/5 p-2 rounded">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{step.warning}</span>
                        </div>
                      )}

                      {step.code && (
                        <div className="flex items-start gap-2">
                          <code className="flex-1 block bg-black/5 border border-black/15 p-2 rounded text-xs font-mono whitespace-pre-wrap break-all">
                            {step.code}
                          </code>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="no-print h-7 w-7 flex-shrink-0 text-black hover:bg-black/5"
                            onClick={() => copy(step.code!, step.label)}
                            aria-label={`Copy command for ${step.label}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {step.link && (
                        <div className="flex items-center gap-2 text-sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <a
                            href={step.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {step.link.text}
                          </a>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="no-print h-7 w-7 flex-shrink-0 text-black hover:bg-black/5"
                            onClick={() => copy(step.link!.url, step.link!.text)}
                            aria-label={`Copy URL ${step.link.url}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}

        <footer className="mt-12 pt-6 border-t border-black/20 text-xs text-black/60">
          <p>
            Generated from SoloSuccess Academy migration playbook. For the
            interactive version with auto-saved progress and one-click data
            export, visit{" "}
            <span className="font-mono">/admin/migration</span>.
          </p>
        </footer>
      </main>
    </div>
  );
}