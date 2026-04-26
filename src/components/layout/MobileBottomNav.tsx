/**
 * @file MobileBottomNav.tsx — Persistent bottom tab bar (mobile only)
 *
 * Replaces the hamburger sidebar on screens < md. Five slots:
 *  Dashboard · Courses · Search · Profile · More
 *
 * "More" opens a sheet with the full sidebar items (Grades, Leaderboard,
 * Certificates, Transcript, Notifications, Settings, Help, Admin, Sign out).
 *
 * The bar respects safe-area-inset-bottom for iOS home-indicator devices.
 * Sticky with backdrop blur, follows the cyber/glass aesthetic.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Search,
  User,
  MoreHorizontal,
  GraduationCap,
  Trophy,
  Award,
  ScrollText,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  FileText,
  BarChart3,
  Wand2,
  Sparkles,
} from 'lucide-react';

interface TabConfig {
  label: string;
  icon: typeof LayoutDashboard;
  to?: string;
  match?: (pathname: string) => boolean;
}

const primaryTabs: TabConfig[] = [
  { label: 'Home', icon: LayoutDashboard, to: '/dashboard', match: (p) => p === '/dashboard' },
  { label: 'Courses', icon: BookOpen, to: '/courses', match: (p) => p.startsWith('/courses') },
];

const profileTab: TabConfig = {
  label: 'Profile',
  icon: User,
  to: '/profile',
  match: (p) => p.startsWith('/profile'),
};

const moreItems = [
  { label: 'My Grades', icon: GraduationCap, to: '/grades' },
  { label: 'Leaderboard', icon: Trophy, to: '/leaderboard' },
  { label: 'Certificates', icon: Award, to: '/certificates' },
  { label: 'Transcript', icon: ScrollText, to: '/transcript' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
  { label: 'Settings', icon: Settings, to: '/settings' },
  { label: 'Help', icon: HelpCircle, to: '/help' },
];

const adminItems = [
  { label: 'Admin Panel', icon: Shield, to: '/admin' },
  { label: 'Gradebook', icon: GraduationCap, to: '/admin/gradebook' },
  { label: 'Exams & Essays', icon: FileText, to: '/admin/exam-essay' },
  { label: 'Analytics', icon: BarChart3, to: '/admin/analytics' },
  { label: 'Content Generator', icon: Wand2, to: '/admin/content-generator' },
  { label: 'AI Settings', icon: Sparkles, to: '/admin/ai-settings' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    setMoreOpen(false);
    await signOut();
    navigate('/');
  };

  const renderTab = (tab: TabConfig, key: string) => {
    const isActive = tab.match?.(location.pathname) ?? false;
    const Icon = tab.icon;
    const content = (
      <>
        <Icon
          className={cn(
            'h-5 w-5 transition-colors',
            isActive
              ? 'text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]'
              : 'text-muted-foreground'
          )}
        />
        <span
          className={cn(
            'text-[10px] font-heading tracking-wider uppercase',
            isActive ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {tab.label}
        </span>
      </>
    );

    const baseClass =
      'flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1.5 min-h-[56px] rounded-md hover:bg-primary/5 active:bg-primary/10 transition-colors';

    if (tab.to) {
      return (
        <Link key={key} to={tab.to} className={baseClass} aria-current={isActive ? 'page' : undefined}>
          {content}
        </Link>
      );
    }
    return null;
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-[90]',
          'bg-background/85 backdrop-blur-xl border-t border-primary/20',
          'shadow-[0_-4px_20px_hsl(var(--primary)/0.1)]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch justify-around px-1 pt-1">
          {primaryTabs.map((t, i) => renderTab(t, `tab-${i}`))}

          {/* Search button — opens command palette */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1.5 min-h-[56px] rounded-md hover:bg-secondary/5 active:bg-secondary/10 transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground">
              Search
            </span>
          </button>

          {renderTab(profileTab, 'tab-profile')}

          {/* More — opens sheet with full nav */}
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1.5 min-h-[56px] rounded-md hover:bg-primary/5 active:bg-primary/10 transition-colors"
                aria-label="More navigation"
              >
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] font-heading tracking-wider uppercase text-muted-foreground">
                  More
                </span>
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-[85vw] max-w-sm bg-background/95 backdrop-blur-xl border-primary/20 overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle className="font-display tracking-wider">Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-1">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/15 text-primary border-l-2 border-primary'
                          : 'text-foreground hover:bg-primary/5'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="mt-6">
                  <p className="px-3 mb-2 text-[10px] font-mono tracking-wider text-primary uppercase">
                    Admin
                  </p>
                  <div className="space-y-1">
                    {adminItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                            isActive
                              ? 'bg-primary/15 text-primary border-l-2 border-primary'
                              : 'text-foreground hover:bg-primary/5'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
