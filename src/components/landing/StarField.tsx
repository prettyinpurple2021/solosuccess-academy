/**
 * @file StarField.tsx — Twinkling star dots for nebula depth
 * 
 * Generates tiny glowing dots with staggered twinkle animations
 * to simulate a distant star field behind the nebula clouds.
 * Pure CSS — no JS runtime cost after initial render.
 */
import { useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  hue: number;
}

export function StarField({ count = 40 }: { count?: number }) {
  const reducedMotion = useReducedMotion();
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,          // 0.5–2.5px
      delay: Math.random() * -10,              // stagger
      duration: Math.random() * 6 + 4,         // 4–10s twinkle
      hue: [270, 185, 320, 220, 0][Math.floor(Math.random() * 5)], // purple/cyan/pink/blue/white
    }));
  }, [count]);

  // Skip rendering entirely when reduced motion is requested — the field
  // is decorative only and twinkling can be distracting.
  if (reducedMotion) return null;


  return (
    <div className="fixed inset-0 pointer-events-none z-[0] overflow-hidden" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full"
          style={{
            width: s.size,
            height: s.size,
            left: `${s.x}%`,
            top: `${s.y}%`,
            background: s.hue === 0
              ? `hsl(0 0% 90%)`
              : `hsl(${s.hue} 70% 70%)`,
            boxShadow: s.hue === 0
              ? `0 0 ${s.size * 3}px hsl(0 0% 90% / 0.5)`
              : `0 0 ${s.size * 3}px hsl(${s.hue} 70% 70% / 0.5)`,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
