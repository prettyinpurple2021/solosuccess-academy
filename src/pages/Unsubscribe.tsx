/**
 * @file Unsubscribe.tsx — Email Unsubscribe Page
 *
 * Handles one-click email unsubscribe via token validation.
 * Users arrive here from the unsubscribe link in transactional emails.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, MailX, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageMeta } from '@/components/layout/PageMeta';
import { supabase } from '@/integrations/supabase/client';

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [submitting, setSubmitting] = useState(false);

  // Validate the token on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();

        if (data.valid === true) {
          setStatus('valid');
        } else if (data.reason === 'already_unsubscribed') {
          setStatus('already');
        } else {
          setStatus('invalid');
        }
      } catch {
        setStatus('error');
      }
    };

    validate();
  }, [token]);

  // Confirm unsubscribe
  const handleConfirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus('success');
      } else if (data?.reason === 'already_unsubscribed') {
        setStatus('already');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Unsubscribe — SoloSuccess Academy"
        description="Manage your email preferences."
      />

      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full bg-card/50 backdrop-blur-sm border-primary/20">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            {/* Loading state */}
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">Validating your request...</p>
              </>
            )}

            {/* Valid — show confirm button */}
            {status === 'valid' && (
              <>
                <MailX className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-xl font-display font-bold text-foreground">
                  Unsubscribe from emails?
                </h1>
                <p className="text-muted-foreground text-sm">
                  You'll stop receiving app notification emails from SoloSuccess Academy.
                  Authentication emails (like password resets) will still be sent.
                </p>
                <Button
                  variant="neon"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {submitting ? 'Processing...' : 'Confirm Unsubscribe'}
                </Button>
              </>
            )}

            {/* Success */}
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-success" />
                <h1 className="text-xl font-display font-bold text-foreground">
                  You've been unsubscribed
                </h1>
                <p className="text-muted-foreground text-sm">
                  You won't receive any more notification emails from us.
                </p>
              </>
            )}

            {/* Already unsubscribed */}
            {status === 'already' && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <h1 className="text-xl font-display font-bold text-foreground">
                  Already unsubscribed
                </h1>
                <p className="text-muted-foreground text-sm">
                  This email address has already been unsubscribed.
                </p>
              </>
            )}

            {/* Invalid token */}
            {status === 'invalid' && (
              <>
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
                <h1 className="text-xl font-display font-bold text-foreground">
                  Invalid link
                </h1>
                <p className="text-muted-foreground text-sm">
                  This unsubscribe link is invalid or has expired.
                </p>
              </>
            )}

            {/* Error */}
            {status === 'error' && (
              <>
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
                <h1 className="text-xl font-display font-bold text-foreground">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground text-sm">
                  We couldn't process your request. Please try again later.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
