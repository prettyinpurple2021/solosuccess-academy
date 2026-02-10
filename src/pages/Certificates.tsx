import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserCertificates } from '@/hooks/useCertificates';
import { useCourses } from '@/hooks/useCourses';
import { CertificateCard } from '@/components/certificates/CertificateCard';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { ErrorView } from '@/components/ui/error-view';
import { Award, BookOpen, ArrowRight } from 'lucide-react';

export default function Certificates() {
  const { user } = useAuth();
  const { data: certificates, isLoading, isError, error, refetch } = useUserCertificates(user?.id);
  const { data: courses } = useCourses();

  // Map course IDs to order numbers
  const courseOrderMap = new Map(
    courses?.map(c => [c.id, c.order_number]) || []
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8">
        <div className="container max-w-5xl">
          <ErrorView
            message={error?.message}
            onRetry={refetch}
            backTo="/dashboard"
            backLabel="Back to dashboard"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-6 w-6 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
            <h1 className="text-3xl font-display font-bold neon-text">Your Certificates</h1>
          </div>
          <p className="text-muted-foreground">
            Certificates earned from completing courses at SoloSuccess Academy
          </p>
        </div>

        {certificates && certificates.length > 0 ? (
          <>
            {/* Stats */}
            <Card className="glass-card border-primary/30 mb-8">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-[0_0_25px_hsl(var(--primary)/0.4)]">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-display font-bold text-gradient">
                        {certificates.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Certificate{certificates.length !== 1 ? 's' : ''} Earned
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild className="border-primary/30 hover:bg-primary/10">
                    <Link to="/courses">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Earn More
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Certificate Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {certificates.map((certificate) => (
                <CertificateCard 
                  key={certificate.id} 
                  certificate={certificate}
                  courseOrderNumber={courseOrderMap.get(certificate.course_id) || 1}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <Card className="glass-card border-dashed border-primary/30">
            <CardContent className="py-16 text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-primary/50" />
              </div>
              <CardTitle className="text-2xl font-display mb-3">No Certificates Yet</CardTitle>
              <CardDescription className="text-base mb-6 max-w-md mx-auto">
                Complete a course to earn your first certificate. Each course has a unique, 
                professionally designed certificate to showcase your achievement.
              </CardDescription>
              <Button variant="neon" asChild>
                <Link to="/courses">
                  Browse Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
