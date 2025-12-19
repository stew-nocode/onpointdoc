/**
 * Service de statistiques d'évolution des tickets
 * 
 * @description
 * Fournit les données pour l'AreaChart d'évolution.
 * Soumis aux filtres globaux (période).
 * 
 * La granularité s'adapte automatiquement selon la période :
 * - Semaine (7 jours) → Par jour (7 points)
 * - Mois (30 jours) → Par semaine (4 points)
 * - Trimestre/Année → Par mois (variable)
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';

/**
 * Granularité des données (automatiquement déterminée selon la période)
 */
export type DataGranularity = 'day' | 'week' | 'month';

/**
 * Type pour un point de données d'évolution
 */
export type EvolutionDataPoint = {
  /** Label affiché (ex: "Lun 16", "Sem 1", "Nov 2024") */
  label: string;
  /** Date ISO du point */
  date: string;
  /** Nombre de BUGs créés */
  bug: number;
  /** Nombre de REQs créées */
  req: number;
  /** Nombre d'Assistances créées */
  assistance: number;
  /** Total tous types confondus */
  total: number;
};

/**
 * Type des statistiques d'évolution
 */
export type TicketsEvolutionStats = {
  data: EvolutionDataPoint[];
  totalTickets: number;
  periodStart: string;
  periodEnd: string;
  /** Granularité utilisée pour ces données */
  granularity: DataGranularity;
};

/**
 * Détermine la granularité optimale selon la période
 */
function getGranularity(period: Period | 'custom', periodStart: string, periodEnd: string): DataGranularity {
  // Si période explicite, utiliser la logique correspondante
  if (period === 'week') return 'day';
  if (period === 'month') return 'week';
  if (period === 'quarter' || period === 'year') return 'month';
  
  // Pour les périodes custom, calculer selon la durée
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return 'day';
  if (diffDays <= 31) return 'week';
  return 'month';
}

/**
 * Obtient le lundi de la semaine pour une date donnée
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Si dimanche (0), reculer de 6 jours, sinon reculer de (day - 1)
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Génère la clé de groupement selon la granularité
 */
function getGroupKey(date: Date, granularity: DataGranularity): string {
  switch (granularity) {
    case 'day':
      // Clé: "YYYY-MM-DD"
      return date.toISOString().split('T')[0];
    case 'week': {
      // Clé: Date du lundi de la semaine "YYYY-MM-DD"
      const monday = getMonday(date);
      return monday.toISOString().split('T')[0];
    }
    case 'month':
      // Clé: "YYYY-MM"
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

/**
 * Formate le label selon la granularité
 */
function formatLabel(key: string, granularity: DataGranularity): string {
  switch (granularity) {
    case 'day': {
      // "YYYY-MM-DD" → "lun. 16"
      const date = new Date(key);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayNum = date.getDate();
      return `${dayName} ${dayNum}`;
    }
    case 'week': {
      // "YYYY-MM-DD" (lundi) → "16-22 nov" ou "30 nov-6 déc"
      const monday = new Date(key);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startDay = monday.getDate();
      const endDay = sunday.getDate();
      const startMonth = monday.toLocaleDateString('fr-FR', { month: 'short' });
      const endMonth = sunday.toLocaleDateString('fr-FR', { month: 'short' });
      
      // Si même mois: "16-22 nov"
      // Si mois différents: "30 nov-6 déc"
      if (monday.getMonth() === sunday.getMonth()) {
        return `${startDay}-${endDay} ${startMonth}`;
      } else {
        return `${startDay} ${startMonth}-${endDay} ${endMonth}`;
      }
    }
    case 'month': {
      // "YYYY-MM" → "nov. 2024"
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    }
  }
}

/**
 * Génère tous les points de données pour la période (même sans tickets)
 */
function generateAllPoints(
  periodStart: string, 
  periodEnd: string, 
  granularity: DataGranularity
): Map<string, { bug: number; req: number; assistance: number }> {
  const points = new Map<string, { bug: number; req: number; assistance: number }>();
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  
  let current: Date;
  
  // Pour les semaines, commencer au lundi de la semaine de début
  if (granularity === 'week') {
    current = getMonday(start);
  } else {
    current = new Date(start);
  }
  
  while (current <= end) {
    const key = getGroupKey(current, granularity);
    if (!points.has(key)) {
      points.set(key, { bug: 0, req: 0, assistance: 0 });
    }
    
    // Avancer selon la granularité
    switch (granularity) {
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }
  
  return points;
}

/**
 * Récupère les statistiques d'évolution des tickets
 * 
 * La granularité s'adapte automatiquement :
 * - Semaine → par jour (7 points)
 * - Mois → par semaine (4 points)
 * - Trimestre/Année → par mois (variable)
 * 
 * ✅ OPTIMISÉ : Utilise la fonction PostgreSQL get_tickets_evolution_stats()
 * pour agréger en DB au lieu de charger tous les tickets puis grouper en JS.
 * 
 * @param productId - ID du produit pour filtrer
 * @param periodStart - Date de début de période (ISO string)
 * @param periodEnd - Date de fin de période (ISO string)
 * @param period - Type de période pour déterminer la granularité
 * @returns Statistiques d'évolution ou null en cas d'erreur
 * 
 * @see supabase/migrations/20251218000000_optimize_dashboard_stats_functions.sql
 */
export const getTicketsEvolutionStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    period: Period | 'custom' = 'month'
  ): Promise<TicketsEvolutionStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // Déterminer la granularité selon la période
      const granularity = getGranularity(period, periodStart, periodEnd);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[getTicketsEvolutionStats] Period: ${period}, Granularity: ${granularity}`);
      }

      // Appeler la fonction PostgreSQL optimisée (agrégation en DB)
      const { data, error } = await supabase.rpc('get_tickets_evolution_stats', {
        p_product_id: productId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_granularity: granularity,
      });

      if (error) {
        console.error('[getTicketsEvolutionStats] Error calling RPC:', error);
        return null;
      }

      if (!data || data.length === 0) {
        // Générer des points vides pour la période
        const dataMap = generateAllPoints(periodStart, periodEnd, granularity);
        const emptyData: EvolutionDataPoint[] = Array.from(dataMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key]) => ({
            label: formatLabel(key, granularity),
            date: key,
            bug: 0,
            req: 0,
            assistance: 0,
            total: 0,
          }));

        return {
          data: emptyData,
          totalTickets: 0,
          periodStart,
          periodEnd,
          granularity,
        };
      }

      // Type de retour de la fonction PostgreSQL
      type PostgresEvolutionStats = {
        period_key: string;
        bug_count: number;
        req_count: number;
        assistance_count: number;
        total_count: number;
      };

      const results = data as PostgresEvolutionStats[];

      // Générer tous les points de la période (même vides) pour garantir la continuité
      const dataMap = generateAllPoints(periodStart, periodEnd, granularity);

      // Remplir avec les données de PostgreSQL
      results.forEach((row) => {
        const key = row.period_key;
        const point = dataMap.get(key);
        if (point) {
          point.bug = Number(row.bug_count);
          point.req = Number(row.req_count);
          point.assistance = Number(row.assistance_count);
        } else {
          // Si la clé n'existe pas dans le map, l'ajouter
          dataMap.set(key, {
            bug: Number(row.bug_count),
            req: Number(row.req_count),
            assistance: Number(row.assistance_count),
          });
        }
      });

      // Convertir en tableau et formater
      const evolutionData: EvolutionDataPoint[] = Array.from(dataMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, counts]) => {
          return {
            label: formatLabel(key, granularity),
            date: key,
            bug: counts.bug,
            req: counts.req,
            assistance: counts.assistance,
            total: counts.bug + counts.req + counts.assistance,
          };
        });

      const totalTickets = evolutionData.reduce((sum, point) => sum + point.total, 0);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[getTicketsEvolutionStats] ${granularity}: ${evolutionData.length} points, ${totalTickets} tickets`);
      }

      return {
        data: evolutionData,
        totalTickets,
        periodStart,
        periodEnd,
        granularity,
      };
    } catch (error) {
      console.error('[getTicketsEvolutionStats] Unexpected error:', error);
      return null;
    }
  }
);

