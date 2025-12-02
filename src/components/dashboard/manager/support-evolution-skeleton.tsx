'use client';

import { Card, CardContent, CardHeader } from '@/ui/card';
import { Skeleton } from '@/ui/skeleton';

/**
 * Skeleton de chargement pour le widget Support Evolution
 */
export function SupportEvolutionSkeleton() {
  return (
    <Card className="h-[420px] flex flex-col min-w-[400px]">
      <CardHeader className="pb-3 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <Skeleton className="h-full w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

