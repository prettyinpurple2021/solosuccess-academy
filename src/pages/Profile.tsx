import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { AchievementsCard } from '@/components/profile/AchievementsCard';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUserAchievements } from '@/hooks/useProfile';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(user?.id);

  const isLoading = authLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center glass-card p-8 rounded-lg">
          <h1 className="text-2xl font-display font-bold mb-4 neon-text">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">There was an issue loading your profile.</p>
          <Button variant="neon" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-display font-bold mb-8 neon-text">Your Profile</h1>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <Card className="glass-card border-primary/30 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] transition-all duration-300">
            <CardContent className="pt-6">
              <AvatarUpload
                userId={user!.id}
                currentAvatarUrl={profile.avatar_url}
                displayName={profile.display_name}
              />
            </CardContent>
          </Card>

          <ProfileForm profile={profile} />
        </div>

        <div className="mt-8">
          <AchievementsCard 
            achievements={achievements} 
            isLoading={achievementsLoading} 
          />
        </div>
      </div>
    </div>
  );
}
