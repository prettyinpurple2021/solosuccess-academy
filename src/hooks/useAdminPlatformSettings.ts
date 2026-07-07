/**
 * @file useAdminPlatformSettings.ts — Admin-only hooks for platform-wide settings.
 *
 * Covers:
 *  - XP config rows (list + upsert) via the `xp_config` table (admin ALL policy).
 *  - Rate-limit cleanup via `cleanup_expired_rate_limits` RPC.
 *  - Rate-limit inspection (recent buckets) for admin visibility.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── XP CONFIG ────────────────────────────────────────────────

export interface XpConfigRow {
  id: string;
  action_key: string;
  xp_amount: number;
  label: string | null;
  updated_at: string;
}

/** Full XP config rows — admin view (includes label/updated_at). */
export function useAdminXpConfig() {
  return useQuery({
    queryKey: ['admin', 'xp-config'],
    queryFn: async (): Promise<XpConfigRow[]> => {
      const { data, error } = await supabase
        .from('xp_config' as any)
        .select('id, action_key, xp_amount, label, updated_at')
        .order('action_key');
      if (error) throw error;
      return (data as any[]) as XpConfigRow[];
    },
  });
}

/** Update one XP row's amount (and optional label). */
export function useUpdateXpConfig() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (row: { id: string; xp_amount: number; label?: string | null }) => {
      const { error } = await supabase
        .from('xp_config' as any)
        .update({ xp_amount: row.xp_amount, label: row.label ?? undefined })
        .eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'xp-config'] });
      qc.invalidateQueries({ queryKey: ['xp-config'] });
      toast({ title: 'XP value saved.' });
    },
    onError: (e: any) =>
      toast({ title: 'Failed to save XP value', description: e.message, variant: 'destructive' }),
  });
}

// ── RATE LIMITS ──────────────────────────────────────────────

export interface RateLimitBucket {
  identifier: string;
  identifier_type: string;
  endpoint: string;
  window_start: string;
  request_count: number;
}

/** Recent rate-limit buckets (last 100) for admin awareness. */
export function useRecentRateLimits() {
  return useQuery({
    queryKey: ['admin', 'rate-limits'],
    queryFn: async (): Promise<RateLimitBucket[]> => {
      const { data, error } = await supabase
        .from('api_rate_limits' as any)
        .select('identifier, identifier_type, endpoint, window_start, request_count')
        .order('window_start', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as any[]) as RateLimitBucket[];
    },
  });
}

/** Purge rate-limit buckets older than 24h. */
export function useCleanupRateLimits() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('cleanup_expired_rate_limits' as any);
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: (deleted) => {
      qc.invalidateQueries({ queryKey: ['admin', 'rate-limits'] });
      toast({ title: `Cleaned up ${deleted} expired rate-limit buckets.` });
    },
    onError: (e: any) =>
      toast({ title: 'Cleanup failed', description: e.message, variant: 'destructive' }),
  });
}