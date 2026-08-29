import posthog from 'posthog-js';

const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string;
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string;

// SSR guard: this module is imported by the root route, which also evaluates
// on the server — PostHog must only initialize in a real browser.
if (key && typeof window !== 'undefined') {
  posthog.init(key, {
    api_host: host,
    defaults: '2026-05-30',
  });
}

export default posthog;
