import { ReactNode, Suspense } from 'react';
import { KPICardSkeleton } from '../kpi-card-skeleton';

type KPISuspenseProps = {
  children: ReactNode;
};

export function KPISuspense({ children }: KPISuspenseProps) {
  return <Suspense fallback={<KPICardSkeleton />}>{children}</Suspense>;
}
