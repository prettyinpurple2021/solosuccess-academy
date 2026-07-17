import posthog from 'posthog-js';

const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string;
const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string;

if (key) {
  posthog.init(key, {
    api_host: host,
    defaults: '2026-05-30',
  });
}

export default posthog;
