/**
 * Service pour récupérer la répartition des tickets par entreprise
 * 
 * Utilisé par le widget pie chart de répartition par entreprise avec filtre par type de ticket
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';
import { handleSupabaseError } from '@/lib/errors/handlers';
import { getPeriodDates } from './period-utils';

export type CompanyDistribution = {
  companyId: string;
  companyName: string;
  ticketCount: number;
};

export type TicketsByCompanyDistributionData = {
  distribution: CompanyDistribution[];
  period: Period | string;
  periodStart: string;
  periodEnd: string;
  selectedTicketTypes?: ('BUG' | 'REQ' | 'ASSISTANCE')[];
};

/**
 * Compte les tickets par entreprise pour une période donnée
 * 
 * Utilise la table ticket_company_link avec une requête optimisée
 * 
 * @param supabase - Client Supabase
 * @param startDate - Date de début (ISO string)
 * @param endDate - Date de fin (ISO string)
 * @param ticketTypes - Types de tickets à filtrer (optionnel, tous si vide)
 * @returns Distribution des tickets par entreprise
 */
async function countTicketsByCompany(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
  endDate: Date,
  ticketTypes?: ('BUG' | 'REQ' | 'ASSISTANCE')[]
): Promise<CompanyDistribution[]> {
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  // Requête optimisée avec jointure sur ticket_company_link
  // Filtrer directement les tickets par période et type, puis compter par entreprise
  let ticketsQuery = supabase
    .from('tickets')
    .select('id, ticket_type')
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  // Filtrer par types de tickets si spécifiés (seulement si moins de 3 types)
  // Si 3 types sélectionnés = tous les types, donc pas de filtre
  if (ticketTypes && ticketTypes.length > 0 && ticketTypes.length < 3) {
    ticketsQuery = ticketsQuery.in('ticket_type', ticketTypes);
  }

  const { data: tickets, error: ticketsError } = await ticketsQuery;

  if (ticketsError) {
    console.error('[TicketsByCompanyDistribution] Error fetching tickets:', ticketsError);
    throw handleSupabaseError(ticketsError, 'countTicketsByCompany');
  }

  if (!tickets || tickets.length === 0) {
    return [];
  }

  // Récupérer les liens entre tickets et entreprises
  const ticketIds = tickets.map((t) => t.id);

  const { data: links, error: linksError } = await supabase
    .from('ticket_company_link')
    .select('ticket_id, company_id')
    .in('ticket_id', ticketIds);

  if (linksError) {
    console.error('[TicketsByCompanyDistribution] Error fetching ticket-company links:', linksError);
    throw handleSupabaseError(linksError, 'countTicketsByCompany');
  }

  if (!links || links.length === 0) {
    return [];
  }

  // Compter les tickets par entreprise
  const companyMap = new Map<string, number>();

  links.forEach((link) => {
    const companyId = link.company_id;
    if (!companyId) {
      return;
    }

    const currentCount = companyMap.get(companyId) || 0;
    companyMap.set(companyId, currentCount + 1);
  });

  // Récupérer les noms des entreprises
  const companyIds = Array.from(companyMap.keys());

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name')
    .in('id', companyIds);

  if (companiesError) {
    console.error('[TicketsByCompanyDistribution] Error fetching companies:', companiesError);
    throw handleSupabaseError(companiesError, 'countTicketsByCompany');
  }

  // Construire la distribution avec les noms d'entreprises
  const distribution: CompanyDistribution[] = [];

  if (companies && Array.isArray(companies)) {
    const companiesMap = new Map(
      companies.map((c) => [c.id, c.name || 'Inconnu'])
    );

    companyMap.forEach((count, companyId) => {
      distribution.push({
        companyId,
        companyName: companiesMap.get(companyId) || 'Inconnu',
        ticketCount: count,
      });
    });
  }

  // Trier par nombre de tickets décroissant
  distribution.sort((a, b) => b.ticketCount - a.ticketCount);

  return distribution;
}

/**
 * Récupère la répartition des tickets par entreprise pour une période donnée
 * 
 * @param period - Type de période (week, month, quarter, year) ou année spécifique
 * @param customStartDate - Date de début personnalisée (optionnelle)
 * @param customEndDate - Date de fin personnalisée (optionnelle)
 * @param ticketTypes - Types de tickets à filtrer (optionnel, tous si vide)
 * @returns Données de répartition par entreprise
 */
async function getTicketsByCompanyDistributionInternal(
  period: Period | string,
  customStartDate?: string,
  customEndDate?: string,
  ticketTypes?: ('BUG' | 'REQ' | 'ASSISTANCE')[]
): Promise<TicketsByCompanyDistributionData> {
  try {
    const supabase = await createSupabaseServerClient();

    // Calculer les dates de période
    let start: Date;
    let end: Date;

    if (customStartDate && customEndDate) {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      const { startDate, endDate } = getPeriodDates(period);
      start = new Date(startDate);
      end = new Date(endDate);
    }

    const isCustomPeriod = !!customStartDate && !!customEndDate;
    const periodToUse = isCustomPeriod ? 'custom' : period;

    // Récupérer la distribution
    const distribution = await countTicketsByCompany(
      supabase,
      start,
      end,
      ticketTypes
    );

    return {
      distribution,
      period: periodToUse,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      selectedTicketTypes: ticketTypes,
    };
  } catch (error) {
    console.error('[TicketsByCompanyDistribution] Error:', error);
    throw error;
  }
}

/**
 * Version cachée avec React.cache pour optimiser les performances
 */
export const getTicketsByCompanyDistribution = cache(getTicketsByCompanyDistributionInternal);

