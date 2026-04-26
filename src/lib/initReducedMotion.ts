/**
 * @file initReducedMotion.ts — Global pre-React initialization
 *
 * Runs ONCE on app boot (imported in main.tsx) BEFORE any component renders.
 * Sets `data-reduce-motion` on <html> so the CSS reduced-motion rules
 * take effect on the very first paint — no flash of animated UI.
 *
 * This duplicates a tiny piece of logic from useReducedMotion.ts on
 * purpose: that hook only runs after React mounts, which is too late
 * for the initial paint of decorative backgrounds.
 */
const STORAGE_KEY = 'a11y:motion-preference';

type MotionPref = 'system' | 'reduce' | 'full';

function readPref(): MotionPref {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'reduce' || v === 'full' || v === 'system') return v;
  } catch {
    // localStorage unavailable (private mode, SSR) — fall through to default
  }
  return 'system';
}

function readSystem(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function initReducedMotion(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const pref = readPref();
  const system = readSystem();
  const reduced = pref === 'reduce' || (pref === 'system' && system);
  document.documentElement.setAttribute('data-reduce-motion', reduced ? 'true' : 'false');
}
