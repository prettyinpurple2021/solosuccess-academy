import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(72, { message: 'Password must be 72 characters or fewer' });

interface ChangePasswordCardProps {
  email: string | undefined;
}

export function ChangePasswordCard({ email }: ChangePasswordCardProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) {
      toast({ title: 'Invalid password', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    if (next !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (next === current) {
      toast({ title: 'New password must be different from your current password', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Re-authenticate by signing in with the current password (also verifies it)
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signInErr) {
        throw new Error('Current password is incorrect');
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;

      toast({ title: 'Password updated successfully' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      toast({ title: 'Failed to update password', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="glass-card border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <KeyRound className="h-5 w-5 text-accent" />
          Change Password
        </CardTitle>
        <CardDescription>Use a strong password you don't reuse anywhere else</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pw">Current Password</Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={show ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? 'Hide passwords' : 'Show passwords'}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="next-pw">New Password</Label>
            <Input
              id="next-pw"
              type={show ? 'text' : 'password'}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <Input
              id="confirm-pw"
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={submitting || !current || !next || !confirm} variant="outline">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
