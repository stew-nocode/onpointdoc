/**
 * Statistiques pour Radar Chart - comparaison des agents Support (uniquement role=agent).
 *
 * Dimensions demandées :
 * - Total tickets créés
 * - Temps d'assistance (heures)
 * - Nombre d'assistances (créées)
 * - Total assistances résolues
 *
 * Données filtrées par :
 * - produit (OBC)
 * - période (periodStart/periodEnd)
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type SupportAgentRadarDimension =
  | 'totalTicketsCreated'
  | 'assistanceHours'
  | 'assistanceCount'
  | 'assistanceResolvedCount';

export type SupportAgentRadarRow = {
  agentId: string;
  agentName: string;
  values: Record<SupportAgentRadarDimension, number>;
};

export type SupportAgentsRadarStats = {
  dimensions: Array<{
    key: SupportAgentRadarDimension;
    label: string;
  }>;
  agents: SupportAgentRadarRow[];
  /** Data formatée pour Recharts RadarChart */
  chartData: Array<Record<string, number | string>>;
  /** Agents retenus (top N) */
  limit: number;
};

const DIMENSIONS: SupportAgentsRadarStats['dimensions'] = [
  { key: 'totalTicketsCreated', label: 'Total tickets créés' },
  { key: 'assistanceHours', label: 'Temps assistance (h)' },
  { key: 'assistanceCount', label: "Nb d'assistances" },
  { key: 'assistanceResolvedCount', label: "Assistances résolues" },
];

type TicketRow = {
  created_by: string | null;
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE';
  duration_minutes: number | null;
  created_at: string | null;
  resolved_at: string | null;
};

function toHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

/**
 * Calcule la durée d'un ticket d'assistance en minutes.
 * 
 * IMPORTANT: Pour les tickets d'assistance, on utilise UNIQUEMENT duration_minutes
 * car le calcul depuis created_at/resolved_at peut donner des durées aberrantes
 * (ex: ticket créé en janvier et résolu en décembre = ~8000h).
 * 
 * Les agents renseignent manuellement duration_minutes lors de la création.
 */
function safeMinutes(ticket: Pick<TicketRow, 'duration_minutes' | 'created_at' | 'resolved_at'>): number {
  // Utiliser uniquement duration_minutes si disponible et valide
  if (ticket.duration_minutes && ticket.duration_minutes > 0) {
    // Limiter à 8h max (480 minutes) pour éviter les erreurs de saisie
    return Math.min(ticket.duration_minutes, 480);
  }
  // Si pas de duration_minutes, retourner 0 (ne pas calculer depuis les dates)
  return 0;
}

function normalize(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((value / max) * 100);
}

export const getSupportAgentsRadarStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 6,
    includeOld: boolean = false
  ): Promise<SupportAgentsRadarStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1) Agents Support (uniquement role=agent)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('department', 'Support')
        .eq('role', 'agent');
      if (profilesError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[getSupportAgentsRadarStats] profilesError:', profilesError);
        }
        return null;
      }

      const agentIds = (profiles ?? []).map((p) => p.id);
      if (agentIds.length === 0) {
        return { dimensions: DIMENSIONS, agents: [], chartData: [], limit };
      }

      // 2) Tickets créés sur la période par ces agents (produit filtré)
      // IMPORTANT: Pagination nécessaire car Supabase limite à 1000 résultats par requête
      const tickets: TicketRow[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('tickets')
          .select('created_by, ticket_type, duration_minutes, created_at, resolved_at')
          .eq('product_id', productId)
          .in('created_by', agentIds)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd);
        
        if (!includeOld) {
          query = query.eq('old', false);
        }
        
        const { data: page, error: ticketsError } = await query
          .range(offset, offset + pageSize - 1);
        if (ticketsError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('[getSupportAgentsRadarStats] ticketsError:', ticketsError);
          }
          return null;
        }

        if (page && page.length > 0) {
          tickets.push(...page);
          offset += pageSize;
          hasMore = page.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      const nameById = new Map<string, string>(
        (profiles ?? []).map((p) => [p.id, p.full_name ?? p.email ?? 'Agent'])
      );

      const statsByAgent = new Map<string, SupportAgentRadarRow>();
      agentIds.forEach((id) => {
        statsByAgent.set(id, {
          agentId: id,
          agentName: nameById.get(id) ?? 'Agent',
          values: {
            totalTicketsCreated: 0,
            assistanceHours: 0,
            assistanceCount: 0,
            assistanceResolvedCount: 0,
          },
        });
      });

      tickets.forEach((t) => {
        if (!t.created_by) return;
        const row = statsByAgent.get(t.created_by);
        if (!row) return;

        row.values.totalTicketsCreated += 1;

        if (t.ticket_type === 'ASSISTANCE') {
          row.values.assistanceCount += 1;
          row.values.assistanceHours += toHours(safeMinutes(t));
          if (t.resolved_at) row.values.assistanceResolvedCount += 1;
        }
      });

      // 3) Garder un top N agents (lisibilité radar) : tri par totalTicketsCreated
      const agents = Array.from(statsByAgent.values())
        .sort((a, b) => b.values.totalTicketsCreated - a.values.totalTicketsCreated)
        .slice(0, limit);

      // 4) Normaliser par dimension (0-100)
      const maxByDim: Record<SupportAgentRadarDimension, number> = {
        totalTicketsCreated: 0,
        assistanceHours: 0,
        assistanceCount: 0,
        assistanceResolvedCount: 0,
      };

      agents.forEach((a) => {
        (Object.keys(maxByDim) as SupportAgentRadarDimension[]).forEach((k) => {
          maxByDim[k] = Math.max(maxByDim[k], a.values[k]);
        });
      });

      // Data Recharts : une ligne par dimension, une colonne par agentId (valeur normalisée)
      const chartData = DIMENSIONS.map((dim) => {
        const row: Record<string, string | number> = { subject: dim.label };
        agents.forEach((a) => {
          row[a.agentId] = normalize(a.values[dim.key], maxByDim[dim.key]);
        });
        return row;
      });

      return { dimensions: DIMENSIONS, agents, chartData, limit };
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[getSupportAgentsRadarStats] Unexpected error:', e);
      }
      return null;
    }
  }
);



