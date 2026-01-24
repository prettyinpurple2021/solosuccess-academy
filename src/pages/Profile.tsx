import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { AchievementsCard } from '@/components/profile/AchievementsCard';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUserAchievements } from '@/hooks/useProfile';
import { Lock } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(user?.id);

  const isLoading = authLoading || profileLoading;

  // Auth check
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <div className="text-center glass-card p-8 rounded-lg relative z-10">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4 drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]" />
            <h1 className="text-2xl font-display font-bold mb-2 neon-text">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
            <Button variant="neon" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <NeonSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  // Profile not found (shouldn't happen normally)
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <div className="text-center glass-card p-8 rounded-lg relative z-10">
            <h1 className="text-2xl font-display font-bold mb-4 neon-text">Profile Not Found</h1>
            <p className="text-muted-foreground mb-4">There was an issue loading your profile.</p>
            <Button variant="neon" asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <Header />

      <main className="flex-1 py-8 relative">
        <div className="cyber-grid" />
        
        {/* Animated glow orbs */}
        <div className="absolute top-20 left-1/4 w-80 h-80 rounded-full blur-3xl animate-orb-glow-primary" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl animate-orb-glow-secondary" style={{ animationDelay: '1.5s' }} />
        
        <div className="container max-w-4xl relative z-10">
          <h1 className="text-3xl font-display font-bold mb-8 neon-text">Your Profile</h1>

          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Avatar section */}
            <Card className="glass-card border-primary/30 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] transition-all duration-300">
              <CardContent className="pt-6">
                <AvatarUpload
                  userId={user!.id}
                  currentAvatarUrl={profile.avatar_url}
                  displayName={profile.display_name}
                />
              </CardContent>
            </Card>

            {/* Profile form */}
            <ProfileForm profile={profile} />
          </div>

          {/* Achievements */}
          <div className="mt-8">
            <AchievementsCard 
              achievements={achievements} 
              isLoading={achievementsLoading} 
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
