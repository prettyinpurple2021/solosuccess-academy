/**
 * @file MfaChallengeForm.tsx — Step-up MFA challenge after sign-in.
 *
 * Shown when the user signed in with password (AAL1) but has TOTP enrolled
 * and must satisfy AAL2 before reaching the app. Supports either a
 * 6-digit TOTP code or a one-time recovery code.
 *
 * Recovery flow has three phases:
 *   1. enter   — user types a 10-char recovery code in a segmented input
 *   2. confirm — server confirms which code was accepted (shown masked)
 *                with remaining count, then user clicks "Continue"
 *   3. success → onSuccess() advances them past the sign-in wall
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Loader2, ShieldCheck, KeyRound, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useMfa } from '@/hooks/useMfa';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

type RecoveryConfirmation = {
  masked: string;
  usedAt: string;
  remaining: number;
};

export function MfaChallengeForm({ onSuccess, onCancel }: Props) {
  const { factors, challenge, verifyChallenge, confirmRecoveryCode } = useMfa();
  const { toast } = useToast();

  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [pending, setPending] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  // Recovery confirmation state — populated after a successful recovery match
  const [confirmation, setConfirmation] = useState<RecoveryConfirmation | null>(null);

  // Once the factor list loads, kick off a challenge for the first verified TOTP factor
  useEffect(() => {
    const verified = factors.find((f) => f.status === 'verified' && f.factor_type === 'totp');
    if (!verified || factorId) return;
    setFactorId(verified.id);
    challenge(verified.id)
      .then((id) => setChallengeId(id))
      .catch((err) => toast({ title: 'Could not start challenge', description: err.message, variant: 'destructive' }));
  }, [factors, factorId, challenge, toast]);

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryCode.length !== 10) return;
    setPending(true);
    try {
      // Convert raw 10 chars → "xxxxx-xxxxx" expected by the RPC
      const formatted = `${recoveryCode.slice(0, 5)}-${recoveryCode.slice(5)}`.toLowerCase();
      const result = await confirmRecoveryCode(formatted);
      if (!result.accepted) {
        toast({
          title: 'Recovery code not accepted',
          description: 'That code is invalid or has already been used. Try another.',
          variant: 'destructive',
        });
        return;
      }
      // Show confirmation card with masked code + remaining count
      setConfirmation({
        masked: result.masked,
        usedAt: result.usedAt,
        remaining: result.remaining,
      });
      // Unenroll the existing TOTP factor so the user can re-enroll a fresh
      // authenticator at next sign-in (the original device is presumed lost).
      if (factorId) {
        await supabase.auth.mfa.unenroll({ factorId }).catch(() => undefined);
      }
    } catch (err: any) {
      toast({ title: 'Recovery failed', description: err.message, variant: 'destructive' });
    } finally {
      setPending(false);
    }
  };

  // ──────────────────────────────────────────────
  // Confirmation success screen — shown after a recovery code is accepted.
  // The user must click "Continue" so they see *exactly* which code was used.
  // ──────────────────────────────────────────────
  if (confirmation) {
    return (
      <Card className="glass-card border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)] p-6">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold neon-text">Recovery Code Accepted</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We verified the code below and signed you in.
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">Code used</p>
            <p className="font-mono text-lg tracking-widest text-foreground">{confirmation.masked}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Consumed {new Date(confirmation.usedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="text-muted-foreground">
              <p>
                <strong className="text-foreground">{confirmation.remaining}</strong> recovery
                {confirmation.remaining === 1 ? ' code' : ' codes'} remaining. Re-enroll your
                authenticator app from <strong>Settings → Security</strong> as soon as possible.
              </p>
            </div>
          </div>

          <Button variant="neon" className="w-full" onClick={onSuccess}>
            Continue to your account
          </Button>
        </div>
      </Card>
    );
  }

  // ──────────────────────────────────────────────
  // TOTP entry (default)
  // ──────────────────────────────────────────────
  if (mode === 'totp') {
    return (
      <Card className="glass-card border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)] p-6">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold neon-text">Two-Factor Verification</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={handleTotpSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Authenticator code</Label>
            <Input
              id="mfa-code"
              autoFocus
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="font-mono text-center text-lg tracking-widest"
              disabled={pending}
            />
          </div>

          <Button type="submit" variant="neon" className="w-full" disabled={pending || code.length !== 6}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Verify
          </Button>

          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('recovery');
                setCode('');
              }}
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <KeyRound className="h-3 w-3" />
              Lost your device? Use a recovery code
            </button>
            <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </div>
        </form>
      </Card>
    );
  }

  // ──────────────────────────────────────────────
  // Recovery code entry — segmented input for clarity
  // ──────────────────────────────────────────────
  return (
    <Card className="glass-card border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)] p-6">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
          <KeyRound className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-display font-bold neon-text">Enter Recovery Code</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use one of the 10-character backup codes you saved during setup.
          <br />
          Each code works only once.
        </p>
      </div>

      <form onSubmit={handleRecoverySubmit} className="space-y-5">
        <div className="space-y-3">
          <Label className="block text-center">Recovery code</Label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={10}
              value={recoveryCode}
              onChange={(v) => setRecoveryCode(v.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              disabled={pending}
              autoFocus
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4].map((i) => (
                  <InputOTPSlot key={i} index={i} className="font-mono uppercase" />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                {[5, 6, 7, 8, 9].map((i) => (
                  <InputOTPSlot key={i} index={i} className="font-mono uppercase" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-center text-xs text-muted-foreground">Format: <span className="font-mono">xxxxx-xxxxx</span></p>
        </div>

        <Button
          type="submit"
          variant="neon"
          className="w-full"
          disabled={pending || recoveryCode.length !== 10}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Verify recovery code
        </Button>

        <div className="flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('totp');
              setRecoveryCode('');
            }}
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <ShieldCheck className="h-3 w-3" />
            Use authenticator app instead
          </button>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </div>
      </form>
    </Card>
  );
}
