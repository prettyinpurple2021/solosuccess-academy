/**
 * @file PurchaseGuard.tsx — Route-Level Purchase Verification
 * 
 * PURPOSE: Wraps course learning routes to verify the user has purchased
 * the course before rendering child content. Eliminates the need for
 * each page to individually check purchase status.
 * 
 * USAGE: Wrap course routes in App.tsx:
 *   <Route element={<PurchaseGuard />}>
 *     <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonViewer />} />
 *   </Route>
 */
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useHasPurchasedCourse } from '@/hooks/useCourses';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export function PurchaseGuard() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { data: hasPurchased, isLoading } = useHasPurchasedCourse(user?.id, courseId);

  // Show loading while verifying purchase
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  // Redirect to course detail if not purchased
  if (!hasPurchased) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="glass-card p-8 text-center max-w-md mx-4">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2 neon-text">Course Not Purchased</h1>
          <p className="text-muted-foreground mb-6">You need to purchase this course to access this content.</p>
          <Button asChild variant="neon">
            <Link to={`/courses/${courseId}`}>View Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
