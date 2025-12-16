import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/errors/handlers';

/**
 * Type pour les KPIs Email Marketing
 * 
 * Structure alignée avec TaskKPIs et ActivityKPIs pour cohérence
 */
export type EmailMarketingKPIs = {
  totalCampaigns: number;
  averageOpenRate: number; // %
  averageClickRate: number; // %
  totalEmailsSent: number;
  trends?: {
    totalCampaignsTrend?: number;
    averageOpenRateTrend?: number;
    averageClickRateTrend?: number;
    totalEmailsSentTrend?: number;
  };
  chartData?: {
    campaignsData?: number[];
    openRateData?: number[];
    clickRateData?: number[];
    emailsSentData?: number[];
  };
};

/**
 * Calcule la tendance en pourcentage entre deux valeurs
 * 
 * @param current - Valeur actuelle
 * @param previous - Valeur précédente
 * @returns Pourcentage de variation (arrondi)
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Génère des données de graphique simulées pour un mini graphique
 * Crée une progression linéaire sur 7 jours
 * 
 * @param currentValue - Valeur actuelle
 * @param previousValue - Valeur précédente
 * @returns Tableau de 7 valeurs
 */
function generateChartData(currentValue: number, previousValue: number): number[] {
  const days = 7;
  const data: number[] = [];
  const step = (currentValue - previousValue) / days;
  for (let i = 0; i < days; i++) {
    const value = Math.max(0, Math.round(previousValue + step * (i + 1)));
    data.push(value);
  }
  return data;
}

/**
 * Récupère le total de campagnes
 * 
 * @param supabase - Client Supabase
 * @returns Nombre total de campagnes
 */
async function getTotalCampaigns(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<number> {
  const { count, error } = await supabase
    .from('brevo_email_campaigns')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    throw handleSupabaseError(error, 'getTotalCampaigns');
  }
  
  return count || 0;
}

/**
 * Récupère le taux d'ouverture moyen (AVG)
 * 
 * @param supabase - Client Supabase
 * @returns Taux d'ouverture moyen en pourcentage (0-100)
 */
async function getAverageOpenRate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<number> {
  const { data, error } = await supabase
    .from('brevo_email_campaigns')
    .select('open_rate')
    .not('open_rate', 'is', null);
  
  if (error) {
    throw handleSupabaseError(error, 'getAverageOpenRate');
  }
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  const sum = data.reduce((acc, row) => {
    const rate = typeof row.open_rate === 'string' 
      ? parseFloat(row.open_rate) 
      : Number(row.open_rate) || 0;
    return acc + rate;
  }, 0);
  
  return Math.round((sum / data.length) * 100) / 100; // Arrondi à 2 décimales
}

/**
 * Récupère le taux de clic moyen (AVG)
 * 
 * @param supabase - Client Supabase
 * @returns Taux de clic moyen en pourcentage (0-100)
 */
async function getAverageClickRate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<number> {
  const { data, error } = await supabase
    .from('brevo_email_campaigns')
    .select('click_rate')
    .not('click_rate', 'is', null);
  
  if (error) {
    throw handleSupabaseError(error, 'getAverageClickRate');
  }
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  const sum = data.reduce((acc, row) => {
    const rate = typeof row.click_rate === 'string' 
      ? parseFloat(row.click_rate) 
      : Number(row.click_rate) || 0;
    return acc + rate;
  }, 0);
  
  return Math.round((sum / data.length) * 100) / 100; // Arrondi à 2 décimales
}

/**
 * Récupère le total d'emails envoyés (SUM)
 * 
 * @param supabase - Client Supabase
 * @returns Total d'emails envoyés
 */
async function getTotalEmailsSent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<number> {
  const { data, error } = await supabase
    .from('brevo_email_campaigns')
    .select('emails_sent');
  
  if (error) {
    throw handleSupabaseError(error, 'getTotalEmailsSent');
  }
  
  if (!data || data.length === 0) {
    return 0;
  }
  
  return data.reduce((acc, row) => {
    const sent = Number(row.emails_sent) || 0;
    return acc + sent;
  }, 0);
}

/**
 * Récupère les KPIs Email Marketing
 *
 * Pour le MVP, retourne des valeurs calculées depuis brevo_email_campaigns.
 * Les tendances et chartData sont optionnels (peuvent être ajoutés plus tard).
 *
 * IMPORTANT: Le client Supabase doit être passé en paramètre pour compatibilité
 * avec unstable_cache (cookies() ne peut pas être appelé dans un cache).
 *
 * @param supabase - Client Supabase (créé en dehors du cache)
 * @returns KPIs Email Marketing avec statistiques de base
 */
export async function getEmailMarketingKPIs(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<EmailMarketingKPIs> {
  // Récupérer les valeurs actuelles en parallèle
  const [
    totalCampaigns,
    averageOpenRate,
    averageClickRate,
    totalEmailsSent
  ] = await Promise.all([
    getTotalCampaigns(supabase),
    getAverageOpenRate(supabase),
    getAverageClickRate(supabase),
    getTotalEmailsSent(supabase)
  ]);

  // Pour le MVP, on retourne les KPIs sans tendances ni chartData
  // TODO: Implémenter les tendances (comparaison avec période précédente)
  // TODO: Implémenter les données graphiques (historique sur 7 jours)

  return {
    totalCampaigns,
    averageOpenRate,
    averageClickRate,
    totalEmailsSent
    // trends et chartData optionnels pour le MVP
  };
}

