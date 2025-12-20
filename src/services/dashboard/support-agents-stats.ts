/**
 * Statistiques des agents Support (OBC) pour les cartes agents du dashboard.
 *
 * @description
 * Retourne la liste des agents Support affectés à des modules du produit
 * ainsi que leurs KPI sur la période (filtrée) :
 * - résolus
 * - en cours
 * - temps d'assistance (heures)
 *
 * MTTR sera branché plus tard (placeholder côté UI).
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SupportAgentCardStats = {
  profileId: string;
  fullName: string;
  email: string | null;
  isActive: boolean;
  moduleNames: string[];
  totalTicketsCount: number;
  resolvedCount: number;
  inProgressCount: number;
  assistanceHours: number;
};

export type SupportAgentsStats = {
  data: SupportAgentCardStats[];
  totalAgents: number;
  periodStart: string;
  periodEnd: string;
};

type TicketDurationInput = {
  duration_minutes: number | null;
  created_at: string | null;
  resolved_at: string | null;
};

/**
 * Calcule la durée d'un ticket d'assistance en minutes.
 * 
 * IMPORTANT: Pour les tickets d'assistance, on utilise UNIQUEMENT duration_minutes
 * car le calcul depuis created_at/resolved_at peut donner des durées aberrantes
 * (ex: ticket créé en janvier et résolu en décembre = ~8000h).
 * 
 * Les agents renseignent manuellement duration_minutes lors de la création.
 */
function calculateTicketDurationMinutes(ticket: TicketDurationInput): number {
  // Utiliser uniquement duration_minutes si disponible et valide
  if (ticket.duration_minutes && ticket.duration_minutes > 0) {
    // Limiter à 8h max (480 minutes) pour éviter les erreurs de saisie
    return Math.min(ticket.duration_minutes, 480);
  }
  // Si pas de duration_minutes, retourner 0 (ne pas calculer depuis les dates)
  return 0;
}

function toHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

export const getSupportAgentsStats = cache(
  async (productId: string, periodStart: string, periodEnd: string): Promise<SupportAgentsStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1) Agents/Managers Support (on inclut aussi les managers, ex: Vivien)
      const { data: supportProfiles, error: supportError } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_active, role, department')
        .eq('department', 'Support')
        .in('role', ['agent', 'manager']);
      if (supportError) {
        console.error('[getSupportAgentsStats] supportError:', supportError);
        return null;
      }

      const baseAgents = (supportProfiles ?? []).map((p) => ({
        profileId: p.id,
        fullName: p.full_name ?? p.email ?? 'Agent',
        email: p.email ?? null,
        isActive: p.is_active !== false,
      }));

      if (baseAgents.length === 0) {
        return { data: [], totalAgents: 0, periodStart, periodEnd };
      }

      // 2) Modules du produit (pour tags)
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, name')
        .eq('product_id', productId);
      if (modulesError) {
        console.error('[getSupportAgentsStats] modulesError:', modulesError);
        return null;
      }

      const moduleIds = (modules ?? []).map((m) => m.id);
      // Si pas de modules, on garde quand même les profils Support (tags vides)

      // 2) Affectations user↔module pour ces modules
      const moduleNameById = new Map<string, string>((modules ?? []).map((m) => [m.id, m.name ?? '—']));
      const moduleNamesByUser = new Map<string, Set<string>>();
      if (moduleIds.length > 0) {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('user_module_assignments')
          .select('user_id, module_id')
          .in('module_id', moduleIds);
        if (assignmentsError) {
          console.error('[getSupportAgentsStats] assignmentsError:', assignmentsError);
          return null;
        }

        (assignments ?? []).forEach((a) => {
          if (!a.user_id) return;
          const name = moduleNameById.get(a.module_id) ?? '—';
          if (!moduleNamesByUser.has(a.user_id)) moduleNamesByUser.set(a.user_id, new Set());
          moduleNamesByUser.get(a.user_id)!.add(name);
        });
      }

      const agents = baseAgents.map((a) => ({
        ...a,
        moduleNames: Array.from(moduleNamesByUser.get(a.profileId) ?? []).sort((x, y) => x.localeCompare(y, 'fr')),
      }));

      const agentIds = agents.map((a) => a.profileId);
      if (agentIds.length === 0) {
        return { data: [], totalAgents: 0, periodStart, periodEnd };
      }

      // 4) Tickets totaux sur la période (créés par l'agent)
      // IMPORTANT: Pagination nécessaire car Supabase limite à 1000 résultats par requête
      const totalTickets: Array<{ created_by: string }> = [];
      let totalTicketsOffset = 0;
      const totalTicketsPageSize = 1000;
      let hasMoreTotalTickets = true;
      while (hasMoreTotalTickets) {
        const { data: page, error: totalError } = await supabase
          .from('tickets')
          .select('created_by', { count: 'exact' })
          .eq('product_id', productId)
          .in('created_by', agentIds)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .range(totalTicketsOffset, totalTicketsOffset + totalTicketsPageSize - 1);
        if (totalError) {
          console.error('[getSupportAgentsStats] totalError:', totalError);
          return null;
        }
        if (page && page.length > 0) {
          totalTickets.push(...page);
          totalTicketsOffset += totalTicketsPageSize;
          hasMoreTotalTickets = page.length === totalTicketsPageSize;
        } else {
          hasMoreTotalTickets = false;
        }
      }

      // 4) Tickets résolus sur la période (on utilise resolved_at pour fiabilité)
      const resolvedTickets: Array<{ assigned_to: string }> = [];
      let resolvedTicketsOffset = 0;
      const resolvedTicketsPageSize = 1000;
      let hasMoreResolvedTickets = true;
      while (hasMoreResolvedTickets) {
        const { data: page, error: resolvedError } = await supabase
          .from('tickets')
          .select('assigned_to', { count: 'exact' })
          .eq('product_id', productId)
          .in('assigned_to', agentIds)
          .not('resolved_at', 'is', null)
          .gte('resolved_at', periodStart)
          .lte('resolved_at', periodEnd)
          .range(resolvedTicketsOffset, resolvedTicketsOffset + resolvedTicketsPageSize - 1);
        if (resolvedError) {
          console.error('[getSupportAgentsStats] resolvedError:', resolvedError);
          return null;
        }
        if (page && page.length > 0) {
          resolvedTickets.push(...page);
          resolvedTicketsOffset += resolvedTicketsPageSize;
          hasMoreResolvedTickets = page.length === resolvedTicketsPageSize;
        } else {
          hasMoreResolvedTickets = false;
        }
      }

      // 5) Tickets en cours sur la période (créés par l'agent dans la période et non résolus)
      const openTickets: Array<{ created_by: string }> = [];
      let openTicketsOffset = 0;
      const openTicketsPageSize = 1000;
      let hasMoreOpenTickets = true;
      while (hasMoreOpenTickets) {
        const { data: page, error: openError } = await supabase
          .from('tickets')
          .select('created_by', { count: 'exact' })
          .eq('product_id', productId)
          .in('created_by', agentIds)
          .is('resolved_at', null)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .range(openTicketsOffset, openTicketsOffset + openTicketsPageSize - 1);
        if (openError) {
          console.error('[getSupportAgentsStats] openError:', openError);
          return null;
        }
        if (page && page.length > 0) {
          openTickets.push(...page);
          openTicketsOffset += openTicketsPageSize;
          hasMoreOpenTickets = page.length === openTicketsPageSize;
        } else {
          hasMoreOpenTickets = false;
        }
      }

      // 6) Temps d'assistance (ASSISTANCE) sur la période
      const assistanceTickets: Array<{ created_by: string; duration_minutes: number | null; created_at: string | null; resolved_at: string | null }> = [];
      let assistanceTicketsOffset = 0;
      const assistanceTicketsPageSize = 1000;
      let hasMoreAssistanceTickets = true;
      while (hasMoreAssistanceTickets) {
        const { data: page, error: assistanceError } = await supabase
          .from('tickets')
          .select('created_by, duration_minutes, created_at, resolved_at', { count: 'exact' })
          .eq('product_id', productId)
          .eq('ticket_type', 'ASSISTANCE')
          .in('created_by', agentIds)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .range(assistanceTicketsOffset, assistanceTicketsOffset + assistanceTicketsPageSize - 1);
        if (assistanceError) {
          console.error('[getSupportAgentsStats] assistanceError:', assistanceError);
          return null;
        }
        if (page && page.length > 0) {
          assistanceTickets.push(...page);
          assistanceTicketsOffset += assistanceTicketsPageSize;
          hasMoreAssistanceTickets = page.length === assistanceTicketsPageSize;
        } else {
          hasMoreAssistanceTickets = false;
        }
      }

      const resolvedCountByAgent = new Map<string, number>();
      resolvedTickets.forEach((t) => {
        if (!t.assigned_to) return;
        resolvedCountByAgent.set(t.assigned_to, (resolvedCountByAgent.get(t.assigned_to) ?? 0) + 1);
      });

      const totalCountByAgent = new Map<string, number>();
      totalTickets.forEach((t) => {
        if (!t.created_by) return;
        totalCountByAgent.set(t.created_by, (totalCountByAgent.get(t.created_by) ?? 0) + 1);
      });

      const openCountByAgent = new Map<string, number>();
      openTickets.forEach((t) => {
        if (!t.created_by) return;
        openCountByAgent.set(t.created_by, (openCountByAgent.get(t.created_by) ?? 0) + 1);
      });

      const assistanceMinutesByAgent = new Map<string, number>();
      assistanceTickets.forEach((t) => {
        if (!t.created_by) return;
        const mins = calculateTicketDurationMinutes(t);
        assistanceMinutesByAgent.set(t.created_by, (assistanceMinutesByAgent.get(t.created_by) ?? 0) + mins);
      });

      const data: SupportAgentCardStats[] = agents
        .map((a) => ({
          ...a,
          totalTicketsCount: totalCountByAgent.get(a.profileId) ?? 0,
          resolvedCount: resolvedCountByAgent.get(a.profileId) ?? 0,
          inProgressCount: openCountByAgent.get(a.profileId) ?? 0,
          assistanceHours: toHours(assistanceMinutesByAgent.get(a.profileId) ?? 0),
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'fr'));

      return {
        data,
        totalAgents: data.length,
        periodStart,
        periodEnd,
      };
    } catch (e) {
      console.error('[getSupportAgentsStats] Unexpected error:', e);
      return null;
    }
  }
);


