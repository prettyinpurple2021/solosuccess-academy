/**
 * @file LeadMagnetSection.tsx — Email capture for the free "7-Day Idea Validation
 * Mini-Course" PDF lead magnet.
 *
 * Flow:
 *  1. User enters email and clicks "Get the free PDF".
 *  2. Client validates with zod, then inserts into `newsletter_subscribers`
 *     (RLS allows anonymous insert; duplicates per (email, source) are caught
 *     gracefully so re-downloads don't error).
 *  3. On success we trigger a download of /assets/validation-mini-course.pdf
 *     and swap the form for a success state.
 *
 * Designed to be reusable — drop into any page with optional `variant="compact"`
 * for tighter contexts like the blog index.
 */
import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, CheckCircle2, FileText } from 'lucide-react';

const PDF_URL = '/assets/validation-mini-course.pdf';

const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Please enter a valid email address' })
  .max(255, { message: 'Email is too long' });

interface LeadMagnetSectionProps {
  /** Used to attribute signups so we know which surface converted. */
  source?: string;
  variant?: 'full' | 'compact';
}

export function LeadMagnetSection({
  source = 'homepage',
  variant = 'full',
}: LeadMagnetSectionProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const triggerDownload = () => {
    const a = document.createElement('a');
    a.href = PDF_URL;
    a.download = 'SoloSuccess-7-Day-Idea-Validation.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({
        title: 'Invalid email',
        description: parsed.error.issues[0]?.message ?? 'Please check your email and try again.',
        variant: 'destructive',
      });
      return;
    }

    setStatus('loading');
    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({
        email: parsed.data.toLowerCase(),
        source,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
      });

      // 23505 = unique violation — already subscribed for this source. That's fine,
      // we still deliver the PDF so returning visitors aren't blocked.
      if (error && error.code !== '23505') {
        throw error;
      }

      setStatus('success');
      triggerDownload();
      toast({
        title: 'Check your downloads',
        description: 'Your free PDF is on the way.',
      });
    } catch (err: any) {
      setStatus('idle');
      toast({
        title: 'Something went wrong',
        description: err?.message ?? 'Please try again in a moment.',
        variant: 'destructive',
      });
    }
  };

  const isCompact = variant === 'compact';

  return (
    <section
      aria-labelledby="lead-magnet-heading"
      className={
        isCompact
          ? 'rounded-lg border border-primary/30 bg-card/40 p-6 md:p-8'
          : 'py-20 px-6 md:px-10 lg:px-16'
      }
    >
      <div
        className={
          isCompact
            ? 'flex flex-col md:flex-row md:items-center gap-6'
            : 'mx-auto max-w-4xl rounded-xl border border-primary/30 bg-card/50 p-8 md:p-12 relative overflow-hidden'
        }
      >
        {!isCompact && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'radial-gradient(600px 200px at 50% 0%, hsl(var(--primary) / 0.25), transparent 60%)',
            }}
          />
        )}

        <div className={isCompact ? 'flex-1' : 'relative z-10 grid md:grid-cols-[1fr_auto] gap-8 items-center'}>
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-mono text-primary mb-3">
              <FileText className="h-3.5 w-3.5" /> Free PDF · No spam
            </div>
            <h2
              id="lead-magnet-heading"
              className={
                isCompact
                  ? 'font-display text-xl md:text-2xl font-bold mb-2'
                  : 'font-display text-2xl md:text-4xl font-bold mb-3'
              }
            >
              The 7-Day Idea Validation Mini-Course
            </h2>
            <p className={isCompact ? 'text-sm text-muted-foreground mb-4' : 'text-muted-foreground mb-6 md:text-lg'}>
              The exact 7-day sprint we teach inside Course 1 — distilled into a single
              download. Evenings and weekends. Under $100. One real signal at the end.
            </p>
          </div>

          {status === 'success' ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <CheckCircle2 className="h-5 w-5" /> Your PDF is downloading.
              </div>
              <p className="text-sm text-muted-foreground">
                Didn't see it?{' '}
                <button
                  type="button"
                  onClick={triggerDownload}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Click to download again
                </button>
                .
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className={isCompact ? 'flex flex-col sm:flex-row gap-2' : 'flex flex-col sm:flex-row gap-3 min-w-0'}
              noValidate
            >
              <label htmlFor={`lead-email-${source}`} className="sr-only">
                Email address
              </label>
              <Input
                id={`lead-email-${source}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                className="sm:min-w-[260px]"
              />
              <Button type="submit" disabled={status === 'loading'} className="shrink-0">
                {status === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Get the free PDF
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default LeadMagnetSection;