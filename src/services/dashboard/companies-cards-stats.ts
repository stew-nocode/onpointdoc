/**
 * Statistiques des cartes Entreprises (Support) sur la période filtrée.
 *
 * KPI :
 * - Total tickets
 * - Assistances (nb)
 * - Temps assistance (heures)
 * - BUGs signalés (nb)
 *
 * + Tags : top modules par entreprise (max 6 stockés, on affiche 2 + +N)
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CompanyCardStats = {
  companyId: string;
  companyName: string;
  isActive: boolean;
  moduleNames: string[];
  totalTickets: number;
  assistanceCount: number;
  assistanceHours: number;
  bugsReported: number;
};

export type CompaniesCardsStats = {
  data: CompanyCardStats[];
  limit: number;
};

type TicketRow = {
  company_id: string | null;
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE';
  module_id: string | null;
  duration_minutes: number | null;
  created_at: string | null;
  resolved_at: string | null;
  company?: { name: string } | null;
  module?: { name: string | null } | null;
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
function safeMinutes(ticket: Pick<TicketRow, 'duration_minutes' | 'created_at' | 'resolved_at'>): number {
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

export const getCompaniesCardsStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 10
  ): Promise<CompaniesCardsStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // IMPORTANT: Pagination nécessaire car Supabase limite à 1000 résultats par requête
      const tickets: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: page, error } = await supabase
          .from('tickets')
          .select(
            // ✅ Joins explicites (évite les problèmes d'inférence FK)
            'company_id, ticket_type, module_id, duration_minutes, created_at, resolved_at, company:companies!tickets_company_id_fkey(name), module:modules!tickets_module_id_fkey(name)'
          )
          .eq('product_id', productId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd)
          .not('company_id', 'is', null)
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error('[getCompaniesCardsStats] ticketsError:', error);
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

      if (tickets.length === 0) {
        return { data: [], limit };
      }

      const byCompany = new Map<
        string,
        {
          name: string;
          totalTickets: number;
          assistanceCount: number;
          assistanceMinutes: number;
          bugsReported: number;
          modules: Map<string, number>;
        }
      >();

      (tickets as any[]).forEach((t) => {
        if (!t.company_id) return;
        const companyId = t.company_id;
        // Handle company being array or object
        const company = Array.isArray(t.company) ? t.company[0] : t.company;
        const companyName = company?.name ?? 'Entreprise';

        if (!byCompany.has(companyId)) {
          byCompany.set(companyId, {
            name: companyName,
            totalTickets: 0,
            assistanceCount: 0,
            assistanceMinutes: 0,
            bugsReported: 0,
            modules: new Map(),
          });
        }

        const entry = byCompany.get(companyId)!;
        entry.totalTickets += 1;

        if (t.ticket_type === 'ASSISTANCE') {
          entry.assistanceCount += 1;
          entry.assistanceMinutes += safeMinutes(t);
        }
        if (t.ticket_type === 'BUG') {
          entry.bugsReported += 1;
        }

        // Handle module being array or object
        const ticketModule = Array.isArray(t.module) ? t.module[0] : t.module;
        const moduleName = ticketModule?.name ?? null;
        if (moduleName) {
          entry.modules.set(moduleName, (entry.modules.get(moduleName) ?? 0) + 1);
        }
      });

      const data: CompanyCardStats[] = Array.from(byCompany.entries())
        .map(([companyId, v]) => {
          const moduleNames = Array.from(v.modules.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name]) => name);

          return {
            companyId,
            companyName: v.name,
            isActive: v.totalTickets > 0,
            moduleNames,
            totalTickets: v.totalTickets,
            assistanceCount: v.assistanceCount,
            assistanceHours: toHours(v.assistanceMinutes),
            bugsReported: v.bugsReported,
          };
        })
        .sort((a, b) => b.totalTickets - a.totalTickets)
        .slice(0, limit);

      return { data, limit };
    } catch (e) {
      console.error('[getCompaniesCardsStats] Unexpected error:', e);
      return null;
    }
  }
);


