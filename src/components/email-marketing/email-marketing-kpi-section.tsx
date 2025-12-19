'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { EmailMarketingKPIs } from '@/services/email-marketing/email-kpis';

type EmailMarketingKPISectionProps = {
  kpis: EmailMarketingKPIs;
  hasProfile?: boolean; // Pour cohérence avec les autres composants (pas utilisé pour email marketing)
};

/**
 * Détermine si une tendance est positive selon son type
 * 
 * @param trendValue - Valeur de la tendance
 * @param isDecreasingPositive - Si true, une diminution est positive (ex: retards)
 * @returns true si la tendance est positive
 */
function isTrendPositive(trendValue: number, isDecreasingPositive = false): boolean {
  return isDecreasingPositive ? trendValue <= 0 : trendValue >= 0;
}

/**
 * Formate un pourcentage pour l'affichage
 * 
 * @param value - Valeur en pourcentage (ex: 42.5)
 * @returns Chaîne formatée (ex: "42.5%")
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Formate un nombre pour l'affichage (k, M)
 * 
 * @param value - Nombre à formater
 * @returns Chaîne formatée (ex: "1.2k", "2.5M")
 */
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

/**
 * Section affichant les 4 KPIs pour l'Email Marketing
 * Affichée au-dessus du tableau des campagnes en grille responsive
 * Client Component car utilise des icônes Lucide (composants React)
 * 
 * Pattern similaire à TasksKPISection et ActivitiesKPISection pour cohérence
 */
export function EmailMarketingKPISection({ kpis, hasProfile }: EmailMarketingKPISectionProps) {
  // Déterminer si les tendances sont positives
  const totalCampaignsTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.totalCampaignsTrend ?? 0, false)
    : true;
  const averageOpenRateTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.averageOpenRateTrend ?? 0, false)
    : true;
  const averageClickRateTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.averageClickRateTrend ?? 0, false)
    : true;
  const totalEmailsSentTrendIsPositive = kpis.trends
    ? isTrendPositive(kpis.trends.totalEmailsSentTrend ?? 0, false)
    : true;

  return (
    <div className="kpi-grid-responsive gap-4">
      {/* Total Campagnes */}
      <div className="w-full">
        <KPICard
          title="Total Campagnes"
          value={kpis.totalCampaigns}
          description="Campagnes créées"
          icon="mail"
          variant="info"
          trend={
            kpis.trends?.totalCampaignsTrend !== undefined
              ? {
                  value: kpis.trends.totalCampaignsTrend,
                  isPositive: totalCampaignsTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.campaignsData}
        />
      </div>

      {/* Taux d'ouverture moyen */}
      <div className="w-full">
        <KPICard
          title="Taux d'ouverture moyen"
          value={formatPercentage(kpis.averageOpenRate)}
          description="Toutes campagnes confondues"
          icon="eye"
          variant="success"
          subtitle="Performance moyenne"
          trend={
            kpis.trends?.averageOpenRateTrend !== undefined
              ? {
                  value: kpis.trends.averageOpenRateTrend,
                  isPositive: averageOpenRateTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.openRateData}
        />
      </div>

      {/* Taux de clic moyen */}
      <div className="w-full">
        <KPICard
          title="Taux de clic moyen"
          value={formatPercentage(kpis.averageClickRate)}
          description="Engagement moyen"
          icon="mouse-pointer-click"
          variant="default"
          subtitle="Performance moyenne"
          trend={
            kpis.trends?.averageClickRateTrend !== undefined
              ? {
                  value: kpis.trends.averageClickRateTrend,
                  isPositive: averageClickRateTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.clickRateData}
        />
      </div>

      {/* Emails envoyés */}
      <div className="w-full">
        <KPICard
          title="Emails envoyés"
          value={formatNumber(kpis.totalEmailsSent)}
          description="Total toutes campagnes"
          icon="send"
          variant="default"
          subtitle="Volume total"
          trend={
            kpis.trends?.totalEmailsSentTrend !== undefined
              ? {
                  value: kpis.trends.totalEmailsSentTrend,
                  isPositive: totalEmailsSentTrendIsPositive
                }
              : undefined
          }
          chartData={kpis.chartData?.emailsSentData}
        />
      </div>
    </div>
  );
}

