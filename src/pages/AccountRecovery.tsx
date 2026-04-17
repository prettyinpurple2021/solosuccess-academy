/**
 * @file AccountRecovery.tsx — Account Recovery Request Page
 *
 * For users who can't access their email (lost mailbox, typo'd signup, etc.)
 * and therefore can't use the standard "Forgot password" reset flow.
 *
 * They submit a structured identity-verification request that is routed to
 * the support team via the existing `submit-contact` pipeline. The team
 * manually verifies (purchase receipts, profile details) and then updates
 * the user's email in the backend so they can sign in again.
 *
 * Public route — no auth required (the user can't sign in).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldQuestion, Send, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageMeta } from '@/components/layout/PageMeta';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// ──────────────────────────────────────────────
// Form validation schema
// ──────────────────────────────────────────────
const recoverySchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name').max(100),
  oldEmail: z.string().trim().email('Enter the email you used to sign up').max(255),
  newEmail: z.string().trim().email('Enter a new email you can access').max(255),
  displayName: z.string().trim().max(100).optional(),
  lastCourse: z.string().trim().max(200).optional(),
  details: z.string().trim().min(20, 'Please give us at least a couple sentences so we can verify you').max(2000),
});

type RecoveryForm = z.infer<typeof recoverySchema>;

export default function AccountRecovery() {
  const [form, setForm] = useState<RecoveryForm>({
    fullName: '',
    oldEmail: '',
    newEmail: '',
    displayName: '',
    lastCourse: '',
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof RecoveryForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input client-side
    const parsed = recoverySchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: 'Please check your form',
        description: parsed.error.issues[0].message,
        variant: 'destructive',
      });
      return;
    }

    if (parsed.data.oldEmail.toLowerCase() === parsed.data.newEmail.toLowerCase()) {
      toast({
        title: 'New email must be different',
        description: 'The new email cannot be the same as your old one.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Build the support message — packs all identity info into one
      // message so the support team has everything they need.
      const message = [
        '🔒 ACCOUNT RECOVERY REQUEST',
        '',
        `Full name: ${parsed.data.fullName}`,
        `Old (lost) email: ${parsed.data.oldEmail}`,
        `New email to use: ${parsed.data.newEmail}`,
        parsed.data.displayName ? `Display name on account: ${parsed.data.displayName}` : null,
        parsed.data.lastCourse ? `Last course/lesson worked on: ${parsed.data.lastCourse}` : null,
        '',
        '— Identity verification details —',
        parsed.data.details,
      ]
        .filter(Boolean)
        .join('\n');

      // Reuse the existing contact submission edge function so the
      // request lands in `contact_submissions` for admin review.
      const { error } = await supabase.functions.invoke('submit-contact', {
        body: {
          name: parsed.data.fullName,
          email: parsed.data.newEmail,
          subject: `Account Recovery — ${parsed.data.oldEmail}`,
          message,
          source: 'account_recovery',
        },
      });
      if (error) throw error;

      // Send a confirmation email to the NEW address so the user knows
      // we got it (and proves they actually own the new mailbox).
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'contact-confirmation',
            recipientEmail: parsed.data.newEmail,
            idempotencyKey: `recovery-${parsed.data.oldEmail}-${Date.now()}`,
            templateData: { name: parsed.data.fullName },
          },
        });
      } catch (emailErr) {
        // Non-blocking — request is already saved
        console.warn('Recovery confirmation email failed:', emailErr);
      }

      setSubmitted(true);
      toast({
        title: 'Recovery request sent!',
        description: "We'll review and respond within 1–2 business days.",
      });
    } catch (err: any) {
      toast({
        title: 'Something went wrong',
        description: err.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────
  // Success state
  // ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center cyber-bg p-4">
        <PageMeta
          title="Recovery Request Received"
          description="Your account recovery request has been received."
          path="/account-recovery"
          noIndex
        />
        <Card className="w-full max-w-md glass-card border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldQuestion className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Request Received</CardTitle>
            <CardDescription>
              Thanks — we've received your account recovery request and will review it within
              1–2 business days. We'll reach out at <strong>{form.newEmail}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link to="/auth">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // Main form
  // ──────────────────────────────────────────────
  return (
    <div className="min-h-screen cyber-bg py-12 px-4">
      <PageMeta
        title="Account Recovery"
        description="Recover your SoloSuccess Academy account if you've lost access to your email."
        path="/account-recovery"
        noIndex
      />

      <div className="container max-w-2xl">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        <Card className="glass-card border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <ShieldQuestion className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Account Recovery</CardTitle>
            </div>
            <CardDescription className="text-base">
              Lost access to your email and can't reset your password? Fill out this form so we can
              verify it's really you and update your account to a new email address.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identity */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Your full name *</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  placeholder="Jane Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oldEmail">Old email (lost access) *</Label>
                  <Input
                    id="oldEmail"
                    type="email"
                    value={form.oldEmail}
                    onChange={handleChange('oldEmail')}
                    placeholder="old@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">New email to use *</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={form.newEmail}
                    onChange={handleChange('newEmail')}
                    placeholder="new@example.com"
                    required
                  />
                </div>
              </div>

              {/* Verification helpers */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name on your account (if you remember)</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={handleChange('displayName')}
                  placeholder="The name shown in your profile"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastCourse">Last course or lesson you worked on</Label>
                <Input
                  id="lastCourse"
                  value={form.lastCourse}
                  onChange={handleChange('lastCourse')}
                  placeholder="e.g. Course 3 — Building Your MVP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="details">
                  Identity verification details *
                </Label>
                <Textarea
                  id="details"
                  value={form.details}
                  onChange={handleChange('details')}
                  placeholder="Help us verify it's you. Mention things like: courses you've purchased (and approximate purchase dates), payment method last 4 digits, certificates earned, anything specific only the account owner would know."
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The more verifiable details you provide, the faster we can confirm and restore
                  your access. We'll never ask for full payment card numbers or your password.
                </p>
              </div>

              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">What happens next?</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Our team reviews your request within 1–2 business days.</li>
                  <li>We may email <strong>{form.newEmail || 'your new email'}</strong> for additional verification.</li>
                  <li>Once verified, we update your account to your new email and send you a password reset link.</li>
                </ol>
              </div>

              <Button type="submit" className="w-full" disabled={submitting} variant="default">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting request...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Recovery Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
