/**
 * @file FloatingParticles.tsx — Bokeh / digital dust particles
 *
 * Renders floating, semi-transparent circles that drift slowly
 * to create a sense of 3D depth on the landing page.
 * Uses pure CSS animations — no JS runtime cost.
 *
 * ACCESSIBILITY: Returns null when reduced motion is requested.
 */
import { useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  hue: number;
}

// Deterministic PRNG (mulberry32) — SSR and client must produce identical
// particle configs, so Math.random() cannot be used here.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FloatingParticles({ count = 30 }: { count?: number }) {
  const reducedMotion = useReducedMotion();
  /* Generate deterministic particle configs once */
  const particles = useMemo<Particle[]>(() => {
    const rand = mulberry32(1337); // fixed seed → SSR/client match
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: rand() * 5 + 1,              // 1–6px (slightly larger for nebula feel)
      x: rand() * 100,                   // 0–100%
      y: rand() * 100,
      duration: rand() * 25 + 20,         // 20–45s drift (slower, more cinematic)
      delay: rand() * -25,                // stagger start
      opacity: rand() * 0.4 + 0.05,       // 0.05–0.45
      hue: [270, 185, 320, 240, 200][Math.floor(rand() * 5)], // purple/cyan/pink/indigo/blue
    }));
  }, [count]);

  if (reducedMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            background: `hsl(${p.hue} 80% 60%)`,
            boxShadow: `0 0 ${p.size * 3}px hsl(${p.hue} 80% 60% / 0.4)`,
            animation: `particle-drift ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
