/**
 * @file AdminMigration.tsx — In-App Migration Dashboard
 *
 * WHAT THIS DOES:
 * Displays a step-by-step checklist for moving from Lovable Cloud
 * to a standalone Supabase project. Progress is saved in localStorage
 * so you can close the tab and come back later.
 *
 * WHY WE BUILT IT:
 * The user asked for the GitHub connection steps to be "implemented."
 * Since we can't click OAuth buttons for them, the next best thing
 * is an interactive guide that lives inside their admin panel,
 * tracks progress, and surfaces every piece of info they'll need.
 *
 * DESIGN:
 * - Collapsible phase cards (Prep → Export → New Project → Restore → Test)
 * - Checkboxes persist in localStorage
 * - Copy-to-clipboard buttons for commands and URLs
 * - Visual progress bar at the top
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Github,
  Database,
  Server,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Package,
  FileJson,
  Zap,
  Mail,
  CreditCard,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MigrationExportPanel } from "@/components/admin/MigrationExportPanel";

// ──────────────────────────────────────────────
// LOCALSTORAGE KEY — keeps checklist state
// across browser sessions
// ──────────────────────────────────────────────
const STORAGE_KEY = "solosuccess-migration-checklist";

interface Step {
  id: string;
  label: string;
  detail?: string;
  code?: string;
  link?: { url: string; text: string };
  warning?: string;
}

interface Phase {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  steps: Step[];
}

// ──────────────────────────────────────────────
// CHECKLIST DATA — mirrors MIGRATION.md
// ──────────────────────────────────────────────
const PHASES: Phase[] = [
  {
    id: "prep",
    title: "Phase 1 — Prep",
    icon: ShieldCheck,
    color: "text-success",
    steps: [
      {
        id: "p1",
        label: "Create a free Supabase account",
        detail: "Go to supabase.com and sign up. The free tier gives you 500MB database + 1GB storage — plenty to start.",
        link: { url: "https://supabase.com", text: "Open supabase.com" },
      },
      {
        id: "p2",
        label: "Create a new Supabase project",
        detail: "Inside Supabase, click 'New Project'. Save the Project URL, anon key, service role key, and database password in a password manager.",
      },
      {
        id: "p3",
        label: "(Optional) Install Supabase CLI",
        code: "npm i -g supabase",
      },
    ],
  },
  {
    id: "github",
    title: "Phase 2 — Connect to GitHub",
    icon: Github,
    color: "text-info",
    steps: [
      {
        id: "g1",
        label: "Open the + menu in Lovable",
        detail: "Look for the + button at the bottom-left of the chat input (next to the send button).",
      },
      {
        id: "g2",
        label: "Go to GitHub → Connect project",
        detail: "This opens a panel where you authorize the Lovable GitHub App.",
      },
      {
        id: "g3",
        label: "Authorize the Lovable GitHub App",
        detail: "You'll be redirected to GitHub to grant permissions. Choose your personal account or an organization.",
      },
      {
        id: "g4",
        label: "Click 'Create Repository'",
        detail: "Lovable will create a new private repo (e.g., 'solosuccess-academy') and push your entire codebase to it.",
      },
      {
        id: "g5",
        label: "Verify the repo on GitHub",
        detail: "Open github.com in a new tab, find your new repo, and confirm it contains src/, supabase/, public/, etc.",
        link: { url: "https://github.com", text: "Open github.com" },
      },
    ],
  },
  {
    id: "export",
    title: "Phase 3 — Export Data from Lovable Cloud",
    icon: Database,
    color: "text-warning",
    steps: [
      {
        id: "e1",
        label: "Export content tables as CSV",
        detail: "Go to Cloud → Database → Tables. Select each table below and click the export/download CSV button.",
        warning: "Skip all user_* tables — no real users yet means nothing to migrate.",
      },
      {
        id: "e2",
        label: "Download storage bucket files",
        detail: "Cloud → Storage. Download files from: course-assets, lesson-videos, project-files, avatars.",
      },
      {
        id: "e3",
        label: "Copy down your secrets list",
        detail: "You'll need to re-add these in the new project. Write them down or screenshot them.",
        code: "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, LOVABLE_API_KEY, RESEND_API_KEY, TURNSTILE_SECRET_KEY, API_KEYS_ENCRYPTION_KEY, CRON_JOB_SECRET",
      },
    ],
  },
  {
    id: "newproj",
    title: "Phase 4 — New Lovable Project",
    icon: Package,
    color: "text-accent",
    steps: [
      {
        id: "n1",
        label: "Disable Lovable Cloud for future projects",
        detail: "Go to Connectors (workspace sidebar root) → Lovable Cloud → Disable. This stops Cloud from auto-attaching to new projects.",
      },
      {
        id: "n2",
        label: "Create a new Lovable project",
        detail: "From your workspace dashboard, click New Project. Give it the same name or a v2 name.",
      },
      {
        id: "n3",
        label: "Connect your standalone Supabase project",
        detail: "In the new Lovable project, look for the Supabase connect button (top-right). Paste your new Supabase URL and anon key.",
      },
      {
        id: "n4",
        label: "Clone your GitHub repo locally",
        detail: "This gives you the full codebase to copy into the new project.",
        code: "git clone https://github.com/YOUR_USERNAME/solosuccess-academy.git",
      },
      {
        id: "n5",
        label: "Copy these folders into the new project",
        detail: "Drag-and-drop or copy via terminal. Do NOT copy src/integrations/supabase/client.ts or types.ts — Lovable regenerates those.",
        code: "src/ (except integrations), public/, supabase/migrations/, supabase/functions/, index.html, tailwind.config.ts, vite.config.ts, package.json, bun.lockb",
      },
    ],
  },
  {
    id: "restore",
    title: "Phase 5 — Restore in New Supabase",
    icon: Server,
    color: "text-primary",
    steps: [
      {
        id: "r1",
        label: "Run all migrations",
        detail: "Lovable should auto-apply migrations on push. Or run: supabase db push",
        code: "supabase db push",
      },
      {
        id: "r2",
        label: "Re-create storage buckets",
        detail: "Supabase Dashboard → Storage. Create buckets with same names and public/private settings: course-assets (private), lesson-videos (private), project-files (private), avatars (public).",
      },
      {
        id: "r3",
        label: "Upload storage files",
        detail: "Upload the files you downloaded in Phase 3 back into the corresponding buckets.",
      },
      {
        id: "r4",
        label: "Import CSVs in parent-first order",
        detail: "Supabase Dashboard → Table Editor → a table → Insert → Import CSV. Order matters!",
        code: "1. courses → 2. lessons / textbook_chapters / practice_labs / course_projects → 3. textbook_pages / project_milestones → 4. blog_posts, achievement_badges, etc.",
      },
      {
        id: "r5",
        label: "Re-add all Edge Function secrets",
        detail: "Supabase Dashboard → Edge Functions → Secrets. Add each secret from Phase 3.",
      },
      {
        id: "r6",
        label: "Deploy edge functions",
        detail: "Lovable auto-deploys on push, or run manually:",
        code: "supabase functions deploy",
      },
      {
        id: "r7",
        label: "Re-create cron job secret in vault",
        detail: "Run this SQL in Supabase SQL Editor to restore the auto-blog cron:",
        code: "INSERT INTO vault.secrets (name, secret) VALUES ('cron_job_secret', 'your-secret-here');",
      },
    ],
  },
  {
    id: "external",
    title: "Phase 6 — Reconnect External Services",
    icon: Globe,
    color: "text-secondary",
    steps: [
      {
        id: "x1",
        label: "Update Stripe webhook endpoint",
        detail: "In Stripe Dashboard → Developers → Webhooks, add the NEW edge function URL.",
        code: "https://<new-project-ref>.supabase.co/functions/v1/stripe-webhook",
      },
      {
        id: "x2",
        label: "Update Google OAuth callback URL",
        detail: "In Google Cloud Console → APIs & Services → Credentials, add the new callback.",
        code: "https://<new-project-ref>.supabase.co/auth/v1/callback",
      },
      {
        id: "x3",
        label: "Set up email (Resend recommended)",
        detail: "Lovable Email domain won't exist outside Cloud. Sign up at Resend (free: 3k emails/mo), verify your domain, add RESEND_API_KEY secret.",
        link: { url: "https://resend.com", text: "Open Resend" },
      },
      {
        id: "x4",
        label: "Point custom domain to new published URL",
        detail: "In Vercel or your DNS provider, update records for solosuccessacademy.app to the new Lovable published URL.",
      },
    ],
  },
  {
    id: "test",
    title: "Phase 7 — Smoke Test",
    icon: Zap,
    color: "text-success",
    steps: [
      { id: "t1", label: "Sign up with a test email + password" },
      { id: "t2", label: "Verify email confirmation arrives" },
      { id: "t3", label: "Google OAuth sign-in works" },
      { id: "t4", label: "Buy a course with Stripe test card: 4242 4242 4242 4242" },
      { id: "t5", label: "Open a lesson, complete a quiz, earn XP" },
      { id: "t6", label: "Submit a project milestone" },
      { id: "t7", label: "Trigger auto-blog manually and confirm post appears" },
      { id: "t8", label: "Only then: delete the old Lovable Cloud project" },
    ],
  },
];

// ──────────────────────────────────────────────
// HELPER: load/save checklist state
// ──────────────────────────────────────────────
function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    /* ignore corrupt storage */
  }
  return new Set();
}

function saveChecked(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export default function AdminMigration() {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const [checked, setChecked] = useState<Set<string>>(loadChecked);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(PHASES.map((p) => p.id)));

  // Recalculate progress
  const totalSteps = PHASES.reduce((sum, p) => sum + p.steps.length, 0);
  const completedSteps = checked.size;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Persist on every toggle
  useEffect(() => {
    saveChecked(checked);
  }, [checked]);

  const toggleStep = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePhase = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`Copied ${label}`);
    });
  }, []);

  // Guard: only admins
  if (!user) return <Navigate to="/auth" replace />;
  if (isAdmin === false) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen cyber-bg p-6">
      <div className="cyber-grid absolute inset-0 opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient">
            Cloud Migration Dashboard
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Step-by-step checklist to move from Lovable Cloud to your own Supabase project.
            Progress saves automatically — close the tab anytime.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Github className="h-4 w-4" />
            <span className="text-muted-foreground">
              First task: connect this project to GitHub so you own the code
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <Card className="border border-primary/20 bg-background/80 backdrop-blur-sm">
          <CardContent className="pt-6 pb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{completedSteps} of {totalSteps} steps completed</span>
              <Badge variant="outline" className="font-mono">{progressPercent}%</Badge>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {progressPercent === 100 && (
              <p className="text-center text-success text-sm font-medium pt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Migration complete! You can safely delete the old project.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Reset button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Clear all progress?")) {
                setChecked(new Set());
                toast.info("Progress reset");
              }
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Reset Progress
          </Button>
        </div>

        {/* Phase cards */}
        {PHASES.map((phase) => {
          const isExpanded = expanded.has(phase.id);
          const phaseCompleted = phase.steps.filter((s) => checked.has(s.id)).length;
          const phaseTotal = phase.steps.length;
          const allDone = phaseCompleted === phaseTotal;
          const Icon = phase.icon;

          return (
            <Card
              key={phase.id}
              className={cn(
                "border bg-background/80 backdrop-blur-sm transition-all duration-300",
                allDone ? "border-success/30" : "border-primary/20"
              )}
            >
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => togglePhase(phase.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-background border", phase.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{phase.title}</CardTitle>
                      <CardDescription>
                        {phaseCompleted} / {phaseTotal} completed
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {allDone && <CheckCircle2 className="h-5 w-5 text-success" />}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-3 pt-0">
                  {phase.id === "export" && <MigrationExportPanel />}
                  {phase.steps.map((step) => {
                    const isChecked = checked.has(step.id);
                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-all",
                          isChecked
                            ? "bg-success/5 border-success/20"
                            : "bg-background/50 border-border hover:border-primary/30"
                        )}
                      >
                        <Checkbox
                          id={step.id}
                          checked={isChecked}
                          onCheckedChange={() => toggleStep(step.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={step.id}
                            className={cn(
                              "text-sm font-medium cursor-pointer transition-all",
                              isChecked && "line-through text-muted-foreground"
                            )}
                          >
                            {step.label}
                          </label>

                          {step.detail && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {step.detail}
                            </p>
                          )}

                          {step.warning && (
                            <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 p-2 rounded">
                              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                              {step.warning}
                            </div>
                          )}

                          {step.code && (
                            <div className="flex items-start gap-2 mt-1">
                              <code className="flex-1 block bg-muted p-2 rounded text-xs font-mono text-foreground break-all">
                                {step.code}
                              </code>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => copyToClipboard(step.code!, step.label)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}

                          {step.link && (
                            <a
                              href={step.link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-info hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {step.link.text}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Footer tip */}
        <div className="text-center text-xs text-muted-foreground pb-8">
          <p>
            Realistic time estimate with no real users: <strong>4–8 hours</strong> of focused work.
          </p>
          <p className="mt-1">
            The hardest part (auth migration) is skipped since you have no students yet.
          </p>
        </div>
      </div>
    </div>
  );
}
