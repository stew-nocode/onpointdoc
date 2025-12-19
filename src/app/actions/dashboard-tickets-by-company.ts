'use server';

import { getTicketsByCompanyDistribution } from '@/services/dashboard/tickets-by-company-distribution';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError, isApplicationError } from '@/lib/errors/types';

/**
 * Schéma de validation pour les paramètres de répartition par entreprise
 */
const ticketsByCompanyParamsSchema = z.object({
  period: z.string(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  ticketTypes: z.array(z.enum(['BUG', 'REQ', 'ASSISTANCE'])).optional(),
});

/**
 * Server Action pour récupérer la répartition des tickets par entreprise
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (récupérer la répartition par entreprise)
 * - Validation Zod automatique des paramètres
 * - Authentification vérifiée côté serveur
 * - Type-safe end-to-end
 * 
 * @param params - Paramètres de récupération (period, ticketTypes)
 * @returns Données de répartition par entreprise
 * @throws Error si l'authentification échoue ou si les paramètres sont invalides
 */
export async function getTicketsByCompanyDistributionAction(
  params: {
    period: string;
    periodStart?: string;
    periodEnd?: string;
    ticketTypes?: ('BUG' | 'REQ' | 'ASSISTANCE')[];
  }
) {
  // 1. Vérifier l'authentification
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw createError.unauthorized('Non authentifié', {
      context: 'getTicketsByCompanyDistributionAction',
    });
  }

  // 2. Valider les paramètres avec Zod
  const validationResult = ticketsByCompanyParamsSchema.safeParse({
    period: params.period,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    ticketTypes: params.ticketTypes,
  });

  if (!validationResult.success) {
    throw createError.validationError('Paramètres invalides', {
      errors: validationResult.error.issues,
      context: 'getTicketsByCompanyDistributionAction',
      receivedParams: params,
    });
  }

  const { period, periodStart, periodEnd, ticketTypes } = validationResult.data;

  // 3. Logger en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('[TicketsByCompanyDistribution Action] Request params:', {
      period,
      periodStart,
      periodEnd,
      ticketTypes,
      userId: user.id,
    });
  }

  try {
    // 4. Validation conditionnelle : si period est 'custom', periodStart et periodEnd sont requis
    if (period === 'custom' && (!periodStart || !periodEnd)) {
      throw createError.validationError(
        'Les dates personnalisées sont requises pour la période "custom"',
        {
          context: 'getTicketsByCompanyDistributionAction',
          period,
          hasPeriodStart: !!periodStart,
          hasPeriodEnd: !!periodEnd,
        }
      );
    }

    // 5. Récupérer les données via le service
    const data = await getTicketsByCompanyDistribution(
      period,
      periodStart,
      periodEnd,
      ticketTypes
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('[TicketsByCompanyDistribution Action] Success:', {
        companiesCount: data.distribution.length,
        totalTickets: data.distribution.reduce((sum, c) => sum + c.ticketCount, 0),
      });
    }

    return data;
  } catch (error) {
    console.error('[TicketsByCompanyDistribution Action] Error:', error);

    if (isApplicationError(error)) {
      throw error;
    }

    throw createError.internalError(
      'Erreur lors de la récupération de la répartition par entreprise',
      error instanceof Error ? error : undefined,
      {
        context: 'getTicketsByCompanyDistributionAction',
      }
    );
  }
}

