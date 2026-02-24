/**
 * AdminExamEssay – Admin page combining the Final Exam Generator
 * and Final Essay Generator tools.
 * 
 * WHY: Centralises the generation of end-of-course assessments
 * (mixed-format exams and AI-graded essays) in one place.
 */
import { useAdminCourses } from '@/hooks/useAdmin';
import { FinalExamGenerator } from '@/components/admin/FinalExamGenerator';
import { FinalEssayGenerator } from '@/components/admin/FinalEssayGenerator';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { FileText } from 'lucide-react';

export default function AdminExamEssay() {
  const { data: courses, isLoading } = useAdminCourses();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  // Map courses to the shape expected by the generators
  const courseList = (courses || []).map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
  }));

  return (
    <div className="p-6 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
          <FileText className="h-8 w-8 text-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary)))' }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold neon-text">Exam & Essay Generator</h1>
          <p className="text-muted-foreground">
            Create mixed-format final exams and AI-graded essay assignments
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <FinalExamGenerator courses={courseList} />
        <FinalEssayGenerator courses={courseList} />
      </div>
    </div>
  );
}
