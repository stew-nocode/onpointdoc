/**
 * Skeleton de chargement pour le widget Répartition par Entreprise
 */

import { Card, CardContent, CardHeader } from '@/ui/card';
import { Skeleton } from '@/ui/skeleton';

export function TicketsByCompanyPieChartSkeleton() {
  return (
    <Card className="h-[420px] flex flex-col min-w-[400px]">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <Skeleton className="h-64 w-64 rounded-full" />
        </div>
        <div className="mt-4 flex-shrink-0 flex items-center justify-center">
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

