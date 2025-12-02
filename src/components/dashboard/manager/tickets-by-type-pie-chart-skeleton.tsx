import { Card, CardContent, CardHeader } from '@/ui/card';
import { Skeleton } from '@/ui/skeleton';

/**
 * Skeleton de chargement pour le widget Répartition par Type
 */
export function TicketsByTypePieChartSkeleton() {
  return (
    <Card className="h-[420px] flex flex-col min-w-[400px]">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-[200px] w-[200px] rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


