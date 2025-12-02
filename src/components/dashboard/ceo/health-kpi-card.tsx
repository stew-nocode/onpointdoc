'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { ProductHealthData, Period } from '@/types/dashboard';

type HealthKPICardProps = {
  data: ProductHealthData;
  period: Period; // Période globale pour cohérence (utilisé par React.memo)
};

/**
 * Card KPI pour la santé des produits
 * 
 * @param data - Données de santé (par produit, top modules)
 * @param period - Période globale pour cohérence (utilisé par React.memo pour détecter les changements)
 */
export function HealthKPICard({ data, period: _period }: HealthKPICardProps) {
  if (!data || !data.byProduct) {
    return (
      <KPICard
        title="Santé Produit"
        value="N/A"
        description="Données non disponibles"
        icon="activity"
        variant="default"
        subtitle="vs période précédente"
      />
    );
  }

  const criticalProducts = data.byProduct.filter((p) => p.healthStatus === 'critical');
  const warningProducts = data.byProduct.filter((p) => p.healthStatus === 'warning');
  const totalProducts = data.byProduct.length;
  const healthyProducts = totalProducts - criticalProducts.length - warningProducts.length;

  // Calculer la tendance (pour l'instant, pas de données de période précédente)
  // On affichera 0% si pas de tendance disponible
  const trend = 0; // TODO: Calculer la tendance réelle quand les données seront disponibles

  return (
    <KPICard
      title="Santé Produit"
      value={criticalProducts.length}
      description={`${healthyProducts} sain(s), ${warningProducts.length} avertissement(s)`}
      icon="activity"
      variant={criticalProducts.length > 0 ? 'danger' : warningProducts.length > 0 ? 'warning' : 'success'}
      subtitle="vs période précédente"
      trend={trend !== 0 ? {
        value: Math.abs(trend),
        isPositive: trend <= 0 // Moins de produits critiques = positif
      } : undefined}
    />
  );
}

