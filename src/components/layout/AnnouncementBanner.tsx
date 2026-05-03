/**
 * @file AnnouncementBanner.tsx — Sticky top banner that surfaces active
 * admin announcements to authenticated students.
 *
 * Behaviour:
 * - Fetches active announcements (date-windowed) and skips ones the user
 *   has already dismissed.
 * - Shows ONE banner at a time (most recent), color-coded by severity.
 * - Clicking the X dismisses it server-side so it stays gone across devices.
 * - Optional CTA button opens the configured URL (internal or external).
 */
import { Link } from 'react-router-dom';
import { useActiveAnnouncements, useDismissAnnouncement } from '@/hooks/useAnnouncements';
import { Button } from '@/components/ui/button';
import { X, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_STYLES = {
  info: {
    bar: 'border-info/40 bg-info/10 text-info-foreground',
    icon: 'text-info',
    Icon: Info,
  },
  success: {
    bar: 'border-success/40 bg-success/10 text-success-foreground',
    icon: 'text-success',
    Icon: CheckCircle2,
  },
  warning: {
    bar: 'border-warning/40 bg-warning/10 text-warning-foreground',
    icon: 'text-warning',
    Icon: AlertTriangle,
  },
} as const;

/** Detects whether a CTA URL is external (full URL) or internal (path). */
function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function AnnouncementBanner() {
  const { data: announcements } = useActiveAnnouncements();
  const dismiss = useDismissAnnouncement();

  // Show only the newest one to avoid stacking
  const a = announcements?.[0];
  if (!a) return null;

  const styles = SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.info;
  const Icon = styles.Icon;

  const cta =
    a.cta_label && a.cta_url ? (
      isExternalUrl(a.cta_url) ? (
        <a
          href={a.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm font-mono underline-offset-4 underline hover:no-underline"
        >
          {a.cta_label}
        </a>
      ) : (
        <Link
          to={a.cta_url}
          className="text-xs sm:text-sm font-mono underline-offset-4 underline hover:no-underline"
        >
          {a.cta_label}
        </Link>
      )
    ) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'relative w-full border-b px-4 py-2.5 flex items-start gap-3',
        styles.bar
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', styles.icon)} aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{a.title}</p>
        {a.body ? (
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed mt-0.5">
            {a.body}
          </p>
        ) : null}
        {cta ? <div className="mt-1.5">{cta}</div> : null}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0 hover:bg-foreground/10"
        onClick={() => dismiss.mutate(a.id)}
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}