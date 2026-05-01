/**
 * @file Welcome.tsx — Post-purchase onboarding screen
 *
 * Shown once after a successful Stripe checkout. Confirms ownership and
 * walks the new student through 3 quick "get started" actions. Once they
 * click any CTA (or "I'm ready"), we mark the course as onboarded so they
 * don't see this again on revisits.
 *
 * Access: requires auth + has_purchased_course (gates non-owners).
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageMeta } from '@/components/layout/PageMeta';
import {
  ArrowRight, CheckCircle2, Loader2, MessageSquare, PlayCircle, Target, Sparkles,
} from 'lucide-react';

export default function Welcome() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [marking, setMarking] = useState(false);

  // Verify ownership + load course + first lesson in one shot.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['welcome-course', courseId, user?.id],
    enabled: !!courseId && !!user?.id,
    queryFn: async () => {
      // 1) ownership check via the existing RPC (admins also pass)
      const { data: ownsData, error: ownsErr } = await supabase.rpc('has_purchased_course', {
        _user_id: user!.id,
        _course_id: courseId!,
      });
      if (ownsErr) throw ownsErr;
      const owns = ownsData === true;

      // 2) course meta
      const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('id', courseId!)
        .maybeSingle();
      if (courseErr) throw courseErr;

      // 3) first published lesson (for the "Open lesson 1" CTA)
      const { data: firstLesson } = await supabase
        .from('lessons')
        .select('id, title, order_number')
        .eq('course_id', courseId!)
        .eq('is_published', true)
        .order('order_number', { ascending: true })
        .limit(1)
        .maybeSingle();

      return { owns, course, firstLesson };
    },
  });

  // If user has already onboarded for this course, skip straight to it.
  const alreadyOnboarded = useMemo(() => {
    const list = (profile as any)?.onboarding_completed_courses as string[] | undefined;
    return Array.isArray(list) && courseId ? list.includes(courseId) : false;
  }, [profile, courseId]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (alreadyOnboarded && courseId) {
      navigate(`/courses/${courseId}`, { replace: true });
    }
  }, [alreadyOnboarded, courseId, navigate]);

  // Non-owner → bounce to course catalog
  useEffect(() => {
    if (!isLoading && data && !data.owns) {
      navigate('/courses', { replace: true });
    }
  }, [isLoading, data, navigate]);

  const markComplete = async () => {
    if (!courseId || marking) return;
    setMarking(true);
    try {
      await supabase.rpc('mark_onboarding_complete', { _course_id: courseId });
    } catch (err) {
      // Non-fatal — they can still navigate. Log and continue.
      console.warn('[Welcome] mark_onboarding_complete failed:', err);
    } finally {
      setMarking(false);
    }
  };

  const goToFirstLesson = async () => {
    await markComplete();
    if (data?.firstLesson?.id && courseId) {
      navigate(`/courses/${courseId}/lessons/${data.firstLesson.id}`);
    } else if (courseId) {
      navigate(`/courses/${courseId}`);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data?.course) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Course not found.</p>
        <Button asChild className="mt-4">
          <Link to="/courses">Back to catalog</Link>
        </Button>
      </div>
    );
  }

  const course = data.course;
  const studentName = profile?.display_name?.split(' ')[0] || 'there';

  return (
    <>
      <PageMeta
        title={`Welcome — ${course.title}`}
        description="You just unlocked lifetime access. Here's how to get started in 5 minutes."
      />
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Purchase Confirmed
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            You own <span className="text-primary">{course.title}</span> for life, {studentName}.
          </h1>
          <p className="mt-3 text-muted-foreground md:text-lg">
            No subscription. No renewal. Lifetime access — including every future update.
          </p>
        </div>

        {/* 3-step checklist */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Get started in 5 minutes
            </CardTitle>
            <CardDescription>
              Most students who finish step 1 today complete the course. Open Lesson 1 first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Step 1: Open first lesson */}
            <button
              onClick={goToFirstLesson}
              className="group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PlayCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Open your first lesson</p>
                <p className="text-sm text-muted-foreground truncate">
                  {data.firstLesson?.title ?? 'Start here'}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </button>

            {/* Step 2: Daily goal */}
            <Link
              to="/settings"
              onClick={markComplete}
              className="group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Set a daily learning goal</p>
                <p className="text-sm text-muted-foreground">
                  Even 15 min/day compounds — we&apos;ll track your streak
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </Link>

            {/* Step 3: Discussions */}
            <Link
              to={`/courses/${courseId}/discussions`}
              onClick={markComplete}
              className="group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Join the course discussion</p>
                <p className="text-sm text-muted-foreground">
                  Ask questions, share progress, learn from other founders
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </CardContent>
        </Card>

        {/* Footer actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            asChild
            onClick={markComplete}
          >
            <Link to="/dashboard">I&apos;ll explore on my own →</Link>
          </Button>
          <Button onClick={goToFirstLesson} disabled={marking}>
            {marking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Lesson 1
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Receipt sent to your email. Manage purchases in{' '}
          <Link to="/billing" className="underline hover:text-primary">Billing</Link>.
        </p>
      </div>
    </>
  );
}