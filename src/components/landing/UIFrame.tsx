/**
 * @file UIFrame.tsx — Decorative corner brackets / scanning line
 * 
 * Wraps content with futuristic "HUD frame" corner brackets
 * and an optional scanning line animation.
 */
import { cn } from '@/lib/utils';

interface UIFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Show the animated scanning line */
  scanline?: boolean;
  /** Corner bracket color — uses CSS var */
  color?: 'primary' | 'secondary' | 'accent';
}

const colorMap = {
  primary: 'border-primary/50',
  secondary: 'border-secondary/50',
  accent: 'border-accent/50',
};

const glowMap = {
  primary: 'shadow-[0_0_8px_hsl(var(--glow-purple)/0.3)]',
  secondary: 'shadow-[0_0_8px_hsl(var(--glow-cyan)/0.3)]',
  accent: 'shadow-[0_0_8px_hsl(var(--glow-pink)/0.3)]',
};

export function UIFrame({ children, className, scanline = false, color = 'primary' }: UIFrameProps) {
  const borderColor = colorMap[color];
  const glow = glowMap[color];

  return (
    <div className={cn('relative', className)}>
      {/* Corner brackets — top left */}
      <span className={cn('absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2', borderColor, glow)} />
      {/* Top right */}
      <span className={cn('absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2', borderColor, glow)} />
      {/* Bottom left */}
      <span className={cn('absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2', borderColor, glow)} />
      {/* Bottom right */}
      <span className={cn('absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2', borderColor, glow)} />

      {/* Optional scanning line */}
      {scanline && (
        <span
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent pointer-events-none animate-scan-line"
          aria-hidden="true"
        />
      )}

      {children}
    </div>
  );
}
