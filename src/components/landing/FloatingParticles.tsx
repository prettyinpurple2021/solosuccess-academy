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

export function FloatingParticles({ count = 30 }: { count?: number }) {
  const reducedMotion = useReducedMotion();
  /* Generate random particle configs once */
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 5 + 1,              // 1–6px (slightly larger for nebula feel)
      x: Math.random() * 100,                   // 0–100%
      y: Math.random() * 100,
      duration: Math.random() * 25 + 20,         // 20–45s drift (slower, more cinematic)
      delay: Math.random() * -25,                // stagger start
      opacity: Math.random() * 0.4 + 0.05,       // 0.05–0.45
      hue: [270, 185, 320, 240, 200][Math.floor(Math.random() * 5)], // purple/cyan/pink/indigo/blue
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
