import { Link } from 'react-router-dom';
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

export function PublicHeader() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full header-glass">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-accent to-secondary text-primary-foreground font-bold text-lg overflow-hidden shadow-[0_0_20px_hsl(270_80%_50%/0.5)] group-hover:shadow-[0_0_30px_hsl(270_80%_50%/0.7)] transition-all duration-300">
            <Zap className="h-5 w-5 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-100 group-hover:animate-pulse" />
          </div>
          <span className="font-display font-bold text-xl tracking-wider hidden sm:block">
            <span className="text-gradient">SOLO</span>
            <span className="text-foreground">SUCCESS</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(270_80%_60%/0.5)]"
          >
            Home
          </Link>
          <Link 
            to="/courses" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(270_80%_60%/0.5)]"
          >
            Courses
          </Link>
          <a 
            href="#features" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(270_80%_60%/0.5)]"
          >
            Features
          </a>
          <a 
            href="#pricing" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(270_80%_60%/0.5)]"
          >
            Pricing
          </a>
          <Link 
            to="/about" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(270_80%_60%/0.5)]"
          >
            About
          </Link>
          <Link 
            to="/help" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(270_80%_60%/0.5)]"
          >
            Help
          </Link>
        </nav>

        {/* Auth Section */}
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
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-primary" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{theme === 'dark' ? 'Switch to Pastel Goth' : 'Switch to Cyberpunk'}</p>
            </TooltipContent>
          </Tooltip>
          {!isLoading && isAuthenticated ? (
            <Button variant="neon" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : !isLoading ? (
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="neon" asChild>
                <Link to="/auth?mode=signup">Get Started</Link>
              </Button>
            </div>
          ) : null}
          
          {/* Mobile menu button */}
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

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-primary/20 transition-all duration-300",
        mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}>
        <nav className="container py-4 flex flex-col gap-4">
          <Link 
            to="/" 
            className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/courses" 
            className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Courses
          </Link>
          <Link 
            to="/about" 
            className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link 
            to="/help" 
            className="text-sm font-medium text-muted-foreground hover:text-primary py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Help
          </Link>
          {!isAuthenticated && (
            <div className="flex flex-col gap-2 pt-4 border-t border-primary/20">
              <Button variant="ghost" asChild className="justify-start">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              </Button>
              <Button variant="neon" asChild>
                <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
