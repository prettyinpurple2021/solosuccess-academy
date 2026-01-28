import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgeCard } from './BadgeCard';
import { useAllBadges, useUserBadges } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { Award, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BadgesDisplayProps {
  className?: string;
  showAll?: boolean;
}

const categoryLabels: Record<string, string> = {
  lessons: 'Lessons',
  courses: 'Courses',
  streaks: 'Streaks',
  xp: 'XP',
  community: 'Community',
  projects: 'Projects',
};

export function BadgesDisplay({ className, showAll = false }: BadgesDisplayProps) {
  const { user } = useAuth();
  const { data: allBadges, isLoading: badgesLoading } = useAllBadges();
  const { data: userBadges, isLoading: userBadgesLoading } = useUserBadges(user?.id);

  const isLoading = badgesLoading || userBadgesLoading;

  const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
  const earnedBadgeMap = new Map(userBadges?.map(ub => [ub.badge_id, ub.earned_at]) || []);

  // Group badges by category
  const badgesByCategory = allBadges?.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, typeof allBadges>) || {};

  const categories = Object.keys(badgesByCategory);
  const earnedCount = userBadges?.length || 0;
  const totalCount = allBadges?.length || 0;

  if (isLoading) {
    return (
      <Card className={cn('glass-card', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Award className="h-5 w-5 text-primary" />
            Achievement Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!showAll) {
    // Compact view - just show earned badges
    const recentBadges = userBadges?.slice(0, 8) || [];

    return (
      <Card className={cn('glass-card', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Award className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
            Badges Earned
          </CardTitle>
          <CardDescription>
            {earnedCount} of {totalCount} badges unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBadges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Complete lessons and activities to earn badges!
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {recentBadges.map((userBadge) => (
                <BadgeCard
                  key={userBadge.id}
                  badge={userBadge.badge!}
                  earned
                  earnedAt={userBadge.earned_at}
                  size="md"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view with tabs
  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Award className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
          All Achievements
        </CardTitle>
        <CardDescription>
          {earnedCount} of {totalCount} badges unlocked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-4">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {categoryLabels[category] || category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {badgesByCategory[category]?.map((badge) => (
                  <div
                    key={badge.id}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg transition-all',
                      earnedBadgeIds.has(badge.id)
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted/30 border border-muted/50 opacity-60'
                    )}
                  >
                    <BadgeCard
                      badge={badge}
                      earned={earnedBadgeIds.has(badge.id)}
                      earnedAt={earnedBadgeMap.get(badge.id)}
                      size="lg"
                      showTooltip={false}
                    />
                    <div className="text-center">
                      <p className="font-medium text-sm">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                      {badge.xp_reward > 0 && (
                        <p className="text-xs text-secondary mt-1">+{badge.xp_reward} XP</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
