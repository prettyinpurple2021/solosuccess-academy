import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
  label?: string;
  sublabel?: string;
}

const sizeConfig = {
  sm: { dimension: 64, textSize: 'text-sm', sublabelSize: 'text-[10px]' },
  md: { dimension: 96, textSize: 'text-xl', sublabelSize: 'text-xs' },
  lg: { dimension: 128, textSize: 'text-2xl', sublabelSize: 'text-sm' },
  xl: { dimension: 160, textSize: 'text-3xl', sublabelSize: 'text-base' },
};

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth = 8,
  showPercentage = true,
  className,
  label,
  sublabel,
}: ProgressRingProps) {
  const config = sizeConfig[size];
  const radius = (config.dimension - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.dimension}
        height={config.dimension}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        
        {/* Progress circle with gradient */}
        <defs>
          <linearGradient id={`progressGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
        
        <circle
          cx={config.dimension / 2}
          cy={config.dimension / 2}
          r={radius}
          fill="none"
          stroke={`url(#progressGradient-${size})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            filter: progress > 0 ? 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))' : 'none',
          }}
        />
        
        {/* Glow effect for completed sections */}
        {progress > 0 && (
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth + 4}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="opacity-20 blur-sm"
          />
        )}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className={cn('font-bold font-display', config.textSize)}>
            {Math.round(progress)}
            <span className="text-muted-foreground text-[0.6em]">%</span>
          </span>
        )}
        {label && (
          <span className={cn('text-muted-foreground mt-0.5', config.sublabelSize)}>
            {label}
          </span>
        )}
        {sublabel && (
          <span className={cn('text-muted-foreground/70', config.sublabelSize)}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
