import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  useDeletionRequest,
  useRequestDeletion,
  useCancelDeletion,
} from '@/hooks/useAccountDeletion';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountCardProps {
  userId: string;
}

export function DeleteAccountCard({ userId }: DeleteAccountCardProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteContent, setDeleteContent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: pending, isLoading } = useDeletionRequest(userId);
  const requestDeletion = useRequestDeletion();
  const cancelDeletion = useCancelDeletion();

  const handleConfirm = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      toast({ title: 'Type DELETE to confirm', variant: 'destructive' });
      return;
    }
    try {
      await requestDeletion.mutateAsync(deleteContent);
      toast({
        title: 'Account scheduled for deletion',
        description: 'You have 30 days to change your mind. Sign in any time before then to cancel.',
      });
      setOpen(false);
      setConfirmText('');
      // Sign the user out so the recovery banner appears on next sign-in.
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    try {
      await cancelDeletion.mutateAsync();
      toast({ title: 'Deletion cancelled', description: 'Your account is safe.' });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading) return null;

  // If there's already a pending deletion, show the cancel UI instead.
  if (pending) {
    const purgeDate = new Date(pending.scheduled_purge_at);
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Account Pending Deletion
          </CardTitle>
          <CardDescription>
            Your account is scheduled to be permanently deleted on{' '}
            <strong>{format(purgeDate, 'PPP')}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCancel} disabled={cancelDeletion.isPending}>
            {cancelDeletion.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling...</>
            ) : (
              'Cancel Deletion & Restore Account'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive font-display">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account, courses, certificates, and all data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>This is irreversible after 30 days</AlertTitle>
            <AlertDescription>
              Your account will be deactivated immediately and permanently deleted after a 30-day grace period. Sign in any time before then to cancel.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              Your account will be deactivated now and permanently purged in 30 days. You can cancel any time before then by signing back in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <Checkbox
                id="del-content"
                checked={deleteContent}
                onCheckedChange={(c) => setDeleteContent(c === true)}
                className="mt-1"
              />
              <Label htmlFor="del-content" className="font-normal cursor-pointer leading-snug">
                <span className="font-medium">Also delete all my discussions, comments, and notes.</span>
                <span className="block text-xs text-muted-foreground mt-1">
                  If unchecked, your posts will remain but be shown as "Anonymous" so existing conversations stay intact.
                </span>
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-del">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm-del"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={requestDeletion.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={requestDeletion.isPending || confirmText.trim().toUpperCase() !== 'DELETE'}
            >
              {requestDeletion.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scheduling...</>
              ) : (
                'Schedule Deletion'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
