import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { AchievementsCard } from '@/components/profile/AchievementsCard';
import { ProgressRing } from '@/components/ui/progress-ring';
import { XPDisplay } from '@/components/gamification/XPDisplay';
import { StreakCard } from '@/components/gamification/StreakCard';
import { BadgesDisplay } from '@/components/gamification/BadgesDisplay';
import { CertificateCard } from '@/components/certificates/CertificateCard';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUserAchievements } from '@/hooks/useProfile';
import { useOverallProgress } from '@/hooks/useProgress';
import { useCourses } from '@/hooks/useCourses';
import { useUserCertificates } from '@/hooks/useCertificates';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { TrendingUp, BookOpen, Award, ArrowRight } from 'lucide-react';
import { TestimonialForm } from '@/components/testimonials/TestimonialForm';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements(user?.id);
  const { data: overallProgress, isLoading: progressLoading } = useOverallProgress(user?.id);
  const { data: allCourses } = useCourses();
  const { data: certificates } = useUserCertificates(user?.id);
  const [params] = useSearchParams();
  const testimonialRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (params.get('testimonial') === '1' && testimonialRef.current) {
      testimonialRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [params]);

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

  // Get course titles for progress display
  const getCourseTitle = (courseId: string) => {
    return allCourses?.find(c => c.id === courseId)?.title || 'Course';
  };

  // Map course IDs to order numbers for certificates
  const courseOrderMap = new Map(
    allCourses?.map(c => [c.id, c.order_number]) || []
  );

  return (
    <div className="py-8">
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-display font-bold mb-8 neon-text">Your Profile</h1>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <div className="space-y-6">
            <Card className="glass-card border-primary/30 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] transition-all duration-300">
              <CardContent className="pt-6">
                <AvatarUpload
                  userId={user!.id}
                  currentAvatarUrl={profile.avatar_url}
                  displayName={profile.display_name}
                />
              </CardContent>
            </Card>

            {/* XP & Level Display */}
            <XPDisplay />

            {/* Streak Card */}
            <StreakCard />

            {/* Overall Progress Ring */}
            <Card className="glass-card border-secondary/30 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.2)] transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 font-display">
                  <TrendingUp className="h-5 w-5 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary)/0.5)]" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-4">
                {progressLoading ? (
                  <NeonSpinner size="md" />
                ) : (
                  <>
                    <ProgressRing 
                      progress={overallProgress?.percentage || 0} 
                      size="lg"
                      label={`${overallProgress?.completedLessons || 0}/${overallProgress?.totalLessons || 0}`}
                      sublabel="lessons"
                    />
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      Across {achievements?.coursesPurchased || 0} enrolled courses
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <ProfileForm profile={profile} />
        </div>

        {/* Course Progress Section */}
        {overallProgress?.courseProgress && overallProgress.courseProgress.length > 0 && (
          <Card className="mt-8 glass-card border-accent/30 hover:border-accent/50 hover:shadow-[0_0_30px_hsl(var(--accent)/0.15)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <BookOpen className="h-5 w-5 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.5)]" />
                Course Progress
              </CardTitle>
              <CardDescription>Your progress in each enrolled course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {overallProgress.courseProgress.map((course) => (
                  <div 
                    key={course.courseId}
                    className="flex items-center gap-4 p-4 rounded-lg bg-black/30 border border-accent/20 hover:border-accent/40 transition-all"
                  >
                    <ProgressRing 
                      progress={course.percentage} 
                      size="sm"
                      showPercentage={true}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{getCourseTitle(course.courseId)}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.completed}/{course.total} lessons
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates Section */}
        {certificates && certificates.length > 0 && (
          <Card className="mt-8 glass-card border-accent/30 hover:border-accent/50 hover:shadow-[0_0_30px_hsl(var(--accent)/0.15)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Award className="h-5 w-5 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.5)]" />
                    Your Certificates
                  </CardTitle>
                  <CardDescription>Certificates earned from completing courses</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild className="border-accent/30 hover:bg-accent/10">
                  <Link to="/certificates">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certificates.slice(0, 3).map((certificate) => (
                  <CertificateCard 
                    key={certificate.id} 
                    certificate={certificate}
                    courseOrderNumber={courseOrderMap.get(certificate.course_id) || 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badges Display */}
        <div className="mt-8">
          <BadgesDisplay showAll />
        </div>

        <div className="mt-8">
          <AchievementsCard 
            achievements={achievements} 
            isLoading={achievementsLoading} 
          />
        </div>

        <div className="mt-8" ref={testimonialRef}>
          <TestimonialForm defaultName={profile?.display_name ?? undefined} />
        </div>
      </div>
    </div>
  );
}
