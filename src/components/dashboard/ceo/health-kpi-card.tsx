'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { ProductHealthData } from '@/types/dashboard';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

type HealthKPICardProps = {
  data: ProductHealthData;
};

/**
 * Card KPI pour la santé des produits
 * 
 * @param data - Données de santé (par produit, top modules)
 */
export function HealthKPICard({ data }: HealthKPICardProps) {
  const criticalProducts = data.byProduct.filter((p) => p.healthStatus === 'critical');
  const warningProducts = data.byProduct.filter((p) => p.healthStatus === 'warning');
  const goodProducts = data.byProduct.filter((p) => p.healthStatus === 'good');

  return (
    <div className="space-y-4">
      <KPICard
        title="Santé Produit"
        value={criticalProducts.length}
        description={`${criticalProducts.length} critique(s), ${warningProducts.length} avertissement(s)`}
        icon="activity"
        variant={criticalProducts.length > 0 ? 'danger' : warningProducts.length > 0 ? 'warning' : 'success'}
      />
      <div className="space-y-2">
        {data.byProduct.map((product) => (
          <ProductHealthItem key={product.productId} product={product} />
        ))}
      </div>
    </div>
  );
}

/**
 * Item de santé d'un produit
 */
function ProductHealthItem({
  product
}: {
  product: ProductHealthData['byProduct'][0];
}) {
  const Icon = getHealthIcon(product.healthStatus);
  const color = getHealthColor(product.healthStatus);

  return (
    <div className="flex items-center justify-between p-2 rounded border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm font-medium">{product.productName}</span>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {product.bugRate}% BUGs ({product.totalBugs}/{product.totalTickets})
      </div>
    </div>
  );
}

/**
 * Retourne l'icône selon le statut de santé
 */
function getHealthIcon(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good':
      return CheckCircle2;
    case 'warning':
      return AlertTriangle;
    case 'critical':
      return AlertCircle;
  }
}

/**
 * Retourne la couleur selon le statut de santé
 */
function getHealthColor(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-orange-600 dark:text-orange-400';
    case 'critical':
      return 'text-red-600 dark:text-red-400';
  }
}

