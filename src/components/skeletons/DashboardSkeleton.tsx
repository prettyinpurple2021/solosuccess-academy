/**
 * @file DashboardSkeleton.tsx — Shimmer placeholder for the Dashboard page.
 * Shows skeleton versions of stats cards, continue-learning card, and course list.
 */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="py-8">
      <div className="container">
        {/* Welcome header skeleton */}
        <div className="mb-10">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-10 w-80 mb-3" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <div>
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content skeleton */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue learning card */}
            <Card className="glass-card">
              <CardHeader>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-6 w-64 mb-1" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-3" />
                <Skeleton className="h-10 w-40" />
              </CardContent>
            </Card>

            {/* Course list skeleton */}
            <div>
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="glass-card">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-5 w-48 mb-3" />
                          <Skeleton className="h-1.5 w-full" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
