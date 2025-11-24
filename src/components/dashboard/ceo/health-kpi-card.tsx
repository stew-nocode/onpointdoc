'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { ProductHealthData } from '@/types/dashboard';

type HealthKPICardProps = {
  data: ProductHealthData;
};

/**
 * Card KPI pour la santé des produits
 * 
 * @param data - Données de santé (par produit, top modules)
 */
export function HealthKPICard({ data }: HealthKPICardProps) {
  if (!data || !data.byProduct) {
    return (
      <KPICard
        title="Santé Produit"
        value="N/A"
        description="Données non disponibles"
        icon="activity"
        variant="default"
      />
    );
  }

  const criticalProducts = data.byProduct.filter((p) => p.healthStatus === 'critical');
  const warningProducts = data.byProduct.filter((p) => p.healthStatus === 'warning');

  return (
    <KPICard
      title="Santé Produit"
      value={criticalProducts.length}
      description={`${criticalProducts.length} critique(s), ${warningProducts.length} avertissement(s)`}
      icon="activity"
      variant={criticalProducts.length > 0 ? 'danger' : warningProducts.length > 0 ? 'warning' : 'success'}
    />
  );
}

