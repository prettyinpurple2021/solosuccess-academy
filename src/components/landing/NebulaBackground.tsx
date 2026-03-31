/**
 * @file NebulaBackground.tsx — Ambient nebula cloud overlays
 * 
 * Renders 3 large, blurred radial-gradient clouds that slowly
 * breathe and rotate, creating a deep-space nebula feel.
 * Pure CSS animations — no JS runtime cost.
 */

export function NebulaBackground() {
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
