/**
 * @file CourseProject.tsx — Course Project Page (Milestone-Based + Graduation Gate)
 * 
 * Shows the milestone-based project workflow:
 * - Displays course project title & description
 * - Lists 3-4 milestones as expandable cards
 * - Each milestone has its own submission, AI feedback, and rubric scorecard
 * - Milestones unlock sequentially (must complete previous to proceed)
 * - Falls back to the legacy single-submission form if no milestones exist
 * 
 * COURSE 10 SPECIAL BEHAVIOR:
 * - Shows a Graduation Gate requiring all 9 courses to be 100% complete
 * - Includes a Portfolio Compiler button to download all projects as PDF
 * - Only unlocks the project form after prerequisites are met
 */
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProjectSubmissionForm } from '@/components/project/ProjectSubmissionForm';
import { ProjectFeedback } from '@/components/project/ProjectFeedback';
import { MilestoneCard } from '@/components/project/MilestoneCard';
import { GraduationGate } from '@/components/project/GraduationGate';
import { CourseBreadcrumb } from '@/components/navigation/CourseBreadcrumb';
import { useCourse, useHasPurchasedCourse } from '@/hooks/useCourses';
import { useCourseProject } from '@/hooks/useProjects';
import { useCourseMilestones, useMilestoneSubmissions } from '@/hooks/useProjectMilestones';
import { useGraduationGate } from '@/hooks/useGraduationGate';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { downloadPortfolioPDF } from '@/lib/portfolioGenerator';
import { Lock, Target, Download, GraduationCap } from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function CourseProject() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: hasPurchased, isLoading: purchaseLoading } = useHasPurchasedCourse(user?.id, courseId);
  const { data: project } = useCourseProject(user?.id, courseId);

  // Milestone data
  const { data: milestones = [], isLoading: milestonesLoading } = useCourseMilestones(courseId);
  const { data: submissions = [], isLoading: subsLoading } = useMilestoneSubmissions(user?.id, courseId);

  // Graduation gate — only active for Course 10 (order_number = 10)
  const isGraduationCourse = course?.order_number === 10;
  const { data: gate, isLoading: gateLoading } = useGraduationGate(
    isGraduationCourse ? user?.id : undefined,
    isGraduationCourse ? courseId : undefined
  );

  // Portfolio data — for the PDF download button
  const studentName = profile?.display_name || user?.email?.split('@')[0] || 'Student';
  const { data: portfolioData } = usePortfolioData(
    isGraduationCourse ? user?.id : undefined,
    isGraduationCourse ? courseId : undefined,
    studentName
  );

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
        <div className="glass-card p-8 text-center border-warning/30 max-w-md">
          <div className="h-16 w-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_hsl(var(--warning)/0.3)]">
            <Lock className="h-8 w-8 text-warning" />
          </div>
          <h1 className="text-2xl font-bold mb-2 neon-text">Course Not Purchased</h1>
          <p className="text-muted-foreground mb-6">Purchase this course to access the project.</p>
          <Button asChild variant="neon">
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
        <div className="glass-card p-8 text-center border-destructive/30 max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Course Not Found</h1>
          <Button asChild variant="neon">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  // No project for this course
  if (!course.project_title) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="glass-card p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2 neon-text">No Project Available</h1>
          <p className="text-muted-foreground mb-6">This course doesn't have a project assignment yet.</p>
          <Button asChild variant="neon">
            <Link to={`/courses/${courseId}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Build a map of milestone_id → submission for quick lookup
  const submissionMap = new Map(submissions.map((s) => [s.milestone_id, s]));

  // Calculate milestone progress
  const reviewedCount = milestones.filter((m) => submissionMap.get(m.id)?.status === 'reviewed').length;
  const progressPct = milestones.length > 0 ? Math.round((reviewedCount / milestones.length) * 100) : 0;

  // Determine which milestones are unlocked (sequential gating)
  const isMilestoneUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevMilestone = milestones[index - 1];
    const prevSubmission = submissionMap.get(prevMilestone.id);
    return prevSubmission?.status === 'reviewed';
  };

  const hasMilestones = milestones.length > 0;

  /** Handle portfolio PDF download */
  const handleDownloadPortfolio = () => {
    if (!portfolioData) {
      toast({ title: 'Loading...', description: 'Portfolio data is still loading. Try again in a moment.' });
      return;
    }
    try {
      downloadPortfolioPDF(portfolioData);
      toast({ title: 'Portfolio Downloaded', description: 'Your professional portfolio PDF has been saved.' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message, variant: 'destructive' });
    }
  };

  // For graduation course: check if gate is still loading
  const gateBlocked = isGraduationCourse && (gateLoading || !gate?.isUnlocked);

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <CourseBreadcrumb
          segments={[
            { label: course.title, href: `/courses/${courseId}` },
            { label: 'Project' },
          ]}
          className="mb-6"
        />

        <div className="space-y-8">
          {/* Project Header */}
          <div className="glass-card border-accent/30 bg-accent/5 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {isGraduationCourse && (
                      <GraduationCap className="h-6 w-6 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.5)]" />
                    )}
                    <h1 className="text-2xl font-bold neon-text">{course.project_title}</h1>
                  </div>
                  <p className="text-muted-foreground mt-2">{course.project_description}</p>
                </div>
                {hasMilestones && !gateBlocked && (
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {reviewedCount}/{milestones.length} milestones
                      </span>
                    </div>
                    <Progress value={progressPct} className="w-32 h-2" style={{ boxShadow: '0 0 8px hsl(var(--primary)/0.4)' }} />
                  </div>
                )}
              </div>

              {/* Portfolio Download Button — only for graduation course when gate is open */}
              {isGraduationCourse && gate?.isUnlocked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPortfolio}
                  disabled={!portfolioData}
                  className="border-accent/50 hover:border-accent hover:bg-accent/10 hover:text-accent mt-2"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Portfolio PDF
                </Button>
              )}
            </div>
          </div>

          {/* ─── Graduation Gate (Course 10 only) ─── */}
          {isGraduationCourse && (
            <>
              {gateLoading ? (
                <div className="flex items-center justify-center py-8">
                  <NeonSpinner size="md" />
                </div>
              ) : gate ? (
                <GraduationGate gate={gate} />
              ) : null}
            </>
          )}

          {/* ─── Project Content (only if gate is open or not a graduation course) ─── */}
          {!gateBlocked && (
            <>
              {/* Milestone-based workflow */}
              {hasMilestones ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Project Milestones
                  </h2>
                  {(milestonesLoading || subsLoading) ? (
                    <div className="flex items-center justify-center py-8">
                      <NeonSpinner size="md" />
                    </div>
                  ) : (
                    milestones.map((milestone, index) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        submission={submissionMap.get(milestone.id)}
                        userId={user!.id}
                        courseId={courseId!}
                        number={index + 1}
                        isUnlocked={isMilestoneUnlocked(index)}
                      />
                    ))
                  )}
                </div>
              ) : (
                /* Legacy single-submission fallback */
                <>
                  <ProjectSubmissionForm course={course} userId={user!.id} />
                  {project?.ai_feedback && <ProjectFeedback project={project} />}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
