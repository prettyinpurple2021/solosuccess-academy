/**
 * ReadingProgressBar - Shows reading progress as user scrolls through lesson content
 * 
 * A fixed-position bar at the top of the viewport that fills as the user
 * scrolls down the lesson content. Provides visual feedback on reading progress.
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ReadingProgressBarProps {
  className?: string;
}

export function ReadingProgressBar({ className }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (docHeight > 0) {
        const scrollPercent = (scrollTop / docHeight) * 100;
        setProgress(Math.min(100, Math.max(0, scrollPercent)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={cn(
        'fixed top-0 left-0 right-0 h-1 z-50 bg-background/20 backdrop-blur-sm',
        className
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-150 ease-out shadow-[0_0_10px_hsl(var(--primary)/0.8),0_0_20px_hsl(var(--primary)/0.4)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
