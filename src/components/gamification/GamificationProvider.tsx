/**
 * @file GamificationProvider.tsx — Central Gamification Context
 *
 * Wraps the app in a React Context that provides:
 *   1. awardXP(action, bonusXP?) — awards XP atomically via DB function
 *   2. checkAndAwardBadges() — evaluates badge criteria and shows unlock toasts
 *
 * XP VALUES:
 * - Loaded from the `xp_config` database table (admin-tunable)
 * - Falls back to hardcoded defaults while loading
 *
 * LEVEL SYSTEM: Level = floor(totalXP / 500) + 1
 *
 * DEBOUNCING:
 * - Rapid XP awards within 2 seconds are coalesced into a single call
 *   to prevent double-awarding from fast clicks
 */
import { createContext, useContext, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useAwardXP, 
  useCheckBadges, 
  useUserGamification,
  useXPConfig,
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

/** Debounce window: ignore duplicate awards within 2 seconds */
const DEBOUNCE_MS = 2000;

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: gamification } = useUserGamification(user?.id);
  const { data: achievements } = useProfileAchievements(user?.id);
  const { data: xpConfig } = useXPConfig();
  const awardXPMutation = useAwardXP();
  const checkBadgesMutation = useCheckBadges();
  const { showXP, showBadge, NotificationContainer } = useXPNotification();

  // Debounce tracking: stores last award time per action
  const lastAwardRef = useRef<Record<string, number>>({});

  const totalXP = gamification?.total_xp || 0;
  const currentStreak = gamification?.current_streak || 0;
  const level = Math.floor(totalXP / 500) + 1;

  const awardXP = useCallback(async (action: keyof typeof XP_VALUES, bonusXP = 0) => {
    if (!user?.id) return;

    // Debounce: skip if same action was awarded within 2 seconds
    const now = Date.now();
    const lastTime = lastAwardRef.current[action] || 0;
    if (now - lastTime < DEBOUNCE_MS) return;
    lastAwardRef.current[action] = now;

    // Use DB-configured XP values when available, fall back to defaults
    const configuredXP = xpConfig?.[action] ?? XP_VALUES[action];
    const xpAmount = configuredXP + bonusXP;

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
  }, [user?.id, xpConfig, awardXPMutation, showXP]);

  const checkAndAwardBadges = useCallback(async () => {
    if (!user?.id || !achievements || !gamification) return [];

    try {
      const newBadges = await checkBadgesMutation.mutateAsync({
        userId: user.id,
        stats: {
          lessonsCompleted: achievements.lessonsCompleted,
          coursesCompleted: achievements.coursesPurchased,
          streakDays: gamification.current_streak,
          totalXp: gamification.total_xp,
          discussionsStarted: achievements.discussionsStarted,
          commentsPosted: achievements.commentsPosted,
          projectsSubmitted: achievements.projectsSubmitted,
          projectsWithFeedback: achievements.projectsWithFeedback,
          chaptersRead: achievements.chaptersRead,
        },
      });

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
