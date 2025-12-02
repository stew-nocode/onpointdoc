import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period, WorkloadData } from '@/types/dashboard';
import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import { getPeriodDates } from './period-utils';
import { applyDashboardFilters, filterTicketsByTeam } from './filter-utils';
import { extractProfileRole, extractProfile, type SupabaseProfileRoleRelation, type SupabaseProfileRelation } from './utils/profile-utils';

/**
 * Calcule la répartition de la charge de travail par équipe et agent
 * 
 * ⚠️ IMPORTANT : Cette fonction utilise `cookies()` via `createSupabaseServerClient()`,
 * donc elle ne peut PAS utiliser `unstable_cache()`. On utilise uniquement `React.cache()`
 * pour éviter les appels redondants dans le même render tree.
 * 
 * @param period - Type de période
 * @param filters - Filtres optionnels (produits, types, équipes)
 * @returns Données de charge (par équipe, par agent, total)
 */
async function getWorkloadDistributionInternal(period: Period, filters?: Partial<DashboardFiltersInput>): Promise<WorkloadData> {
  const { startDate, endDate } = getPeriodDates(period);

  const supabase = await createSupabaseServerClient();

  // Tickets actifs (non résolus)
  let activeQuery = supabase
    .from('tickets')
    .select('id, assigned_to, assigned_to_profile:profiles!tickets_assigned_to_fkey(id, full_name, role)')
    .or('resolved_at.is.null,resolved_at.gt.' + endDate);
  
  activeQuery = applyDashboardFilters(activeQuery, filters);
  const { data: activeTickets } = await activeQuery;

  // Tickets résolus dans la période
  let resolvedQuery = supabase
    .from('tickets')
    .select('id, assigned_to, assigned_to_profile:profiles!tickets_assigned_to_fkey(id, full_name, role)')
    .not('resolved_at', 'is', null)
    .gte('resolved_at', startDate)
    .lte('resolved_at', endDate);
  
  resolvedQuery = applyDashboardFilters(resolvedQuery, filters);
  const { data: resolvedTickets } = await resolvedQuery;

  // Filtrer par équipe côté application
  let filteredActiveTickets = filterTicketsByTeam(activeTickets || [], filters?.teams);
  let filteredResolvedTickets = filterTicketsByTeam(resolvedTickets || [], filters?.teams);

  const byTeam = calculateWorkloadByTeam(filteredActiveTickets, filteredResolvedTickets);
  const byAgent = calculateWorkloadByAgent(filteredActiveTickets, filteredResolvedTickets);

  return {
    byTeam,
    byAgent,
    totalActive: filteredActiveTickets.length
  };
}

/**
 * Calcule la charge par équipe
 */
function calculateWorkloadByTeam(
  activeTickets: Array<{
    assigned_to_profile: SupabaseProfileRoleRelation;
  }>,
  resolvedTickets: Array<{
    assigned_to_profile: SupabaseProfileRoleRelation;
  }>
): WorkloadData['byTeam'] {
  const teamMap = new Map<
    string,
    { activeTickets: number; resolvedThisPeriod: number }
  >();

  activeTickets.forEach((ticket) => {
    const role = extractProfileRole(ticket.assigned_to_profile);
    const team = getTeamFromRole(role);
    if (!teamMap.has(team)) {
      teamMap.set(team, { activeTickets: 0, resolvedThisPeriod: 0 });
    }
    teamMap.get(team)!.activeTickets++;
  });

  resolvedTickets.forEach((ticket) => {
    const role = extractProfileRole(ticket.assigned_to_profile);
    const team = getTeamFromRole(role);
    if (teamMap.has(team)) {
      teamMap.get(team)!.resolvedThisPeriod++;
    }
  });

  return Array.from(teamMap.entries()).map(([team, data]) => ({
    team: team as 'support' | 'it' | 'marketing',
    activeTickets: data.activeTickets,
    resolvedThisPeriod: data.resolvedThisPeriod
  }));
}

/**
 * Calcule la charge par agent
 */
function calculateWorkloadByAgent(
  activeTickets: Array<{
    assigned_to: string | null;
    assigned_to_profile: SupabaseProfileRelation;
  }>,
  resolvedTickets: Array<{
    assigned_to: string | null;
    assigned_to_profile: SupabaseProfileRelation;
  }>
): WorkloadData['byAgent'] {
  const agentMap = buildAgentMap(activeTickets, resolvedTickets);
  return calculateWorkloadPercentages(agentMap);
}

/**
 * Construit la map des agents avec leurs tickets actifs et résolus
 */
function buildAgentMap(
  activeTickets: Array<{
    assigned_to: string | null;
    assigned_to_profile: SupabaseProfileRelation;
  }>,
  resolvedTickets: Array<{
    assigned_to: string | null;
    assigned_to_profile: SupabaseProfileRelation;
  }>
): Map<string, {
  agentName: string;
  team: string;
  activeTickets: number;
  resolvedThisPeriod: number;
}> {
  const agentMap = new Map<
    string,
    {
      agentName: string;
      team: string;
      activeTickets: number;
      resolvedThisPeriod: number;
    }
  >();

  activeTickets.forEach((ticket) => {
    if (!ticket.assigned_to) return;
    const profile = extractProfile(ticket.assigned_to_profile);
    if (!profile) return;
    
    const agentId = ticket.assigned_to;
    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, {
        agentName: profile.full_name || 'Non défini',
        team: getTeamFromRole(profile.role),
        activeTickets: 0,
        resolvedThisPeriod: 0
      });
    }
    agentMap.get(agentId)!.activeTickets++;
  });

  resolvedTickets.forEach((ticket) => {
    if (!ticket.assigned_to) return;
    const profile = extractProfile(ticket.assigned_to_profile);
    if (!profile) return;
    
    const agentId = ticket.assigned_to;
    if (agentMap.has(agentId)) {
      agentMap.get(agentId)!.resolvedThisPeriod++;
    }
  });

  return agentMap;
}

/**
 * Calcule les pourcentages de charge pour chaque agent
 */
function calculateWorkloadPercentages(
  agentMap: Map<string, {
    agentName: string;
    team: string;
    activeTickets: number;
    resolvedThisPeriod: number;
  }>
): WorkloadData['byAgent'] {
  const maxActive = Math.max(
    ...Array.from(agentMap.values()).map((a) => a.activeTickets),
    1
  );

  return Array.from(agentMap.entries()).map(([agentId, data]) => ({
    agentId,
    agentName: data.agentName,
    team: data.team,
    activeTickets: data.activeTickets,
    resolvedThisPeriod: data.resolvedThisPeriod,
    workloadPercent: Math.round((data.activeTickets / maxActive) * 100)
  }));
}

/**
 * Mappe un rôle vers une équipe
 */
function getTeamFromRole(role: string | undefined | null): string {
  if (!role) return 'support';
  if (role.includes('support') || role === 'agent' || role === 'manager') return 'support';
  if (role.includes('it')) return 'it';
  if (role.includes('marketing')) return 'marketing';
  return 'support';
}

/**
 * Version exportée avec React.cache() pour éviter les appels redondants
 * dans le même render tree
 * 
 * ⚠️ NOTE : On n'utilise pas `unstable_cache()` car cette fonction utilise
 * `cookies()` via `createSupabaseServerClient()`, ce qui n'est pas supporté
 * dans les fonctions mises en cache avec `unstable_cache()`.
 */
export const getWorkloadDistribution = cache(getWorkloadDistributionInternal);
