/**
 * @file PublicHeader.tsx — Cyberpunk Command Bar (Public Pages)
 * 
 * Premium glassmorphism nav with:
 * - Dark tinted glass background + neon cyan border glow
 * - Rajdhani uppercase wide-tracked nav links
 * - Slide-up neon underline on hover
 * - Active link neon pulse effect
 * - Chamfered cyber buttons
 * - Theme toggle (Cyberpunk ↔ Pastel Goth)
 */
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/* Route-based links (use react-router Link) */
const routeLinks = [
  { to: '/', label: 'Home' },
  { to: '/courses', label: 'Courses' },
  { to: '/about', label: 'About' },
  { to: '/help', label: 'Help' },
];

/* Anchor links (use native <a>) */
const anchorLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
];

export function PublicHeader() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
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

        {/* ── Desktop Nav — Rajdhani uppercase cyber links ── */}
        <nav className="hidden md:flex items-center gap-8">
          {routeLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'nav-link-cyber font-heading',
                location.pathname === item.to && 'active'
              )}
            >
              {item.label}
            </Link>
          ))}
          {anchorLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="nav-link-cyber font-heading"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ── Right side: theme toggle + auth ── */}
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

          {/* Auth buttons */}
          {!isLoading && isAuthenticated ? (
            <Button variant="neon" asChild className="btn-cyber-chamfer">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : !isLoading ? (
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild className="font-heading tracking-[0.1em] text-xs uppercase">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="neon" asChild className="btn-cyber-chamfer">
                <Link to="/auth?mode=signup">Get Started</Link>
              </Button>
            </div>
          ) : null}
          
          {/* Mobile menu toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div className={cn(
        "md:hidden absolute top-16 left-0 right-0 header-glass transition-all duration-300",
        mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}>
        <nav className="container py-4 flex flex-col gap-3">
          {routeLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'nav-link-cyber font-heading text-sm py-2',
                location.pathname === item.to && 'active'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="flex flex-col gap-2 pt-4 border-t border-secondary/20">
              <Button variant="ghost" asChild className="justify-start font-heading tracking-[0.1em] uppercase text-xs">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              </Button>
              <Button variant="neon" asChild className="btn-cyber-chamfer">
                <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
