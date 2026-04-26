/**
 * @file Billing.tsx — Student Billing & Purchase History
 *
 * Shows the authenticated user's purchases (course, amount, date, refund status)
 * with order IDs for support requests. Read-only — refunds are handled via
 * support per the refund policy.
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PageMeta } from '@/components/layout/PageMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingView } from '@/components/ui/loading-view';
import { ErrorView } from '@/components/ui/error-view';
import { Receipt, ExternalLink, Mail, Shield } from 'lucide-react';

interface PurchaseRow {
  id: string;
  course_id: string;
  amount_cents: number;
  purchased_at: string;
  refunded_at: string | null;
  refund_amount_cents: number | null;
  stripe_checkout_session_id: string | null;
  courses: { title: string | null } | null;
}

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Billing() {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['billing-purchases', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select(
          'id, course_id, amount_cents, purchased_at, refunded_at, refund_amount_cents, stripe_checkout_session_id, courses(title)'
        )
        .eq('user_id', user!.id)
        .order('purchased_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PurchaseRow[];
    },
  });

  if (isLoading) return <LoadingView message="Loading your billing history…" />;
  if (isError) {
    return (
      <ErrorView message={(error as Error)?.message} onRetry={() => refetch()} backTo="/dashboard" backLabel="Back to dashboard" />
    );
  }

  const purchases = data ?? [];
  const totalSpent = purchases
    .filter((p) => !p.refunded_at)
    .reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);

  return (
    <div className="container max-w-4xl py-10 relative z-10">
      <PageMeta
        title="Billing & Purchases"
        description="View your SoloSuccess Academy purchases, receipts, and order history."
        path="/billing"
      />

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Billing & Purchases</h1>
        <p className="text-muted-foreground">All your course purchases and receipts in one place.</p>
      </div>

      {/* Summary card */}
      <div className="data-card p-6 mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
            Total Spent (lifetime)
          </p>
          <p className="text-3xl font-display font-bold text-primary">{formatCents(totalSpent)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {purchases.length} purchase{purchases.length === 1 ? '' : 's'}
          </p>
        </div>
        <Receipt className="h-12 w-12 text-primary/40" aria-hidden />
      </div>

      {/* Purchases list */}
      {purchases.length === 0 ? (
        <div className="data-card p-12 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" aria-hidden />
          <h2 className="text-xl font-heading font-semibold mb-2">No purchases yet</h2>
          <p className="text-muted-foreground mb-6">Browse the catalog to find your first course.</p>
          <Button asChild variant="neon">
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((p) => (
            <div key={p.id} className="data-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-heading font-semibold text-foreground truncate">
                    {p.courses?.title ?? 'Course'}
                  </h3>
                  {p.refunded_at ? (
                    <Badge variant="outline" className="border-warning/40 text-warning">
                      Refunded
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-success/40 text-success">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(p.purchased_at)}
                  {p.stripe_checkout_session_id ? (
                    <>
                      {' · '}
                      <span className="font-mono text-xs">
                        {p.stripe_checkout_session_id.slice(0, 14)}…
                      </span>
                    </>
                  ) : null}
                </p>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <div className="text-right">
                  <p className="text-lg font-display font-bold text-foreground">
                    {formatCents(p.amount_cents)}
                  </p>
                  {p.refunded_at && p.refund_amount_cents ? (
                    <p className="text-xs text-warning font-mono">
                      Refunded {formatCents(p.refund_amount_cents)}
                    </p>
                  ) : null}
                </div>
                {!p.refunded_at && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/courses/${p.course_id}`}>
                      Open <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help / refund info */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="data-card p-5">
          <Shield className="h-5 w-5 text-success mb-2" aria-hidden />
          <h3 className="font-heading font-semibold text-foreground mb-1">Refund eligible?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Within 30 days and under 50% complete? You qualify for a full refund.
          </p>
          <Button asChild variant="link" size="sm" className="px-0">
            <Link to="/refund">View refund policy →</Link>
          </Button>
        </div>
        <div className="data-card p-5">
          <Mail className="h-5 w-5 text-primary mb-2" aria-hidden />
          <h3 className="font-heading font-semibold text-foreground mb-1">Need a tax invoice or refund?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Email us with your Order ID and we&apos;ll handle it within 5–7 business days.
          </p>
          <Button asChild variant="link" size="sm" className="px-0">
            <Link to="/contact">Contact support →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
