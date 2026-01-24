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
import { Lock, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(user?.id);

  const isLoading = authLoading || profileLoading;

  // Auth check
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
            <Button asChild>
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  // Profile not found (shouldn't happen normally)
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
            <p className="text-muted-foreground mb-4">There was an issue loading your profile.</p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Avatar section */}
            <Card>
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
