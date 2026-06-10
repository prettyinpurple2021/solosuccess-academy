/**
 * @file Onboarding.tsx — First-run goal + commitment capture
 *
 * Shown ONCE for brand-new signups (gated by AppLayout when
 * profiles.onboarding_completed_at IS NULL). Captures a primary goal
 * and weekly time commitment, then drops the user on /dashboard.
 */
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { PageMeta } from '@/components/layout/PageMeta';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2, Rocket, Briefcase, Compass, Zap } from 'lucide-react';

type Goal = 'founder' | 'side_hustler' | 'career_changer' | 'indie_hacker';

const GOALS: { id: Goal; label: string; desc: string; icon: typeof Rocket }[] = [
  { id: 'founder', label: 'Founder', desc: 'Building a full-time business', icon: Rocket },
  { id: 'side_hustler', label: 'Side Hustler', desc: 'Earning on the side of a day job', icon: Briefcase },
  { id: 'career_changer', label: 'Career Changer', desc: 'Leaving the 9-5 for self-employment', icon: Compass },
  { id: 'indie_hacker', label: 'Indie Hacker', desc: 'Shipping products solo', icon: Zap },
];

export default function Onboarding() {
  const { user, profile, isLoading, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [hours, setHours] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  // If already onboarded, skip straight to dashboard.
  useEffect(() => {
    if (!isLoading && profile && (profile as any).onboarding_completed_at) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, profile, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const finish = async (skipped = false) => {
    if (saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          primary_goal: skipped ? null : goal,
          weekly_commitment_hours: skipped ? null : hours,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await refetchProfile();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('[Onboarding] save failed:', err);
      toast({
        title: 'Could not save',
        description: err?.message ?? 'Please try again.',
        variant: 'destructive',
      });
      setSaving(false);
    }
  };

  return (
    <>
      <PageMeta title="Welcome — set your goal" description="Two quick questions to personalize your journey." path="/onboarding" />
      <div className="min-h-screen cyber-bg flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
            <span className={step === 1 ? 'text-primary' : ''}>01 Goal</span>
            <span>—</span>
            <span className={step === 2 ? 'text-primary' : ''}>02 Commitment</span>
          </div>

          {step === 1 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-display text-2xl md:text-3xl">
                  What are you building toward?
                </CardTitle>
                <CardDescription>
                  Pick the one that fits best — we&apos;ll tune your dashboard accordingly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {GOALS.map((g) => {
                  const Icon = g.icon;
                  const selected = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
                      className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{g.label}</p>
                        <p className="text-sm text-muted-foreground">{g.desc}</p>
                      </div>
                    </button>
                  );
                })}

                <div className="flex items-center justify-between pt-4">
                  <Button variant="ghost" onClick={() => finish(true)} disabled={saving}>
                    Skip for now
                  </Button>
                  <Button onClick={() => setStep(2)} disabled={!goal}>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-display text-2xl md:text-3xl">
                  How many hours a week can you commit?
                </CardTitle>
                <CardDescription>
                  Even 2–3 hours a week compounds. You can change this anytime in Settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 text-center">
                  <p className="font-display text-5xl font-bold text-primary">{hours}</p>
                  <p className="mt-1 text-sm text-muted-foreground">hours per week</p>
                </div>

                <Slider
                  value={[hours]}
                  onValueChange={([v]) => setHours(v)}
                  min={1}
                  max={20}
                  step={1}
                  aria-label="Weekly commitment in hours"
                />
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>1 hr</span>
                  <span>20 hrs</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep(1)} disabled={saving}>
                    Back
                  </Button>
                  <Button onClick={() => finish(false)} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Start learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}