/**
 * @file PublicLayout.tsx — Public (Unauthenticated) Page Shell
 * 
 * Wraps public-facing pages that don't require login:
 * - Landing page (/)
 * - Auth page (/auth)
 * - Course catalog (/courses)
 * - Course detail (/courses/:id)
 * 
 * Structure: PublicHeader → main content → Footer
 * 
 * The `cyber-bg` and `cyber-grid` classes apply the cyberpunk-themed
 * background gradient and grid overlay (defined in index.css).
 */
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      {/* Public navigation header — logo + auth buttons */}
      <PublicHeader />
      
      {/* Main content area — id="main-content" is the target for SkipLink accessibility */}
      <main id="main-content" tabIndex={-1} className="flex-1 relative">
        <div className="cyber-grid" />
        {/* <Outlet /> renders whichever child route matches the current URL */}
        <Outlet />
      </main>
      
      {/* Site footer with links and copyright */}
      <Footer />
    </div>
  );
}
