/**
 * @file Footer.tsx — Site Footer
 * 
 * Displays platform links, resource links, legal links, social media,
 * and copyright notice. Used in PublicLayout for all public pages.
 */
import { Link } from 'react-router-dom';
import { Zap, Twitter, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative border-t border-primary/20 bg-background/95">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container relative py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 group mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_hsl(270_80%_50%/0.4)] group-hover:shadow-[0_0_30px_hsl(270_80%_50%/0.6)] transition-all">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg tracking-wider">
                <span className="text-gradient">SOLO</span>SUCCESS
              </span>
            </Link>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              AI-powered learning platform for solo founders building the future.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-sm tracking-wider text-primary">PLATFORM</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/courses" className="text-muted-foreground hover:text-primary transition-colors font-mono">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-mono">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors font-mono">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-sm tracking-wider text-secondary">RESOURCES</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/courses" className="text-muted-foreground hover:text-secondary transition-colors font-mono">
                  Course Catalog
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-muted-foreground hover:text-secondary transition-colors font-mono">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-secondary transition-colors font-mono">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-secondary transition-colors font-mono">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-secondary transition-colors font-mono">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-sm tracking-wider text-accent">LEGAL</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-accent transition-colors font-mono">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-accent transition-colors font-mono">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-muted-foreground hover:text-accent transition-colors font-mono">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/billing" className="text-muted-foreground hover:text-accent transition-colors font-mono">
                  Billing
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} SoloSuccess Academy. All rights reserved.
          </p>
          
            {/* Social links — only real, claimed accounts */}
          <div className="flex items-center gap-4">
            <a 
              href="https://x.com/SoloSuccessAcad"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on X (Twitter)"
              className="h-10 w-10 rounded-lg bg-muted/50 border border-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:shadow-[0_0_15px_hsl(270_80%_60%/0.3)] transition-all"
            >
              <Twitter className="h-4 w-4" />
            </a>
              <Link
                to="/contact"
                aria-label="Contact us"
                className="h-10 w-10 rounded-lg bg-muted/50 border border-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:shadow-[0_0_15px_hsl(270_80%_60%/0.3)] transition-all"
              >
                <Mail className="h-4 w-4" />
              </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
