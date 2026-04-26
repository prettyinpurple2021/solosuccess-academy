/**
 * @file TwoFactorCard.tsx — Enroll, manage, and disable TOTP 2FA.
 *
 * Shows different UI based on state:
 * - Not enrolled → "Enable 2FA" button
 * - Enrolling   → QR code + manual secret + 6-digit verification
 * - Enrolled    → Status, manage recovery codes, disable
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, ShieldAlert, Loader2, Copy, Check, Download, KeyRound } from 'lucide-react';
import { useMfa } from '@/hooks/useMfa';
import { useToast } from '@/hooks/use-toast';

type Stage = 'idle' | 'enrolling' | 'showing-recovery';

export function TwoFactorCard() {
  const { factors, hasMfa, isLoading, enroll, verifyEnrollment, unenroll, generateRecoveryCodes } = useMfa();
  const { toast } = useToast();

  const [stage, setStage] = useState<Stage>('idle');
  const [pending, setPending] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [secretCopied, setSecretCopied] = useState(false);

  const verifiedFactor = factors.find((f) => f.status === 'verified');

  /** Start enrollment: get QR + secret. */
  const handleStartEnroll = async () => {
    setPending(true);
    try {
      // Clean up any unverified previous attempts so we don't pile up factors
      for (const f of factors.filter((x) => x.status === 'unverified')) {
        await unenroll(f.id).catch(() => undefined);
      }
      const { factorId: id, qr: qrSvg, secret: s } = await enroll();
      setFactorId(id);
      setQr(qrSvg);
      setSecret(s);
      setStage('enrolling');
    } catch (err: any) {
      toast({ title: 'Could not start 2FA setup', description: err.message, variant: 'destructive' });
    } finally {
      setPending(false);
    }
  };

  /** Verify the 6-digit code. On success, also generate recovery codes. */
  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;
    setPending(true);
    try {
      await verifyEnrollment(factorId, code);
      // Generate recovery codes immediately after enrollment
      const codes = await generateRecoveryCodes();
      setRecoveryCodes(codes);
      setStage('showing-recovery');
      setCode('');
      toast({ title: '2FA enabled', description: 'Save your recovery codes in a safe place.' });
    } catch (err: any) {
      toast({ title: 'Invalid code', description: err.message, variant: 'destructive' });
    } finally {
      setPending(false);
    }
  };

  /** Disable 2FA — removes the verified factor and all recovery codes (codes auto-cascade isn't set, but disable is intentional). */
  const handleDisable = async () => {
    if (!verifiedFactor) return;
    if (!confirm('Disable two-factor authentication? Your account will be less secure.')) return;
    setPending(true);
    try {
      await unenroll(verifiedFactor.id);
      toast({ title: '2FA disabled' });
    } catch (err: any) {
      toast({ title: 'Could not disable 2FA', description: err.message, variant: 'destructive' });
    } finally {
      setPending(false);
    }
  };

  /** Regenerate fresh recovery codes (invalidates old ones). */
  const handleRegenerateCodes = async () => {
    if (!confirm('Generate new recovery codes? Your existing codes will stop working.')) return;
    setPending(true);
    try {
      const codes = await generateRecoveryCodes();
      setRecoveryCodes(codes);
      setStage('showing-recovery');
    } catch (err: any) {
      toast({ title: 'Could not generate codes', description: err.message, variant: 'destructive' });
    } finally {
      setPending(false);
    }
  };

  const copySecret = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const downloadCodes = () => {
    const blob = new Blob(
      [
        `SoloSuccess Academy — 2FA Recovery Codes\nGenerated: ${new Date().toLocaleString()}\n\nEach code can be used once. Store somewhere safe.\n\n${recoveryCodes.join('\n')}\n`,
      ],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solosuccess-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass-card border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          {hasMfa ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-accent" />
          )}
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security using an authenticator app like Google Authenticator, Authy, or 1Password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : stage === 'enrolling' && qr && secret ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                1. Open your authenticator app and scan this QR code, or enter the secret manually.
                <br />
                2. Enter the 6-digit code shown by your app to confirm.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white">
              {/* qr is an SVG data URL from Supabase */}
              <img src={qr} alt="2FA QR code" className="h-48 w-48" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Manual entry secret</Label>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={copySecret}>
                  {secretCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totp-code">6-digit code from your app</Label>
              <Input
                id="totp-code"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="font-mono text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleVerify} disabled={pending || code.length !== 6} variant="neon">
                {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify & Enable
              </Button>
              <Button variant="ghost" onClick={() => setStage('idle')} disabled={pending}>
                Cancel
              </Button>
            </div>
          </div>
        ) : stage === 'showing-recovery' ? (
          <div className="space-y-4">
            <Alert>
              <KeyRound className="h-4 w-4" />
              <AlertDescription>
                Save these recovery codes somewhere safe (password manager, printed copy). Each code works <strong>once</strong> and lets you sign in if you lose your authenticator. <strong>You won't see them again.</strong>
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 rounded-lg bg-black/40 border border-primary/20 font-mono text-sm">
              {recoveryCodes.map((c) => (
                <div key={c} className="select-all">{c}</div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={downloadCodes}>
                <Download className="h-4 w-4 mr-2" /> Download as .txt
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(recoveryCodes.join('\n'));
                  toast({ title: 'Copied to clipboard' });
                }}
              >
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
              <Button
                onClick={() => {
                  setRecoveryCodes([]);
                  setStage('idle');
                }}
                variant="neon"
              >
                I've saved them
              </Button>
            </div>
          </div>
        ) : hasMfa ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Two-factor authentication is enabled.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRegenerateCodes} disabled={pending}>
                <KeyRound className="h-4 w-4 mr-2" /> Regenerate Recovery Codes
              </Button>
              <Button variant="destructive" onClick={handleDisable} disabled={pending}>
                Disable 2FA
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={handleStartEnroll} disabled={pending} variant="neon">
            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Enable Two-Factor Authentication
          </Button>
        )}
      </CardContent>
    </Card>
  );
}