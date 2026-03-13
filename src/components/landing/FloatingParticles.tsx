/**
 * @file FloatingParticles.tsx — Bokeh / digital dust particles
 * 
 * Renders floating, semi-transparent circles that drift slowly
 * to create a sense of 3D depth on the landing page.
 * Uses pure CSS animations — no JS runtime cost.
 */
import { useMemo } from 'react';

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
  /* Generate random particle configs once */
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 1,          // 1–5px
      x: Math.random() * 100,                // 0–100%
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,     // 15–35s drift
      delay: Math.random() * -20,            // stagger start
      opacity: Math.random() * 0.35 + 0.05,  // 0.05–0.4
      hue: [270, 185, 320][Math.floor(Math.random() * 3)], // purple / cyan / pink
    }));
  }, [count]);

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
