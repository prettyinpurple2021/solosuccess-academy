import { useEffect, useState } from 'react';
import { Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AchievementBadge } from '@/hooks/useGamification';

interface XPNotificationProps {
  xp?: number;
  badge?: AchievementBadge;
  onComplete?: () => void;
}

export function XPNotification({ xp, badge, onComplete }: XPNotificationProps) {
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setAnimating(false);
    }, 2500);

    const removeTimer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none',
        'transition-all duration-500',
        animating 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4'
      )}
    >
      <div className={cn(
        'flex items-center gap-3 px-6 py-3 rounded-full',
        'bg-gradient-to-r shadow-2xl',
        badge 
          ? 'from-purple-600 to-pink-600 shadow-purple-500/30' 
          : 'from-primary to-secondary shadow-primary/30'
      )}>
        {badge ? (
          <>
            <Award className="h-6 w-6 text-white animate-bounce" />
            <div className="text-white">
              <p className="font-bold">Badge Unlocked!</p>
              <p className="text-sm opacity-90">{badge.name}</p>
            </div>
          </>
        ) : (
          <>
            <Zap className="h-6 w-6 text-white animate-pulse" />
            <span className="text-xl font-bold text-white">+{xp} XP</span>
          </>
        )}
      </div>
    </div>
  );
}

// Hook for managing XP notifications
export function useXPNotification() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    xp?: number;
    badge?: AchievementBadge;
  }>>([]);

  const showXP = (xp: number) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, xp }]);
  };

  const showBadge = (badge: AchievementBadge) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, badge }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NotificationContainer = () => (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ transform: `translateY(${index * 60}px)` }}
        >
          <XPNotification
            xp={notification.xp}
            badge={notification.badge}
            onComplete={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </>
  );

  return { showXP, showBadge, NotificationContainer };
}
