import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { useCohortAnalytics } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

// Renders a paying-student cohort retention heatmap and per-cohort summary.
// "Cohort" = users grouped by the month they first purchased. Retention = %
// of that cohort with any activity_day in week N after their first purchase.
export function CohortAnalytics() {
  const { data, isLoading } = useCohortAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <NeonSpinner />
      </div>
    );
  }

  const cohorts = data ?? [];
  const hasAny = cohorts.some((c) => c.size > 0);
  const weekCount = cohorts[0]?.retention.length ?? 8;

  // Map 0-100% retention to a cyan intensity class (Tailwind must see the full
  // string literal, so we can't template the shade — enumerate them).
  const heatCell = (pct: number, size: number): string => {
    if (size === 0) return 'bg-muted/20 text-muted-foreground/60';
    if (pct >= 80) return 'bg-primary/80 text-primary-foreground';
    if (pct >= 60) return 'bg-primary/60 text-primary-foreground';
    if (pct >= 40) return 'bg-primary/40 text-foreground';
    if (pct >= 20) return 'bg-primary/25 text-foreground';
    if (pct > 0) return 'bg-primary/15 text-foreground';
    return 'bg-muted/30 text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="neon-text">Cohort Retention</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paying students grouped by first-purchase month. Each cell shows
            the % of that cohort with any learning activity in the given week.
          </p>
        </CardHeader>
        <CardContent>
          {!hasAny ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No paying-student cohorts yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Cohort</th>
                    <th className="py-2 pr-4 font-medium">Size</th>
                    {Array.from({ length: weekCount }, (_, w) => (
                      <th
                        key={w}
                        className="py-2 px-1 font-medium text-center min-w-[54px]"
                      >
                        W{w}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr
                      key={c.cohortKey}
                      className="border-t border-primary/10"
                    >
                      <td className="py-2 pr-4 whitespace-nowrap font-medium">
                        {c.cohortLabel}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.size}
                      </td>
                      {c.retention.map((pct, w) => (
                        <td key={w} className="py-1 px-1">
                          <div
                            className={cn(
                              'rounded-md text-center text-xs font-semibold py-2 transition-colors',
                              heatCell(pct, c.size),
                            )}
                            title={
                              c.size === 0
                                ? 'No students in this cohort'
                                : `Week ${w}: ${pct}% active`
                            }
                          >
                            {c.size === 0 ? '—' : `${pct}%`}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-primary/30">
        <CardHeader>
          <CardTitle className="neon-text">Cohort Engagement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-primary/20">
                  <th className="py-2 pr-4 font-medium">Cohort</th>
                  <th className="py-2 pr-4 font-medium">Students</th>
                  <th className="py-2 pr-4 font-medium">Avg Revenue</th>
                  <th className="py-2 pr-4 font-medium">Avg Lessons Done</th>
                  <th className="py-2 pr-4 font-medium">Avg XP</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.cohortKey} className="border-t border-primary/10">
                    <td className="py-2 pr-4 font-medium">{c.cohortLabel}</td>
                    <td className="py-2 pr-4">{c.size}</td>
                    <td className="py-2 pr-4">
                      {c.size > 0 ? `$${c.avgRevenue.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      {c.size > 0 ? c.avgLessonsCompleted : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      {c.size > 0 ? c.avgXp.toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}