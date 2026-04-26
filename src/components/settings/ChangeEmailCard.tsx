import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().trim().email({ message: 'Invalid email address' }).max(255);

interface ChangeEmailCardProps {
  currentEmail: string | undefined;
}

export function ChangeEmailCard({ currentEmail }: ChangeEmailCardProps) {
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(newEmail);
    if (!parsed.success) {
      toast({ title: 'Invalid email', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    if (parsed.data.toLowerCase() === currentEmail?.toLowerCase()) {
      toast({ title: 'That is already your email', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: parsed.data });
      if (error) throw error;
      toast({
        title: 'Confirmation emails sent',
        description: 'Check both your old and new email inboxes to confirm the change.',
      });
      setNewEmail('');
    } catch (err: any) {
      toast({ title: 'Failed to update email', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card border-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Mail className="h-5 w-5 text-accent" />
          Email Address
        </CardTitle>
        <CardDescription>
          Your current email is <span className="font-medium text-foreground">{currentEmail}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEmail">New Email Address</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">
              We'll send confirmation links to both your current and new email. The change takes effect after both are confirmed.
            </p>
          </div>
          <Button type="submit" disabled={isSubmitting || !newEmail} variant="outline">
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Update Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
