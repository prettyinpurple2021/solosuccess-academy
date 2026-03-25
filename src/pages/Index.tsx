/**
 * @file Index.tsx — Landing Page
 * 
 * Composed from modular section components for maintainability.
 * Each section handles its own layout and presentation.
 */
import { useCourses } from '@/hooks/useCourses';
import { PageMeta } from '@/components/layout/PageMeta';
import { ErrorView } from '@/components/ui/error-view';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CourseJourneySection } from '@/components/landing/CourseJourneySection';
import { CTASection } from '@/components/landing/CTASection';

export default function Index() {
  const { data: courses, isLoading, isError, error, refetch } = useCourses();

  if (isError) {
    return (
      <div className="flex-1 relative z-10">
        <PageMeta path="/" />
        <ErrorView
          message={error?.message}
          onRetry={() => refetch()}
          backTo="/"
          backLabel="Go home"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 relative z-10">
      <PageMeta path="/" />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CourseJourneySection courses={courses} isLoading={isLoading} />
      <CTASection />
    </div>
  );
}
