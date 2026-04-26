/**
 * @file MfaChallengeForm.tsx — Step-up MFA challenge after sign-in.
 *
 * Shown when the user signed in with password (AAL1) but has TOTP enrolled
 * and must satisfy AAL2 before reaching the app. Supports either a
 * 6-digit TOTP code or a one-time recovery code.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { useMfa } from '@/hooks/useMfa';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export function MfaChallengeForm({ onSuccess, onCancel }: Props) {
  const { factors, challenge, verifyChallenge, consumeRecoveryCode } = useMfa();
  const { toast } = useToast();

  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  // Once the factor list loads, kick off a challenge for the first verified TOTP factor
  useEffect(() => {
    const verified = factors.find((f) => f.status === 'verified' && f.factor_type === 'totp');
    if (!verified || factorId) return;
    setFactorId(verified.id);
    challenge(verified.id)
      .then((id) => setChallengeId(id))
      .catch((err) => toast({ title: 'Could not start challenge', description: err.message, variant: 'destructive' }));
  }, [factors, factorId, challenge, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'totp') {
      if (!factorId || !challengeId || code.length !== 6) return;
      setPending(true);
      try {
        await verifyChallenge(factorId, challengeId, code);
        onSuccess();
      } catch (err: any) {
        toast({ title: 'Invalid code', description: err.message, variant: 'destructive' });
      } finally {
        setPending(false);
      }
    } else {
      // Recovery-code path: consume the code, then unenroll the existing TOTP factor
      // so the user can re-enroll a fresh authenticator on their next visit.
      setPending(true);
      try {
        const ok = await consumeRecoveryCode(code.trim());
        if (!ok) {
          toast({ title: 'Invalid recovery code', variant: 'destructive' });
          return;
        }
        if (factorId) {
          await supabase.auth.mfa.unenroll({ factorId }).catch(() => undefined);
        }
        toast({
          title: 'Recovery successful',
          description: 'Re-enroll an authenticator app in Settings as soon as possible.',
        });
        onSuccess();
      } catch (err: any) {
        toast({ title: 'Recovery failed', description: err.message, variant: 'destructive' });
      } finally {
        setPending(false);
      }
    }
  };

  return (
    <Card className="glass-card border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)] p-6">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-display font-bold neon-text">Two-Factor Verification</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'totp'
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter one of your recovery codes (format: xxxxx-xxxxx).'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">{mode === 'totp' ? 'Authenticator code' : 'Recovery code'}</Label>
          <Input
            id="mfa-code"
            autoFocus
            inputMode={mode === 'totp' ? 'numeric' : 'text'}
            value={code}
            onChange={(e) =>
              setCode(mode === 'totp' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value.slice(0, 11))
            }
            placeholder={mode === 'totp' ? '123456' : 'xxxxx-xxxxx'}
            className="font-mono text-center text-lg tracking-widest"
            disabled={pending}
          />
        </div>

        <Button
          type="submit"
          variant="neon"
          className="w-full"
          disabled={pending || (mode === 'totp' ? code.length !== 6 : code.length < 9)}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Verify
        </Button>

        <div className="flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'totp' ? 'recovery' : 'totp');
              setCode('');
            }}
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <KeyRound className="h-3 w-3" />
            {mode === 'totp' ? 'Use a recovery code' : 'Use authenticator app'}
          </button>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </div>
      </form>
    </Card>
  );
}