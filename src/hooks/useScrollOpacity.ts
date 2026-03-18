import { useState, useEffect } from 'react';

/**
 * Returns a CSS-ready opacity value (0–1) that increases
 * as the user scrolls down the page.
 *
 * @param min  Starting opacity at scroll = 0 (default 0.75)
 * @param max  Final opacity once fully scrolled (default 0.95)
 * @param distance  Scroll distance (px) over which the transition completes (default 300)
 */
export function useScrollOpacity(min = 0.75, max = 0.95, distance = 300) {
  const [opacity, setOpacity] = useState(min);

  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(window.scrollY / distance, 1);
      setOpacity(min + (max - min) * progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial value
    return () => window.removeEventListener('scroll', onScroll);
  }, [min, max, distance]);

  return opacity;
}
