/**
 * @file Notifications.tsx — Full-Page Notification Manager
 * 
 * Protected route showing all notifications with filtering and bulk actions.
 * Reuses existing notification hooks from useNotifications.ts.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageMeta } from '@/components/layout/PageMeta';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  Notification,
} from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

/* ── Notification type → emoji map ───────── */
const typeIcons: Record<string, string> = {
  grade_review: '📊',
  progress_reminder: '⏰',
  course_update: '📚',
  announcement: '📢',
  comment_reply: '💬',
  project_feedback: '✨',
};

/* ── Single notification row ─────────────── */
function NotificationRow({ notification }: { notification: Notification }) {
  const navigate = useNavigate();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();
  const isUnread = !notification.read_at;

  const handleClick = () => {
    if (isUnread) markAsRead.mutate(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'group relative flex items-start gap-4 p-4 cursor-pointer transition-all border-primary/10',
        'hover:bg-primary/5 hover:border-primary/20',
        isUnread && 'bg-primary/5 border-primary/20'
      )}
    >
      {/* Unread dot */}
      {isUnread && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
      )}

      {/* Icon */}
      <span className="text-2xl flex-shrink-0 mt-0.5 ml-2">
        {typeIcons[notification.type] || '🔔'}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={cn('text-sm font-medium', isUnread && 'text-foreground')}>
            {notification.title}
          </p>
          {isUnread && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
              New
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isUnread && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Mark as read"
            onClick={(e) => {
              e.stopPropagation();
              markAsRead.mutate(notification.id);
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            deleteNotification.mutate(notification.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

/* ── Page Component ──────────────────────── */
export default function Notifications() {
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = notifications?.filter((n) => {
    if (filter === 'unread') return !n.read_at;
    if (filter === 'read') return !!n.read_at;
    return true;
  });

  return (
    <>
      <PageMeta title="Notifications — SoloSuccess Academy" description="View and manage your notifications." />

      <div className="container max-w-3xl py-8 md:py-12 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.5)]">
                  {unreadCount} unread
                </Badge>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="font-mono text-xs">
              <Filter className="h-3 w-3 mr-1.5" />
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="font-mono text-xs">
              Unread
            </TabsTrigger>
            <TabsTrigger value="read" className="font-mono text-xs">
              Read
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notification list */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground animate-pulse">
            Loading notifications...
          </div>
        ) : !filtered?.length ? (
          <div className="text-center py-16">
            <Bell className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              You'll see updates here when there's activity on your courses.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
