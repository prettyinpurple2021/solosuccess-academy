/**
 * @file StreakCard.tsx — Learning Streak Tracker Card
 *
 * PURPOSE: Displays the student's current daily learning streak with a
 * 7-day activity calendar, longest streak record, and motivational messages.
 *
 * STREAK LOGIC:
 * - Streak is tracked via last_activity_date in user_gamification table
 * - The weekly visual uses last_activity_date to approximate active days
 *   (simplified — doesn't track individual day history)
 *
 * PRODUCTION TODO:
 * - Store per-day activity history for accurate weekly calendar
 * - Add streak recovery (e.g., "freeze" mechanic for premium users)
 * - Animate streak count changes
 */
import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { useUserGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface StreakCardProps {
  className?: string;
}

export function StreakCard({ className }: StreakCardProps) {
  const { user } = useAuth();
  const { data: gamification } = useUserGamification(user?.id);
  const queryClient = useQueryClient();

  // Last 7 days of activity — accurate per-day history from user_activity_days
  const { data: activityDays } = useQuery({
    queryKey: ['user-activity-days-7d', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const sevenAgo = new Date();
      sevenAgo.setDate(sevenAgo.getDate() - 6);
      const from = sevenAgo.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_activity_days')
        .select('activity_date')
        .eq('user_id', user!.id)
        .gte('activity_date', from);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.activity_date as string));
    },
  });

  // Realtime: invalidate when this user's gamification/activity rows change
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`streak-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_gamification', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['user-gamification', user.id] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_activity_days', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['user-activity-days-7d', user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const currentStreak = gamification?.current_streak || 0;
  const longestStreak = gamification?.longest_streak || 0;

  // Check if streak is active today
  const today = new Date().toISOString().split('T')[0];
  const isActiveToday = activityDays?.has(today) ?? false;

  // Generate last 7 days for visual
  const last7Days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      }),
    [],
  );

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Flame className={cn(
            'h-5 w-5',
            currentStreak > 0 
              ? 'text-orange-500 drop-shadow-[0_0_8px_hsl(25_95%_53%/0.5)]' 
              : 'text-muted-foreground'
          )} />
          Learning Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Streak Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-3 rounded-xl',
              currentStreak > 0 
                ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                : 'bg-muted'
            )}>
              <Flame className={cn(
                'h-8 w-8',
                currentStreak > 0 ? 'text-white animate-pulse' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <p className={cn(
                'text-3xl font-bold font-display',
                currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
              )}>
                {currentStreak}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Best: {longestStreak}</span>
            </div>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>This Week</span>
          </div>
          <div className="flex gap-1.5 justify-between">
            {last7Days.map((date, i) => {
              const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
              const isToday = date === today;
              const wasActive = activityDays?.has(date) ?? false;
              
              return (
                <div key={date} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                      isToday && isActiveToday
                        ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30'
                        : wasActive
                          ? 'bg-orange-500/30 border border-orange-500/50'
                          : 'bg-muted/50 border border-muted-foreground/20'
                    )}
                  >
                    {(isToday && isActiveToday) || wasActive ? (
                      <Flame className={cn(
                        'h-4 w-4',
                        isToday && isActiveToday ? 'text-white' : 'text-orange-500'
                      )} />
                    ) : null}
                  </div>
                  <span className={cn(
                    'text-xs',
                    isToday ? 'font-bold text-foreground' : 'text-muted-foreground'
                  )}>
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational Message */}
        <div className="text-center text-sm text-muted-foreground pt-2 border-t border-muted/50">
          {!isActiveToday && currentStreak > 0 ? (
            <p className="text-orange-500">
              🔥 Complete a lesson today to keep your streak!
            </p>
          ) : currentStreak === 0 ? (
            <p>Start learning today to build your streak!</p>
          ) : (
            <p className="text-green-500">
              ✓ You've learned today! Keep it up!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
