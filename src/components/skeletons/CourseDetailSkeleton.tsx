/**
 * @file CourseDetailSkeleton.tsx — Shimmer placeholder for the CourseDetail page.
 * Shows skeleton hero section, purchase card, and lesson list.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <Header />
      <main className="flex-1 relative">
        <div className="cyber-grid" />

        {/* Hero section skeleton */}
        <section className="relative py-12 border-b border-primary/20">
          <div className="container relative z-10">
            <Skeleton className="h-8 w-28 mb-6" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-6 w-32 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-10 w-3/4 mb-4" />
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-2/3 mb-6" />
                <div className="flex flex-wrap gap-4">
                  <Skeleton className="h-8 w-36 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-32 rounded-full" />
                </div>
              </div>

              {/* Purchase card */}
              <div>
                <Card className="glass-card border-primary/30">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-24 mx-auto" />
                    <Skeleton className="h-4 w-40 mx-auto" />
                    <Skeleton className="h-12 w-full rounded-md" />
                    <div className="space-y-2 mt-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Lessons list skeleton */}
        <section className="py-12 relative z-10">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-7 w-40 mb-6" />
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="glass-card border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-5 w-48 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-8 w-16 rounded-md" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sidebar skeleton */}
              <div className="space-y-6">
                <Card className="glass-card">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
