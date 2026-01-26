import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { Footer } from './Footer';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <PublicHeader />
      <main className="flex-1 relative">
        <div className="cyber-grid" />
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
