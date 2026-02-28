/**
 * @file CoursesSkeleton.tsx — Shimmer placeholder for the Courses catalog page.
 * Shows skeleton phase headers and course card grids.
 */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CoursesSkeleton() {
  return (
    <div className="space-y-20">
      {/* Three phases, each with course cards */}
      {Array.from({ length: 3 }).map((_, phaseIdx) => (
        <section key={phaseIdx}>
          {/* Phase header skeleton */}
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <Skeleton className="h-12 w-56 rounded-lg" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Course grid skeleton — 3 or 4 cards per phase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: phaseIdx === 0 ? 4 : 3 }).map((_, i) => (
              <Card key={i} className="glass-card overflow-hidden flex flex-col">
                {/* Thumbnail placeholder */}
                <Skeleton className="h-40 w-full rounded-none" />

                <CardHeader className="flex-1">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>

                <CardContent className="pt-0">
                  <Skeleton className="h-10 w-full rounded-md" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
