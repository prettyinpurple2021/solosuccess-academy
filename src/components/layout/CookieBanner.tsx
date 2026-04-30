/**
 * @file CookieBanner.tsx — Essential Cookies Disclosure Banner
 *
 * Lightweight notice shown on public pages until dismissed. Because
 * SoloSuccess Academy only uses strictly-necessary cookies (auth session),
 * no consent toggles are required — just a clear disclosure and a link
 * to the Privacy Policy. Dismissal is stored in localStorage.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'ssa_cookie_notice_dismissed_v1';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode etc.) — show banner anyway
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-6 sm:px-6 pointer-events-none"
    >
      <div className="mx-auto max-w-3xl pointer-events-auto rounded-lg border border-primary/30 bg-background/95 shadow-lg shadow-primary/10 backdrop-blur-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
          <Cookie
            className="h-5 w-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p className="flex-1 text-sm text-foreground/90 leading-relaxed">
            We use <strong className="text-foreground">essential cookies only</strong> to keep
            you signed in and remember your preferences. No tracking, no ads.{' '}
            <Link
              to="/privacy"
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
            >
              Read our Privacy Policy
            </Link>
            .
          </p>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={dismiss}
              className="flex-1 sm:flex-none"
            >
              Got it
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={dismiss}
              aria-label="Dismiss cookie notice"
              className="hidden sm:inline-flex"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
