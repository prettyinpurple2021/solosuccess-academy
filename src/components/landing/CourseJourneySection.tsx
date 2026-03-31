/**
 * @file CourseJourneySection.tsx — Timeline layout of course phases
 * 
 * Displays all courses grouped by phase (Initialization, Orchestration, Launch)
 * with a timeline connector visual. Includes a loading skeleton.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { phaseMetadata, formatPrice, type CoursePhase } from '@/lib/courseData';
import { Skeleton } from '@/components/ui/skeleton';

/** Tailwind text-color classes for each phase's timeline node */
const phaseColors: Record<CoursePhase, string> = {
  initialization: 'text-primary',
  orchestration: 'text-secondary',
  launch: 'text-accent',
};

/** Skeleton placeholder shown while courses load */
function CourseJourneySkeleton() {
  return (
    <div className="space-y-16 max-w-5xl mx-auto">
      {[1, 2, 3].map((phase) => (
        <div key={phase} className="space-y-6">
          <Skeleton className="h-10 w-56" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((card) => (
              <div key={card} className="data-card p-6 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-full mt-2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CourseJourneySectionProps {
  courses: Array<{
    id: string;
    title: string;
    description: string | null;
    phase: string;
    order_number: number;
    price_cents: number;
  }> | undefined;
  isLoading: boolean;
}

export function CourseJourneySection({ courses, isLoading }: CourseJourneySectionProps) {
  /* Group courses by phase */
  const coursesByPhase = courses?.reduce((acc, course) => {
    const phase = course.phase as CoursePhase;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(course);
    return acc;
  }, {} as Record<CoursePhase, typeof courses>);

  return (
    <section className="py-24 nebula-section">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            <span className="text-foreground">YOUR PATH TO</span>
            <br />
            <span className="text-gradient animate-neon-glow inline-block">SUCCESS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Three phases, ten courses, one transformation. Each course builds on the last,
            culminating in your professional portfolio and pitch.
          </p>
        </div>

        {isLoading ? (
          <CourseJourneySkeleton />
        ) : (
          /* Timeline connector layout */
          <div className="timeline-connector space-y-20 max-w-5xl mx-auto">
            {(['initialization', 'orchestration', 'launch'] as CoursePhase[]).map((phase) => {
              const meta = phaseMetadata[phase];
              const phaseCourses = coursesByPhase?.[phase] || [];

              return (
                <div key={phase} className="relative space-y-8">
                  {/* Timeline node */}
                  <div className={`timeline-node ${phaseColors[phase]}`} style={{ top: '0.25rem' }} />

                  {/* Phase header */}
                  <div className="flex flex-wrap items-center gap-4">
                    <Badge className={`${meta.colorClass} px-4 py-2 text-sm font-display`}>
                      <span className="mr-2 text-lg">{meta.icon}</span>
                      {meta.label}
                    </Badge>
                    <span className="text-muted-foreground font-mono text-sm">{meta.description}</span>
                  </div>

                  {/* Course cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {phaseCourses.map((course) => (
                      <div key={course.id} className="data-card p-6 group">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="outline" className="text-xs font-mono border-primary/30">
                            Course {course.order_number}
                          </Badge>
                          <span className="font-display font-bold text-primary">
                            {formatPrice(course.price_cents)}
                          </span>
                        </div>
                        <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {course.description}
                        </p>
                        <Button variant="ghost" className="w-full group-hover:bg-primary/10 group-hover:text-primary" asChild>
                          <Link to={`/courses/${course.id}`}>
                            View Course
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
