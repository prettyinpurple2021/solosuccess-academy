import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useAwardXP, 
  useCheckBadges, 
  useUserGamification,
  XP_VALUES,
  AchievementBadge,
} from '@/hooks/useGamification';
import { useUserAchievements as useProfileAchievements } from '@/hooks/useProfile';
import { useXPNotification } from './XPNotification';

interface GamificationContextType {
  awardXP: (action: keyof typeof XP_VALUES, bonusXP?: number) => Promise<void>;
  checkAndAwardBadges: () => Promise<AchievementBadge[]>;
  totalXP: number;
  currentStreak: number;
  level: number;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: gamification } = useUserGamification(user?.id);
  const { data: achievements } = useProfileAchievements(user?.id);
  const awardXPMutation = useAwardXP();
  const checkBadgesMutation = useCheckBadges();
  const { showXP, showBadge, NotificationContainer } = useXPNotification();

  const totalXP = gamification?.total_xp || 0;
  const currentStreak = gamification?.current_streak || 0;
  const level = Math.floor(totalXP / 500) + 1;

  const awardXP = useCallback(async (action: keyof typeof XP_VALUES, bonusXP = 0) => {
    if (!user?.id) return;

    const xpAmount = XP_VALUES[action] + bonusXP;

    try {
      await awardXPMutation.mutateAsync({
        userId: user.id,
        xpAmount,
        action,
      });

      showXP(xpAmount);
    } catch (error) {
      console.error('Failed to award XP:', error);
    }
  }, [user?.id, awardXPMutation, showXP]);

  const checkAndAwardBadges = useCallback(async () => {
    if (!user?.id || !achievements || !gamification) return [];

    try {
      const newBadges = await checkBadgesMutation.mutateAsync({
        userId: user.id,
        stats: {
          lessonsCompleted: achievements.lessonsCompleted,
          coursesCompleted: achievements.coursesPurchased, // Using purchased as proxy
          streakDays: gamification.current_streak,
          totalXp: gamification.total_xp,
          discussionsStarted: achievements.discussionsStarted,
          commentsPosted: achievements.commentsPosted,
          projectsSubmitted: achievements.projectsSubmitted,
          projectsWithFeedback: achievements.projectsWithFeedback,
        },
      });

      // Show notifications for each new badge
      for (const badge of newBadges) {
        setTimeout(() => showBadge(badge), 500);
      }

      return newBadges;
    } catch (error) {
      console.error('Failed to check badges:', error);
      return [];
    }
  }, [user?.id, achievements, gamification, checkBadgesMutation, showBadge]);

  return (
    <GamificationContext.Provider
      value={{
        awardXP,
        checkAndAwardBadges,
        totalXP,
        currentStreak,
        level,
      }}
    >
      {children}
      <NotificationContainer />
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
