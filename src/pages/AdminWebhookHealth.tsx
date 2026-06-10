/**
 * @file AdminWebhookHealth.tsx — Admin panel showing Stripe webhook health:
 * recent event counts (last 24h / 7d), per-type breakdown, and the most
 * recent error. Read-only; admins only (RLS already restricts the table).
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, Activity, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed_at: string;
  status: string;
  error_message: string | null;
}

export default function AdminWebhookHealth() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  // Pull the last 500 webhook events. RLS restricts this to admins.
  const { data: events, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-webhook-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stripe_webhook_events')
        .select('id, stripe_event_id, event_type, processed_at, status, error_message')
        .order('processed_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as WebhookEvent[];
    },
    refetchInterval: 30_000, // auto-refresh every 30s
  });

  // Roll up counts so the cards/summary are cheap to render.
  const now = Date.now();
  const last24h = (events ?? []).filter(e => now - new Date(e.processed_at).getTime() < 86_400_000);
  const last7d = (events ?? []).filter(e => now - new Date(e.processed_at).getTime() < 7 * 86_400_000);
  const failed = (events ?? []).filter(e => e.status === 'failed');
  const lastError = failed[0] ?? null;

  // Manually trigger the monitor so admins can confirm alerts are wired.
  const runCheckNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-webhook-health');
      if (error) throw error;
      const sent = data?.sent?.length ?? 0;
      const triggered = data?.alertsTriggered?.length ?? 0;
      toast({
        title: triggered ? 'Alert triggered' : 'No alerts needed',
        description: triggered
          ? `Sent ${sent} email${sent === 1 ? '' : 's'} for: ${data.alertsTriggered.join(', ')}`
          : 'Webhook health is within normal thresholds.',
      });
    } catch (err: any) {
      toast({
        title: 'Check failed',
        description: err?.message ?? 'Unable to run webhook health check.',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  // Per-type breakdown for the last 7 days
  const byType = last7d.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Webhook Health</h1>
            <p className="text-sm text-muted-foreground">
              Stripe webhook activity (auto-refreshes every 30s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runCheckNow} disabled={running}>
            <Mail className={`mr-2 h-4 w-4 ${running ? 'animate-pulse' : ''}`} />
            Run check now
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><NeonSpinner /></div>
      ) : (
        <>
          {/* Top summary cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Last 24h</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{last24h.length}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Last 7 days</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{last7d.length}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Failed (total)</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-2">
                {failed.length === 0
                  ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                  : <AlertTriangle className="h-5 w-5 text-destructive" />}
                <span className="text-3xl font-bold">{failed.length}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total stored</CardTitle></CardHeader>
              <CardContent>
                <span className="text-3xl font-bold">{events?.length ?? 0}</span>
                <span className="ml-1 text-xs text-muted-foreground">(max 500)</span>
              </CardContent>
            </Card>
          </div>

          {/* Most recent failure */}
          {lastError && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" /> Most Recent Error
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div><span className="text-muted-foreground">Event:</span> <code>{lastError.event_type}</code></div>
                <div><span className="text-muted-foreground">When:</span> {format(new Date(lastError.processed_at), 'PPpp')}</div>
                <div><span className="text-muted-foreground">ID:</span> <code className="text-xs">{lastError.stripe_event_id}</code></div>
                {lastError.error_message && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">{lastError.error_message}</pre>
                )}
              </CardContent>
            </Card>
          )}

          {/* Per-type breakdown */}
          <Card>
            <CardHeader><CardTitle>Event Types (last 7 days)</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(byType).length === 0 ? (
                <p className="text-sm text-muted-foreground">No events in the last 7 days.</p>
              ) : (
                <ul className="divide-y">
                  {Object.entries(byType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <li key={type} className="flex items-center justify-between py-2 text-sm">
                        <code>{type}</code>
                        <Badge variant="secondary">{count}</Badge>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent events table */}
          <Card>
            <CardHeader><CardTitle>Recent Events</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4">When</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Stripe Event ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(events ?? []).slice(0, 50).map(e => (
                      <tr key={e.id} className="border-t">
                        <td className="py-2 pr-4 whitespace-nowrap">{format(new Date(e.processed_at), 'MMM d, HH:mm:ss')}</td>
                        <td className="py-2 pr-4"><code className="text-xs">{e.event_type}</code></td>
                        <td className="py-2 pr-4">
                          <Badge variant={e.status === 'failed' ? 'destructive' : 'secondary'}>{e.status}</Badge>
                        </td>
                        <td className="py-2 pr-4"><code className="text-xs">{e.stripe_event_id}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}