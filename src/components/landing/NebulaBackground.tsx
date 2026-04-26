/**
 * @file NebulaBackground.tsx — Ambient nebula cloud overlays
 *
 * Renders 3 large, blurred radial-gradient clouds that slowly
 * breathe and rotate, creating a deep-space nebula feel.
 * Pure CSS animations — no JS runtime cost.
 *
 * ACCESSIBILITY:
 * Returns null when the user has opted into reduced motion (Settings →
 * Accessibility, or OS-level prefers-reduced-motion). This removes both
 * the visual distraction AND the GPU cost of the always-on animations.
 */
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function NebulaBackground() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden" aria-hidden="true">
      {/* Purple nebula cloud — top left */}
      <div className="nebula-cloud nebula-cloud-1" />
      {/* Cyan nebula cloud — bottom right */}
      <div className="nebula-cloud nebula-cloud-2" />
      {/* Pink nebula cloud — mid right */}
      <div className="nebula-cloud nebula-cloud-3" />
    </div>
  );
}
