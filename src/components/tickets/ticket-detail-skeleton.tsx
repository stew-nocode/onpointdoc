import { Skeleton } from '@/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/ui/card';

/**
 * Skeleton loader for ticket detail page
 * Matches the layout structure of the actual page
 */
export function TicketDetailSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* Header skeleton */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-96" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        {/* Left column */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Details card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Info card */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Comments skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Timeline skeleton (desktop only) */}
        <div className="hidden lg:block w-96 flex-shrink-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0 border-b">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="flex-1 space-y-3 pt-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
