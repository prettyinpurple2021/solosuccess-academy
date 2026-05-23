/**
 * @file TurnstileWidget.tsx — Cloudflare Turnstile invisible/managed challenge
 *
 * Loads the Cloudflare Turnstile script once and renders the widget into a
 * dedicated div. Calls onVerify(token) when a challenge token is issued, and
 * onExpire() when it expires so the parent can disable submission.
 *
 * In local dev (Vite DEV) we use Cloudflare's always-passes test site key so
 * we don't need to register `localhost` as a hostname.
 * Docs: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
import { useEffect, useRef } from 'react';

// Public site key (safe to ship in client code)
const PROD_SITE_KEY = '0x4AAAAAADVBbmcGPRvKo1iz';
// Cloudflare test key — always passes; use only in DEV
const TEST_SITE_KEY = '1x00000000000000000000AA';

const SITE_KEY = import.meta.env.DEV ? TEST_SITE_KEY : PROD_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Cloudflare Turnstile'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface Props {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

export function TurnstileWidget({ onVerify, onExpire, onError, theme = 'dark' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme,
          callback: (token: string) => onVerify(token),
          'expired-callback': () => onExpire?.(),
          'error-callback': () => onError?.(),
        });
      })
      .catch((err) => {
        console.error(err);
        onError?.();
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* noop */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="flex justify-center" />;
}