import { Link, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  BookOpen, 
  User, 
  Settings, 
  Shield, 
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Award,
  Trophy,
  Sparkles,
  FileText,
  ScrollText,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Courses', url: '/courses', icon: BookOpen },
  { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
  { title: 'Certificates', url: '/certificates', icon: Award },
  { title: 'Transcript', url: '/transcript', icon: ScrollText },
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Help', url: '/help', icon: HelpCircle },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { user, profile, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin(user?.id);
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const getInitials = (name: string | null | undefined, email: string | undefined) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar 
      className={cn(
        "border-r border-primary/20 bg-background/80 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      {/* Header with logo */}
      <SidebarHeader className="border-b border-primary/20 p-4">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-accent to-secondary text-primary-foreground font-bold overflow-hidden shadow-[0_0_20px_hsl(270_80%_50%/0.5)] flex-shrink-0">
            <Zap className="h-5 w-5 relative z-10" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg tracking-wider whitespace-nowrap">
              <span className="text-gradient">SOLO</span>
              <span className="text-foreground">SUCCESS</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground font-mono tracking-wider px-4 mb-2">
              NAVIGATION
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url === '/courses' && location.pathname.startsWith('/courses'));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300",
                          "hover:bg-primary/10 hover:text-primary",
                          isActive && "bg-primary/20 text-primary shadow-[inset_0_0_20px_hsl(270_80%_60%/0.1)] border-l-2 border-primary"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "drop-shadow-[0_0_8px_hsl(270_80%_60%/0.5)]")} />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup className="mt-4">
            {!collapsed && (
              <SidebarGroupLabel className="text-xs text-primary font-mono tracking-wider px-4 mb-2">
                ADMIN
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin"
                      end
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300",
                        "hover:bg-primary/10 hover:text-primary",
                        location.pathname === '/admin' && "bg-primary/20 text-primary shadow-[inset_0_0_20px_hsl(270_80%_60%/0.1)] border-l-2 border-primary"
                      )}
                    >
                      <Shield className="h-5 w-5 flex-shrink-0 text-primary drop-shadow-[0_0_6px_hsl(270_80%_60%/0.5)]" />
                      {!collapsed && <span className="font-medium">Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin/gradebook"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300",
                        "hover:bg-primary/10 hover:text-primary",
                        location.pathname === '/admin/gradebook' && "bg-primary/20 text-primary shadow-[inset_0_0_20px_hsl(270_80%_60%/0.1)] border-l-2 border-primary"
                      )}
                    >
                      <GraduationCap className="h-5 w-5 flex-shrink-0 text-info drop-shadow-[0_0_6px_hsl(var(--info)/0.5)]" />
                      {!collapsed && <span className="font-medium">Gradebook</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin/exam-essay"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300",
                        "hover:bg-primary/10 hover:text-primary",
                        location.pathname === '/admin/exam-essay' && "bg-primary/20 text-primary shadow-[inset_0_0_20px_hsl(270_80%_60%/0.1)] border-l-2 border-primary"
                      )}
                    >
                      <FileText className="h-5 w-5 flex-shrink-0 text-secondary drop-shadow-[0_0_6px_hsl(var(--secondary)/0.5)]" />
                      {!collapsed && <span className="font-medium">Exams & Essays</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to="/admin/ai-settings"
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300",
                        "hover:bg-primary/10 hover:text-primary",
                        location.pathname === '/admin/ai-settings' && "bg-primary/20 text-primary shadow-[inset_0_0_20px_hsl(270_80%_60%/0.1)] border-l-2 border-primary"
                      )}
                    >
                      <Sparkles className="h-5 w-5 flex-shrink-0 text-accent drop-shadow-[0_0_6px_hsl(var(--accent)/0.5)]" />
                      {!collapsed && <span className="font-medium">AI Settings</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer with user info */}
      <SidebarFooter className="border-t border-primary/20 p-4">
        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full mb-3 justify-center hover:bg-primary/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>

        {/* User info */}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 border-2 border-primary/40 shadow-[0_0_10px_hsl(270_80%_50%/0.3)] flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || 'User'} />
            <AvatarFallback className="bg-primary/20 text-primary font-display text-sm">
              {getInitials(profile?.display_name, user?.email)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>

        {/* Sign out button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className={cn(
            "w-full mt-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
