/**
 * @file notify-project-grade/index.ts — Emails a student after their capstone project
 * is graded by an admin (approved or needs_revision).
 *
 * AUTH: verify_jwt = true. Caller must be an admin (checked via has_role).
 * The service-role client resolves the student's auth.users email and course title
 * so the client never needs access to auth.users.
 *
 * BODY: { projectId: string }
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders, corsResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return corsResponse(req)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401, corsHeaders)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify caller identity + admin role.
    const asUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await asUser.auth.getUser()
    if (userErr || !userData?.user) return json({ error: 'Invalid token' }, 401, corsHeaders)

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    })
    if (!isAdmin) return json({ error: 'Admin access required' }, 403, corsHeaders)

    const body = await req.json().catch(() => ({}))
    const projectId = String(body?.projectId || '')
    if (!projectId) return json({ error: 'projectId is required' }, 400, corsHeaders)

    // Load project (with resolved course + student display name).
    const { data: project, error: pErr } = await admin
      .from('course_projects')
      .select('id, user_id, course_id, admin_status, admin_score, admin_notes')
      .eq('id', projectId)
      .maybeSingle()
    if (pErr || !project) return json({ error: 'Project not found' }, 404, corsHeaders)

    const status = project.admin_status as 'pending' | 'approved' | 'needs_revision'
    if (status !== 'approved' && status !== 'needs_revision') {
      return json({ skipped: true, reason: 'Project is not in a notifiable state' }, 200, corsHeaders)
    }

    const [{ data: course }, { data: profile }, { data: userRow }] = await Promise.all([
      admin.from('courses').select('title').eq('id', project.course_id).maybeSingle(),
      admin.from('profiles').select('display_name, email_notifications').eq('id', project.user_id).maybeSingle(),
      admin.auth.admin.getUserById(project.user_id),
    ])

    const recipientEmail = userRow?.user?.email
    if (!recipientEmail) return json({ error: 'Student email not found' }, 404, corsHeaders)

    if (profile && profile.email_notifications === false) {
      return json({ skipped: true, reason: 'Student disabled email notifications' }, 200, corsHeaders)
    }

    const idempotencyKey = `project-grade-${projectId}-${status}-${project.admin_score ?? 'na'}`

    const { error: sendErr } = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'project-grade-decision',
        recipientEmail,
        idempotencyKey,
        templateData: {
          studentName: profile?.display_name || null,
          courseTitle: course?.title || 'your course',
          status,
          score: project.admin_score,
          notes: project.admin_notes,
          projectUrl: `https://solosuccessacademy.app/courses/${project.course_id}/project`,
        },
      },
    })
    if (sendErr) return json({ error: sendErr.message }, 500, corsHeaders)

    // Also push an in-app notification into the inbox
    const approved = status === 'approved'
    await admin.from('notifications').insert({
      user_id: project.user_id,
      type: approved ? 'project_approved' : 'project_needs_revision',
      title: approved ? 'Your project was approved' : 'Revisions requested on your project',
      message: approved
        ? `Your capstone for ${course?.title || 'your course'} was approved${
            typeof project.admin_score === 'number' ? ` (${project.admin_score}/100)` : ''
          }.`
        : `Your capstone for ${course?.title || 'your course'} needs a few improvements before it can be approved.`,
      link: `/courses/${project.course_id}/project`,
    })

    return json({ sent: true }, 200, corsHeaders)
  } catch (e: any) {
    return json({ error: e?.message || 'Unknown error' }, 500, getCorsHeaders(req))
  }
})

function json(payload: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}