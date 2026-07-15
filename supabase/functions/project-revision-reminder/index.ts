/**
 * @file project-revision-reminder/index.ts — Cron-driven reminder for stale needs_revision projects.
 *
 * Runs daily. For any capstone project still in admin_status='needs_revision'
 * whose graded_at is >= 7 days ago and hasn't been reminded for that graded_at
 * timestamp yet, sends the student a follow-up email and records the send in
 * `project_revision_reminders_sent` so we don't spam on subsequent runs.
 *
 * AUTH: verify_jwt = false. Requires a matching `x-cron-secret` header.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders, corsResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return corsResponse(req)

  try {
    const cronSecret = Deno.env.get('CRON_JOB_SECRET')
    const provided = req.headers.get('x-cron-secret')
    if (!cronSecret || provided !== cronSecret) {
      return json({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Find candidates: needs_revision, graded 7+ days ago
    const { data: candidates, error: cErr } = await admin
      .from('course_projects')
      .select('id, user_id, course_id, admin_notes, admin_score, graded_at, courses(title)')
      .eq('admin_status', 'needs_revision')
      .not('graded_at', 'is', null)
      .lte('graded_at', sevenDaysAgo)

    if (cErr) return json({ error: cErr.message }, 500, corsHeaders)

    const results: Array<{ projectId: string; status: string; reason?: string }> = []

    for (const p of candidates ?? []) {
      const gradedAt = p.graded_at as string

      // Idempotency: skip if we've already reminded for this graded_at
      const { data: existing } = await admin
        .from('project_revision_reminders_sent')
        .select('id')
        .eq('project_id', p.id)
        .eq('graded_at', gradedAt)
        .maybeSingle()
      if (existing) {
        results.push({ projectId: p.id, status: 'skipped', reason: 'already-sent' })
        continue
      }

      const [{ data: profile }, { data: userRow }] = await Promise.all([
        admin.from('profiles').select('display_name, email_notifications').eq('id', p.user_id).maybeSingle(),
        admin.auth.admin.getUserById(p.user_id),
      ])

      const recipientEmail = userRow?.user?.email
      if (!recipientEmail) {
        results.push({ projectId: p.id, status: 'skipped', reason: 'no-email' })
        continue
      }
      if (profile && profile.email_notifications === false) {
        results.push({ projectId: p.id, status: 'skipped', reason: 'opted-out' })
        continue
      }

      const courseTitle = (p as { courses: { title: string | null } | null }).courses?.title || 'your course'

      const { error: sendErr } = await admin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'project-grade-decision',
          recipientEmail,
          idempotencyKey: `project-revision-reminder-${p.id}-${gradedAt}`,
          templateData: {
            studentName: profile?.display_name || null,
            courseTitle,
            status: 'needs_revision',
            score: p.admin_score ?? null,
            notes: p.admin_notes ?? null,
            projectUrl: `https://solosuccessacademy.app/courses/${p.course_id}/project`,
          },
        },
      })

      if (sendErr) {
        results.push({ projectId: p.id, status: 'error', reason: sendErr.message })
        continue
      }

      await admin.from('project_revision_reminders_sent').insert({
        project_id: p.id,
        user_id: p.user_id,
        graded_at: gradedAt,
      })

      // Push an in-app inbox notification so the reminder is visible even if email is missed
      await admin.from('notifications').insert({
        user_id: p.user_id,
        type: 'project_revision_reminder',
        title: 'Reminder: your project still needs revisions',
        message: `Your ${courseTitle} capstone has been waiting on revisions for over a week. Resubmit when ready.`,
        link: `/courses/${p.course_id}/project`,
      })

      results.push({ projectId: p.id, status: 'sent' })
    }

    return json({ processed: results.length, results }, 200, corsHeaders)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500, {})
  }
})

function json(body: unknown, status: number, extraHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}