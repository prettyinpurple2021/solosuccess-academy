import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

/**
 * Sign out from all devices. Uses Supabase global scope which invalidates
 * every refresh token across all sessions for this user.
 */
export function SessionsCard() {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOutEverywhere = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      toast({ title: 'Signed out from all devices' });
      navigate('/auth');
    } catch (err: any) {
      toast({ title: 'Failed to sign out', description: err.message, variant: 'destructive' });
      setBusy(false);
    }
  };

  return (
    <Card className="glass-card border-secondary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <LogOut className="h-5 w-5 text-secondary" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          If you've signed in from a shared computer or lost a device, sign out everywhere to invalidate every session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={handleSignOutEverywhere} disabled={busy}>
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing out...</> : 'Sign out everywhere'}
        </Button>
      </CardContent>
    </Card>
  );
}
