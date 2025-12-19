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

function safeMinutes(ticket: Pick<TicketRow, 'duration_minutes' | 'created_at' | 'resolved_at'>): number {
  if (ticket.duration_minutes && ticket.duration_minutes > 0) return ticket.duration_minutes;
  if (!ticket.created_at || !ticket.resolved_at) return 0;
  const created = new Date(ticket.created_at).getTime();
  const resolved = new Date(ticket.resolved_at).getTime();
  const diff = Math.round((resolved - created) / (1000 * 60));
  return Math.max(0, diff);
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
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select(
          // ✅ Joins explicites (évite les problèmes d'inférence FK)
          'company_id, ticket_type, module_id, duration_minutes, created_at, resolved_at, company:companies!tickets_company_id_fkey(name), module:modules!tickets_module_id_fkey(name)'
        )
        .eq('product_id', productId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .not('company_id', 'is', null);

      if (error) {
        console.error('[getCompaniesCardsStats] ticketsError:', error);
        return null;
      }

      if (!tickets || tickets.length === 0) {
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
        const module = Array.isArray(t.module) ? t.module[0] : t.module;
        const moduleName = module?.name ?? null;
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


