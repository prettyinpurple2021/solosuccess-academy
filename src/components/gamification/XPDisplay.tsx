import { Zap, Flame, TrendingUp } from 'lucide-react';
import { useUserGamification, useGamificationRealtime } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface XPDisplayProps {
  compact?: boolean;
  className?: string;
}

export function XPDisplay({ compact = false, className }: XPDisplayProps) {
  const { user } = useAuth();
  const { data: gamification } = useUserGamification(user?.id);
  
  // Enable real-time updates
  useGamificationRealtime(user?.id);

  const xp = gamification?.total_xp || 0;
  const streak = gamification?.current_streak || 0;

  // Calculate level based on XP (every 500 XP = 1 level)
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpToNextLevel = 500;
  const progress = (xpInLevel / xpToNextLevel) * 100;

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-3', className)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/20 border border-primary/30">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">{xp.toLocaleString()}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Level {level} • {xpInLevel}/{xpToNextLevel} XP to next level</p>
            </TooltipContent>
          </Tooltip>

          {streak > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-bold text-orange-500">{streak}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{streak}-day learning streak!</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('glass-card p-4 rounded-xl', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Level {level}</p>
            <p className="text-2xl font-bold font-display neon-text">{xp.toLocaleString()} XP</p>
          </div>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
            <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
            <div>
              <p className="text-lg font-bold text-orange-500">{streak}</p>
              <p className="text-xs text-orange-400">day streak</p>
            </div>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{xpInLevel} XP</span>
          <span>{xpToNextLevel} XP</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {xpToNextLevel - xpInLevel} XP to Level {level + 1}
        </p>
      </div>
    </div>
  );
}
