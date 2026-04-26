import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDeletionRequest, useCancelDeletion } from '@/hooks/useAccountDeletion';
import { useToast } from '@/hooks/use-toast';

/**
 * Sitewide banner shown to logged-in users who have a pending deletion.
 * Displayed once at the top of authenticated pages so users can quickly
 * cancel the deletion if they signed back in by mistake.
 */
export function PendingDeletionBanner() {
  const { user } = useAuth();
  const { data: pending } = useDeletionRequest(user?.id);
  const cancel = useCancelDeletion();
  const { toast } = useToast();

  if (!pending) return null;

  const purgeDate = new Date(pending.scheduled_purge_at);

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync();
      toast({ title: 'Welcome back!', description: 'Your account deletion has been cancelled.' });
    } catch (err: any) {
      toast({ title: 'Failed to cancel', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="container mt-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Your account is scheduled for deletion</AlertTitle>
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <span>
            Permanent deletion on <strong>{format(purgeDate, 'PPP')}</strong>. Cancel now to keep your account.
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCancel} disabled={cancel.isPending}>
              {cancel.isPending ? 'Cancelling...' : 'Cancel deletion'}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/settings">Manage</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
