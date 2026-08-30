import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from '@/lib/router-compat';

/* ──────────────────────────────────────────────────────────────
 * Local user preferences (per-device)
 *   realtime_toast        — show in-app toast on new notification
 *   realtime_sound        — play soft cyber chime
 *   realtime_browser_push — show OS-level notification when tab hidden
 * ────────────────────────────────────────────────────────────── */
const PREF_KEYS = {
  toast: 'notif:realtime_toast',
  sound: 'notif:realtime_sound',
  push: 'notif:realtime_browser_push',
} as const;

function getPref(key: string, fallback = true): boolean {
  if (typeof window === 'undefined') return fallback;
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === '1';
}

/** Synthesize a short two-note "ping" via Web Audio — no asset needed. */
function playChime() {
  try {
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [
      { freq: 880, start: 0, dur: 0.12 },
      { freq: 1320, start: 0.08, dur: 0.18 },
    ].forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    /* noop */
  }
}

/** Show a native browser notification if granted + tab is hidden. */
function showBrowserNotification(n: Notification) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return; // avoid double-noise
  try {
    const notif = new window.Notification(n.title, {
      body: n.message,
      icon: '/favicon.ico',
      tag: n.id,
    });
    notif.onclick = () => {
      window.focus();
      if (n.link) window.location.href = n.link;
      notif.close();
    };
  } catch {
    /* noop */
  }
}

/** Public helpers so Settings UI can read/write prefs. */
export const notificationPrefs = {
  keys: PREF_KEYS,
  get: getPref,
  set(key: string, value: boolean) {
    localStorage.setItem(key, value ? '1' : '0');
  },
  async requestPushPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window))
      return 'denied';
    if (window.Notification.permission === 'granted') return 'granted';
    if (window.Notification.permission === 'denied') return 'denied';
    return await window.Notification.requestPermission();
  },
};

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data as Notification[]) || [];
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      // Unique topic per mount: reusing a name after removeChannel() can return the
      // still-subscribed instance, which throws when .on() is called afterwards.
      .channel(`notifications-realtime-${user.id}-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          queryClient.setQueryData<Notification[]>(
            ['notifications', user.id],
            (old) => {
              return old ? [newNotification, ...old] : [newNotification];
            }
          );

          // 1) In-app toast (foreground)
          if (getPref(PREF_KEYS.toast)) {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              onClick: newNotification.link
                ? () => navigate(newNotification.link!)
                : undefined,
            } as any);
          }

          // 2) Soft chime
          if (getPref(PREF_KEYS.sound)) playChime();

          // 3) Native browser push (background tab)
          if (getPref(PREF_KEYS.push)) showBrowserNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, toast, navigate]);

  return query;
}

export function useUnreadCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter((n) => !n.read_at).length || 0;
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });
}
