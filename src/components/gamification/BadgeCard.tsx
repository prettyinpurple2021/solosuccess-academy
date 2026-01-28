import { cn } from '@/lib/utils';
import { AchievementBadge } from '@/hooks/useGamification';
import { icons } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BadgeCardProps {
  badge: AchievementBadge;
  earned?: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const categoryColors: Record<string, string> = {
  lessons: 'from-blue-500 to-cyan-500',
  courses: 'from-purple-500 to-pink-500',
  streaks: 'from-orange-500 to-red-500',
  xp: 'from-yellow-500 to-amber-500',
  community: 'from-green-500 to-emerald-500',
  projects: 'from-indigo-500 to-violet-500',
  general: 'from-gray-500 to-slate-500',
};

export function BadgeCard({ 
  badge, 
  earned = false, 
  earnedAt,
  size = 'md',
  showTooltip = true,
}: BadgeCardProps) {
  // Get the icon component dynamically
  const iconName = badge.icon.split('-').map((part, i) => 
    i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('') as keyof typeof icons;
  
  const IconComponent = icons[iconName] || icons['Trophy'];

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  };

  const gradientClass = categoryColors[badge.category] || categoryColors.general;

  const badgeElement = (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all duration-300',
        sizeClasses[size],
        earned
          ? `bg-gradient-to-br ${gradientClass} shadow-lg`
          : 'bg-muted/50 border border-muted-foreground/20',
        earned && 'hover:scale-110 hover:shadow-xl'
      )}
    >
      {earned && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
      )}
      <IconComponent 
        className={cn(
          iconSizes[size],
          earned ? 'text-white drop-shadow-md' : 'text-muted-foreground/50'
        )} 
      />
      {!earned && (
        <div className="absolute inset-0 rounded-full bg-background/60" />
      )}
    </div>
  );

  if (!showTooltip) {
    return badgeElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeElement}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-center">
            <p className="font-bold">{badge.name}</p>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            {earned && earnedAt && (
              <p className="text-xs text-primary mt-1">
                Earned {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
            {!earned && badge.xp_reward > 0 && (
              <p className="text-xs text-secondary mt-1">
                +{badge.xp_reward} XP reward
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
