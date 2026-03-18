/**
 * @file ReadingTimer.tsx — Compact Reading Timer Display
 *
 * PURPOSE: Shows the elapsed reading time as a small pill in the
 * textbook viewer toolbar. Pulses gently to indicate active tracking.
 * Changes color at XP milestone thresholds for visual feedback.
 */
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadingTimerProps {
  /** Formatted time string (e.g., "12:34") */
  formattedTime: string;
  /** Total elapsed seconds (used for milestone color changes) */
  elapsedSeconds: number;
}

export function ReadingTimer({ formattedTime, elapsedSeconds }: ReadingTimerProps) {
  // Color changes at milestone thresholds for visual reward
  const minutes = Math.floor(elapsedSeconds / 60);
  const colorClass =
    minutes >= 60
      ? 'text-accent border-accent/40 bg-accent/10'       // 1 hour — accent glow
      : minutes >= 30
        ? 'text-primary border-primary/40 bg-primary/10'   // 30 min — primary
        : minutes >= 15
          ? 'text-secondary border-secondary/40 bg-secondary/10' // 15 min — secondary
          : 'text-muted-foreground border-border bg-muted/30';   // Default — subtle

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition-colors duration-500',
        colorClass
      )}
    >
      <Clock className="h-3 w-3" />
      <span>{formattedTime}</span>
    </motion.div>
  );
}
