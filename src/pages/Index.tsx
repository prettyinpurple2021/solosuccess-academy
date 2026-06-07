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
import { TrustBandSection } from '@/components/landing/TrustBandSection';
import { FounderNoteSection } from '@/components/landing/FounderNoteSection';
import { FAQSection, faqs } from '@/components/landing/FAQSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';

export default function Index() {
  const { data: courses, isLoading, isError, error, refetch } = useCourses();

  const faqJsonLd = {
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

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
      <PageMeta path="/" jsonLd={faqJsonLd} />
      <HeroSection />
      <TrustBandSection />
      <FeaturesSection />
      <FounderNoteSection />
      <CourseJourneySection courses={courses} isLoading={isLoading} />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
