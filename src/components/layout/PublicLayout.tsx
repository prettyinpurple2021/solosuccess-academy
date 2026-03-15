/**
 * @file PublicLayout.tsx — Public (Unauthenticated) Page Shell
 * 
 * Wraps public-facing pages with the cyberpunk background,
 * floating bokeh particles, grid overlay, header, and footer.
 */
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { Footer } from './Footer';
import { FloatingParticles } from '@/components/landing/FloatingParticles';
import { NebulaBackground } from '@/components/landing/NebulaBackground';
import { StarField } from '@/components/landing/StarField';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      {/* Deep-space nebula clouds — ambient color washes */}
      <NebulaBackground />

      {/* Twinkling star field for depth */}
      <StarField count={35} />

      {/* Floating bokeh / digital dust particles for 3D depth */}
      <FloatingParticles count={25} />

      {/* Public navigation header */}
      <PublicHeader />
      
      {/* Main content area */}
      <main id="main-content" tabIndex={-1} className="flex-1 relative">
        <div className="cyber-grid" />
        <Outlet />
      </main>
      
      {/* Site footer */}
      <Footer />
    </div>
  );
}
