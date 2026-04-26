/**
 * @file useReducedMotion.ts — Accessibility: Detect & override motion preference
 *
 * COMBINES TWO SIGNALS:
 * 1. The user's OS-level `prefers-reduced-motion` setting (auto)
 * 2. A manual override saved in localStorage (Settings → Accessibility)
 *
 * USAGE:
 *   const reduced = useReducedMotion();      // boolean — should we reduce motion?
 *   <NebulaBackground />                      // internally calls this and returns null
 *
 * The override has THREE possible values:
 *   - "system"  → follow OS preference (default)
 *   - "reduce"  → force reduced motion ON
 *   - "full"    → force reduced motion OFF (allow all decorative motion)
 *
 * When `reduced` is true:
 *   - Decorative backgrounds (nebula, starfield, scan lines) are hidden
 *   - CSS transitions/animations are heavily shortened or disabled via the
 *     `data-reduce-motion="true"` attribute on <html> (see index.css)
 */
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'a11y:motion-preference';
type MotionPref = 'system' | 'reduce' | 'full';

/** Read the stored preference, defaulting to 'system' */
function readPref(): MotionPref {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'reduce' || stored === 'full' || stored === 'system') return stored;
  return 'system';
}

/** Read the OS-level `prefers-reduced-motion` setting */
function readSystem(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Compute the effective reduced-motion state from preference + system */
function compute(pref: MotionPref, system: boolean): boolean {
  if (pref === 'reduce') return true;
  if (pref === 'full') return false;
  return system; // 'system'
}

/**
 * Returns whether decorative motion should be reduced.
 * Reactive to both OS changes and Settings-page changes (via storage event).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => compute(readPref(), readSystem()));

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const update = () => setReduced(compute(readPref(), mq.matches));
    update();

    // Listen to OS changes
    mq.addEventListener('change', update);

    // Listen to localStorage changes (other tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) update();
    };
    window.addEventListener('storage', onStorage);

    // Listen to in-tab updates dispatched by setMotionPreference()
    const onCustom = () => update();
    window.addEventListener('a11y:motion-preference-change', onCustom);

    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('a11y:motion-preference-change', onCustom);
    };
  }, []);

  // Reflect on <html> so global CSS can react via [data-reduce-motion="true"]
  useEffect(() => {
    document.documentElement.setAttribute('data-reduce-motion', reduced ? 'true' : 'false');
  }, [reduced]);

  return reduced;
}

/** Read/write the user's stored preference */
export function getMotionPreference(): MotionPref {
  return readPref();
}

export function setMotionPreference(pref: MotionPref): void {
  window.localStorage.setItem(STORAGE_KEY, pref);
  // Notify in-tab listeners (storage event only fires across tabs)
  window.dispatchEvent(new Event('a11y:motion-preference-change'));
}

/** React hook wrapper for the preference + setter */
export function useMotionPreference() {
  const [pref, setPref] = useState<MotionPref>(() => readPref());

  useEffect(() => {
    const onChange = () => setPref(readPref());
    window.addEventListener('a11y:motion-preference-change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('a11y:motion-preference-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const update = useCallback((next: MotionPref) => {
    setMotionPreference(next);
    setPref(next);
  }, []);

  return { preference: pref, setPreference: update };
}
