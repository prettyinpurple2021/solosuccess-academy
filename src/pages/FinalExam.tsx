/**
 * FinalExam Page – Student-facing page where enrolled students can take
 * the final exam for a purchased course.
 *
 * Route: /courses/:courseId/final-exam
 * Requirements: User must be authenticated and have purchased the course.
 */
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useFinalExam } from '@/hooks/useFinalExam';
import { useLatestExamAttempt } from '@/hooks/useExamAttempt';
import { FinalExamPlayer } from '@/components/exam/FinalExamPlayer';
import { QueryStateGuard } from '@/components/ui/query-state-guard';
import { PageMeta } from '@/components/layout/PageMeta';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FinalExam() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data fetching
  const courseQuery = useCourse(courseId);
  const purchaseQuery = useHasPurchasedCourse(user?.id, courseId);
  const examQuery = useFinalExam(courseId);
  const attemptQuery = useLatestExamAttempt(examQuery.data?.id, user?.id);

  const course = courseQuery.data;
  const hasPurchased = purchaseQuery.data;
  const exam = examQuery.data;

  return (
    <div className="container py-6 max-w-4xl">
      <PageMeta
        title={exam ? exam.title : 'Final Exam'}
        description="Take the final exam for this course"
        path={`/courses/${courseId}/final-exam`}
      />

      {/* Breadcrumb */}
      {course && (
        <div className="mb-6">
          <CourseBreadcrumb
            segments={[
              { label: 'Courses', href: '/courses' },
              { label: course.title, href: `/courses/${course.id}` },
              { label: 'Final Exam' },
            ]}
          />
        </div>
      )}

      <QueryStateGuard
        isLoading={courseQuery.isLoading || examQuery.isLoading || attemptQuery.isLoading}
        isError={courseQuery.isError || examQuery.isError}
        error={courseQuery.error ?? examQuery.error ?? null}
        refetch={() => { courseQuery.refetch(); examQuery.refetch(); }}
        loadingMessage="Loading exam..."
        backTo={`/courses/${courseId}`}
        backLabel="Back to course"
      >
        {/* Gate: must have purchased */}
        {!hasPurchased ? (
          <div className="text-center py-16 space-y-4">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-muted-foreground">You must purchase this course to take the final exam.</p>
            <Button asChild variant="neon">
              <Link to={`/courses/${courseId}`}>View Course</Link>
            </Button>
          </div>
        ) : !exam ? (
          <div className="text-center py-16 space-y-4">
            <h2 className="text-xl font-semibold">No Exam Available</h2>
            <p className="text-muted-foreground">
              The instructor hasn't created a final exam for this course yet.
            </p>
            <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
            </Button>
          </div>
        ) : (
          <FinalExamPlayer
            exam={exam}
            userId={user!.id}
            previousAttempt={attemptQuery.data}
            onBack={() => navigate(`/courses/${courseId}`)}
          />
        )}
      </QueryStateGuard>
    </div>
  );
}
