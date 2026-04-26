import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Link2, Unlink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserIdentity } from '@supabase/supabase-js';

/**
 * Lets users link or unlink Google sign-in to their account.
 * Uses Supabase identity linking. Note: a user must always have at least one
 * identity (or a password) — Supabase enforces this server-side.
 */
export function ConnectedAccountsCard() {
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const refresh = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUserIdentities();
    setIdentities(data?.identities ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const googleIdentity = identities.find((i) => i.provider === 'google');
  const hasEmailIdentity = identities.some((i) => i.provider === 'email');

  const handleLinkGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/settings` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: 'Failed to link Google', description: err.message, variant: 'destructive' });
      setBusy(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity) return;
    if (identities.length <= 1) {
      toast({
        title: 'Cannot unlink',
        description: 'You must have at least one sign-in method on your account.',
        variant: 'destructive',
      });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
      if (error) throw error;
      toast({ title: 'Google account unlinked' });
      await refresh();
    } catch (err: any) {
      toast({ title: 'Failed to unlink', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Link2 className="h-5 w-5 text-primary" />
          Connected Accounts
        </CardTitle>
        <CardDescription>Link sign-in providers for faster, secure access</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-primary/10">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div>
                <p className="font-medium text-sm">Google</p>
                <p className="text-xs text-muted-foreground">
                  {googleIdentity
                    ? `Connected${googleIdentity.identity_data?.email ? ` as ${googleIdentity.identity_data.email}` : ''}`
                    : 'Not connected'}
                </p>
              </div>
            </div>
            {googleIdentity ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkGoogle}
                disabled={busy || !hasEmailIdentity}
                title={!hasEmailIdentity ? 'Set a password first so you can still sign in' : undefined}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Unlink
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLinkGoogle} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
