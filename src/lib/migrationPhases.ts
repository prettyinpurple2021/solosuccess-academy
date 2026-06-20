/**
 * @file migrationPhases.ts — Shared migration checklist data
 *
 * WHAT: Single source of truth for the Lovable Cloud → Supabase
 *       migration phases. Consumed by both the interactive dashboard
 *       (AdminMigration) and the printable view (AdminMigrationPrint).
 * WHY:  Keeps the two views perfectly in sync — change a step here,
 *       both screens (and the printed PDF) update together.
 */
import {
  ShieldCheck,
  Github,
  Database,
  Package,
  Server,
  Globe,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface MigrationStep {
  id: string;
  label: string;
  detail?: string;
  code?: string;
  link?: { url: string; text: string };
  warning?: string;
}

export interface MigrationPhase {
  id: string;
  title: string;
  summary: string; // shown as the "why this matters" intro on the print view
  icon: LucideIcon;
  color: string;
  steps: MigrationStep[];
}

export const MIGRATION_PHASES: MigrationPhase[] = [
  {
    id: "prep",
    title: "Phase 1 — Prep",
    summary:
      "Stand up the empty Supabase project that will receive everything. Nothing here touches your live app — you are only collecting credentials you will paste in later phases.",
    icon: ShieldCheck,
    color: "text-success",
    steps: [
      {
        id: "p1",
        label: "Create a free Supabase account",
        detail:
          "Go to supabase.com and sign up. The free tier gives you 500MB database + 1GB storage — plenty to start.",
        link: { url: "https://supabase.com", text: "supabase.com" },
      },
      {
        id: "p2",
        label: "Create a new Supabase project",
        detail:
          "Inside Supabase, click 'New Project'. Save the Project URL, anon key, service role key, and database password in a password manager — you will need all four later.",
      },
      {
        id: "p3",
        label: "(Optional) Install Supabase CLI",
        detail:
          "Lets you run migrations and deploy edge functions from your terminal. Skip if you only use the dashboard.",
        code: "npm i -g supabase",
      },
    ],
  },
  {
    id: "github",
    title: "Phase 2 — Connect to GitHub",
    summary:
      "Get a copy of your codebase under your control. Lovable will keep auto-pushing every change, but the repo is yours — you can clone it, fork it, or host it elsewhere.",
    icon: Github,
    color: "text-info",
    steps: [
      {
        id: "g1",
        label: "Open the + menu in Lovable",
        detail:
          "Look for the + button at the bottom-left of the chat input (next to the send button).",
      },
      {
        id: "g2",
        label: "Go to GitHub → Connect project",
        detail: "This opens a panel where you authorize the Lovable GitHub App.",
      },
      {
        id: "g3",
        label: "Authorize the Lovable GitHub App",
        detail:
          "You will be redirected to GitHub to grant permissions. Choose your personal account or an organization.",
      },
      {
        id: "g4",
        label: "Click 'Create Repository'",
        detail:
          "Lovable will create a new private repo (e.g. 'solosuccess-academy') and push your entire codebase to it.",
      },
      {
        id: "g5",
        label: "Verify the repo on GitHub",
        detail:
          "Open github.com in a new tab, find your new repo, and confirm it contains src/, supabase/, public/, etc.",
        link: { url: "https://github.com", text: "github.com" },
      },
    ],
  },
  {
    id: "export",
    title: "Phase 3 — Export Data from Lovable Cloud",
    summary:
      "Pull your authored content (courses, lessons, textbook, blog, badges) out of Cloud as CSV. Use the one-click Export Panel on the dashboard — it bundles everything into a single ZIP.",
    icon: Database,
    color: "text-warning",
    steps: [
      {
        id: "e1",
        label: "Open the Export Panel on the Migration dashboard",
        detail:
          "On /admin/migration, scroll to Phase 3 and use the Export Panel. Check 'Course Content' tables + CSV + JSON + Storage files + Metadata, then download.",
        warning:
          "Skip every user_* and student_* table — you have no real users yet, so there is nothing to migrate.",
      },
      {
        id: "e2",
        label: "Download storage bucket files",
        detail:
          "The Export Panel grabs these automatically. If you prefer manual: Cloud → Storage, download files from course-assets, lesson-videos, project-files, avatars.",
      },
      {
        id: "e3",
        label: "Copy down your secrets list",
        detail:
          "You will need to re-add these in the new project. Write them down or screenshot them now.",
        code:
          "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, LOVABLE_API_KEY, RESEND_API_KEY, TURNSTILE_SECRET_KEY, API_KEYS_ENCRYPTION_KEY, CRON_JOB_SECRET",
      },
    ],
  },
  {
    id: "newproj",
    title: "Phase 4 — New Lovable Project",
    summary:
      "Spin up a fresh Lovable project that uses your standalone Supabase instead of Cloud, then drop your existing code into it.",
    icon: Package,
    color: "text-accent",
    steps: [
      {
        id: "n1",
        label: "Disable Lovable Cloud for future projects",
        detail:
          "Connectors (workspace sidebar root) → Lovable Cloud → Disable. This stops Cloud from auto-attaching to the next project you create.",
      },
      {
        id: "n2",
        label: "Create a new Lovable project",
        detail:
          "From your workspace dashboard click New Project. Give it the same name or a v2 name.",
      },
      {
        id: "n3",
        label: "Connect your standalone Supabase project",
        detail:
          "In the new Lovable project, click the Supabase connect button (top-right). Paste the Project URL and anon key you saved in Phase 1.",
      },
      {
        id: "n4",
        label: "Clone your GitHub repo locally",
        detail:
          "Gives you the full codebase to copy into the new project. Replace YOUR_USERNAME with your GitHub handle.",
        code: "git clone https://github.com/YOUR_USERNAME/solosuccess-academy.git",
      },
      {
        id: "n5",
        label: "Copy these folders into the new project",
        detail:
          "Drag-and-drop or copy via terminal. Do NOT copy src/integrations/supabase/client.ts or types.ts — Lovable regenerates those for the new backend.",
        code:
          "src/ (except integrations), public/, supabase/migrations/, supabase/functions/, index.html, tailwind.config.ts, vite.config.ts, package.json, bun.lockb",
      },
    ],
  },
  {
    id: "restore",
    title: "Phase 5 — Restore in New Supabase",
    summary:
      "Rebuild the database, storage, and edge functions inside your new Supabase. Import the CSVs from Phase 3 in parent-first order so foreign keys line up.",
    icon: Server,
    color: "text-primary",
    steps: [
      {
        id: "r1",
        label: "Run all migrations",
        detail: "Lovable auto-applies migrations on push. To run manually:",
        code: "supabase db push",
      },
      {
        id: "r2",
        label: "Re-create storage buckets",
        detail:
          "Supabase Dashboard → Storage. Create buckets with the same names + privacy: course-assets (private), lesson-videos (private), project-files (private), avatars (public).",
      },
      {
        id: "r3",
        label: "Upload storage files",
        detail:
          "Upload the files from your Phase 3 download back into the corresponding buckets.",
      },
      {
        id: "r4",
        label: "Import CSVs in parent-first order",
        detail:
          "Supabase Dashboard → Table Editor → pick a table → Insert → Import CSV. Order matters or foreign-key inserts fail.",
        code:
          "1. courses  →  2. lessons / textbook_chapters / practice_labs / course_projects  →  3. textbook_pages / project_milestones  →  4. blog_posts, achievement_badges, xp_config, grade_settings, announcements",
      },
      {
        id: "r5",
        label: "Re-add all Edge Function secrets",
        detail:
          "Supabase Dashboard → Edge Functions → Secrets. Add each secret from Phase 3.",
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
        detail:
          "Run this SQL in the Supabase SQL Editor to restore the auto-blog cron. Replace 'your-secret-here' with a fresh random string and save it as the CRON_JOB_SECRET edge function secret too.",
        code:
          "INSERT INTO vault.secrets (name, secret) VALUES ('cron_job_secret', 'your-secret-here');",
      },
    ],
  },
  {
    id: "external",
    title: "Phase 6 — Reconnect External Services",
    summary:
      "Anything that points at the OLD project URL (Stripe, Google OAuth, email, DNS) needs to be re-pointed at the NEW one. Swap <new-project-ref> with your new Supabase project ref.",
    icon: Globe,
    color: "text-secondary",
    steps: [
      {
        id: "x1",
        label: "Update Stripe webhook endpoint",
        detail:
          "Stripe Dashboard → Developers → Webhooks → add new endpoint. Generate a new signing secret and save it as STRIPE_WEBHOOK_SECRET.",
        code:
          "https://<new-project-ref>.supabase.co/functions/v1/stripe-webhook",
        link: {
          url: "https://dashboard.stripe.com/webhooks",
          text: "dashboard.stripe.com/webhooks",
        },
      },
      {
        id: "x2",
        label: "Update Google OAuth callback URL",
        detail:
          "Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs → Add URI.",
        code:
          "https://<new-project-ref>.supabase.co/auth/v1/callback",
        link: {
          url: "https://console.cloud.google.com/apis/credentials",
          text: "console.cloud.google.com/apis/credentials",
        },
      },
      {
        id: "x3",
        label: "Set up email (Resend recommended)",
        detail:
          "Lovable Email won't exist outside Cloud. Sign up at Resend (free 3k emails/mo), verify your domain, then add the API key as the RESEND_API_KEY secret.",
        link: { url: "https://resend.com", text: "resend.com" },
      },
      {
        id: "x4",
        label: "Point custom domain to new published URL",
        detail:
          "In Vercel (or your DNS provider) update the CNAME for solosuccessacademy.app and solosuccessacademy.cloud to the new Lovable published URL.",
      },
    ],
  },
  {
    id: "test",
    title: "Phase 7 — Smoke Test",
    summary:
      "Before deleting the old Cloud project, prove every critical flow works on the new one. If anything below fails, fix it before sunsetting.",
    icon: Zap,
    color: "text-success",
    steps: [
      { id: "t1", label: "Sign up with a test email + password" },
      { id: "t2", label: "Verify the email confirmation arrives" },
      { id: "t3", label: "Google OAuth sign-in works" },
      {
        id: "t4",
        label: "Buy a course with the Stripe test card",
        code: "4242 4242 4242 4242   any future expiry   any CVC",
      },
      { id: "t5", label: "Open a lesson, complete a quiz, earn XP" },
      { id: "t6", label: "Submit a project milestone" },
      { id: "t7", label: "Trigger auto-blog manually and confirm a post appears" },
      { id: "t8", label: "Only then: delete the old Lovable Cloud project" },
    ],
  },
];

export const MIGRATION_TOTAL_STEPS = MIGRATION_PHASES.reduce(
  (sum, p) => sum + p.steps.length,
  0,
);