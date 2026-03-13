/**
 * @file Header.tsx — Cyberpunk Command Bar (Authenticated Pages)
 * 
 * Same glassmorphism + neon cyber styling as PublicHeader,
 * but includes authenticated features: search, XP display,
 * notifications, user dropdown, and admin link.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, BookOpen, LayoutDashboard, Settings, Shield, Zap, Search, Sun, Moon } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { XPDisplay } from '@/components/gamification/XPDisplay';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Header() {
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

  // Ctrl+K / Cmd+K keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string | null | undefined, email: string | undefined) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full header-glass">
        <div className="container flex h-16 items-center justify-between">
          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-accent to-secondary text-primary-foreground font-bold text-lg overflow-hidden shadow-[0_0_20px_hsl(270_80%_50%/0.5)] group-hover:shadow-[0_0_30px_hsl(185_100%_55%/0.7)] transition-all duration-300">
              <Zap className="h-5 w-5 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-100 group-hover:animate-pulse" />
            </div>
            <span className="font-display font-extrabold text-base tracking-[0.15em] hidden sm:block" style={{ textShadow: '0 0 12px hsl(185 100% 50% / 0.5)' }}>
              <span className="text-gradient">SOLO</span>
              <span className="text-foreground">SUCCESS</span>
              <span className="text-muted-foreground text-[0.65rem] tracking-[0.2em] ml-1.5">ACADEMY</span>
            </span>
          </Link>

          {/* ── Desktop Nav — cyber styled ── */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              to="/courses"
              className={cn(
                'nav-link-cyber font-heading',
                location.pathname === '/courses' && 'active'
              )}
            >
              Courses
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={cn(
                  'nav-link-cyber font-heading',
                  location.pathname === '/dashboard' && 'active'
                )}
              >
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  'nav-link-cyber font-heading',
                  location.pathname.startsWith('/admin') && 'active'
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* ── Right side: controls ── */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-9 w-9 hover:bg-primary/10"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-warning" />
                  ) : (
                    <Moon className="h-4 w-4 text-primary" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{theme === 'dark' ? 'Switch to Pastel Goth' : 'Switch to Cyberpunk'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Global Search Button */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-secondary border border-secondary/20 hover:border-secondary/40 px-3 h-9 font-heading tracking-wider text-xs uppercase"
                title="Search (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
                <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-muted-foreground/30 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
            )}

            {isAuthenticated && (
              <>
                <XPDisplay compact className="hidden sm:flex" />
                <NotificationBell />
              </>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-secondary/40 shadow-[0_0_15px_hsl(185_100%_50%/0.3)]">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
                      <AvatarFallback className="bg-primary/20 text-primary font-display">
                        {getInitials(profile?.display_name, user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass-card border-secondary/20" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium font-heading">{profile?.display_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-secondary/20" />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer font-heading tracking-wider text-xs uppercase">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/courses" className="cursor-pointer font-heading tracking-wider text-xs uppercase">
                      <BookOpen className="mr-2 h-4 w-4" />
                      My Courses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer font-heading tracking-wider text-xs uppercase">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer font-heading tracking-wider text-xs uppercase">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator className="bg-secondary/20" />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-secondary font-heading tracking-wider text-xs uppercase">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-secondary/20" />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive font-heading tracking-wider text-xs uppercase">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" asChild className="font-heading tracking-[0.1em] text-xs uppercase">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="neon" asChild className="btn-cyber-chamfer">
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
