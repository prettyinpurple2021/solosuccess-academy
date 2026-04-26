/**
 * Hook for the account-deletion soft-delete lifecycle.
 *
 * - useDeletionRequest(): reads the user's pending deletion request (if any)
 * - useRequestDeletion(): schedules a 30-day soft delete
 * - useCancelDeletion(): cancels a pending deletion
 * - useHardDeleteAccount(): immediately purges the account via edge function
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeletionRequest {
  requested_at: string;
  scheduled_purge_at: string;
  delete_content: boolean;
  status: string;
}

export function useDeletionRequest(userId: string | undefined) {
  return useQuery({
    queryKey: ['deletion-request', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_deletion_request');
      if (error) throw error;
      return data as DeletionRequest | null;
    },
  });
}

export function useRequestDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deleteContent: boolean) => {
      const { data, error } = await supabase.rpc('request_account_deletion', {
        _delete_content: deleteContent,
      });
      if (error) throw error;
      return data as { scheduled_purge_at: string; status: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deletion-request'] }),
  });
}

export function useCancelDeletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('cancel_account_deletion');
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deletion-request'] }),
  });
}

export function useHardDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('delete-user-account');
      if (error) throw error;
      return data;
    },
  });
}
