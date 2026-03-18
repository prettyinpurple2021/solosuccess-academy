import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DiscussionList } from '@/components/discussion/DiscussionList';
import { CreateDiscussionForm } from '@/components/discussion/CreateDiscussionForm';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseDiscussions } from '@/hooks/useDiscussions';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Plus, MessageSquare } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function CourseDiscussions() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: discussionData, isLoading: discussionsLoading } = useCourseDiscussions(courseId);
  const discussions = discussionData?.discussions || [];

  const isLoading = authLoading || courseLoading || purchaseLoading;

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  // Purchase check
  if (!hasPurchased) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center glass-card p-8 rounded-lg max-w-md">
          <Lock className="h-12 w-12 text-primary mx-auto mb-4 drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]" />
          <h1 className="text-2xl font-display font-bold mb-2 neon-text">Course Not Purchased</h1>
          <p className="text-muted-foreground mb-4">Purchase this course to join the discussion.</p>
          <Button variant="neon" asChild>
            <Link to={`/courses/${courseId}`}>View Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Course not found
  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center glass-card p-8 rounded-lg max-w-md">
          <h1 className="text-2xl font-display font-bold mb-4 neon-text">Course Not Found</h1>
          <Button variant="neon" asChild>
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <CourseBreadcrumb
          segments={[
            { label: course.title, href: `/courses/${courseId}` },
            { label: 'Discussions' },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-6 w-6 text-secondary drop-shadow-[0_0_10px_hsl(var(--secondary)/0.5)]" />
              <h1 className="text-2xl font-display font-bold neon-text">Discussion Board</h1>
            </div>
            <p className="text-muted-foreground">
              {course.discussion_question || 'Share your questions, insights, and connect with fellow founders.'}
            </p>
          </div>

          {!showCreateForm && (
            <Button variant="neon" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          )}
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateDiscussionForm
              courseId={courseId!}
              userId={user!.id}
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Discussion list */}
        {discussionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <NeonSpinner size="lg" />
          </div>
        ) : (
          <DiscussionList discussions={discussions || []} courseId={courseId!} />
        )}
      </div>
    </div>
  );
}