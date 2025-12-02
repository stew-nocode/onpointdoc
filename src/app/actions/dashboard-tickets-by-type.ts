'use server';

import { getTicketsByTypeDistribution } from '@/services/dashboard/tickets-by-type-distribution';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';

/**
 * Schéma de validation pour les paramètres de répartition par type
 */
const ticketsByTypeParamsSchema = z.object({
  period: z.string(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  agents: z.array(z.string().uuid()).optional(),
});

/**
 * Server Action pour récupérer la répartition des tickets par type
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (récupérer la répartition par type)
 * - Validation Zod automatique des paramètres
 * - Authentification vérifiée côté serveur
 * - Type-safe end-to-end
 * 
 * @param params - Paramètres de récupération (period, agents)
 * @returns Données de répartition par type
 * @throws Error si l'authentification échoue ou si les paramètres sont invalides
 */
export async function getTicketsByTypeDistributionAction(
  params: {
    period: string;
    periodStart?: string;
    periodEnd?: string;
    agents?: string[];
  }
) {
  // 1. Vérifier l'authentification
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw createError.unauthorized('Non authentifié', {
      context: 'getTicketsByTypeDistributionAction',
    });
  }

  // 2. Valider les paramètres avec Zod
  const validationResult = ticketsByTypeParamsSchema.safeParse({
    period: params.period,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    agents: params.agents,
  });

  if (!validationResult.success) {
    throw createError.validationError('Paramètres invalides', {
      errors: validationResult.error.errors,
      context: 'getTicketsByTypeDistributionAction',
      receivedParams: params,
    });
  }

  const { period, periodStart, periodEnd, agents } = validationResult.data;

  // 3. Logger en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('[TicketsByTypeDistribution Action] Request params:', {
      period,
      periodStart,
      periodEnd,
      agents,
      userId: user.id,
    });
  }

  try {
    // 4. Validation conditionnelle : si period est 'custom', periodStart et periodEnd sont requis
    if (period === 'custom' && (!periodStart || !periodEnd)) {
      throw createError.validationError(
        'Les dates personnalisées sont requises pour la période "custom"',
        {
          context: 'getTicketsByTypeDistributionAction',
          period,
          hasPeriodStart: !!periodStart,
          hasPeriodEnd: !!periodEnd,
        }
      );
    }

    // 5. Récupérer les données via le service
    const data = await getTicketsByTypeDistribution(
      period,
      periodStart,
      periodEnd,
      agents
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('[TicketsByTypeDistribution Action] Success:', {
        distribution: data.distribution,
        agentsCount: data.agents.length,
      });
    }

    return data;
  } catch (error) {
    console.error('[TicketsByTypeDistribution Action] Error:', error);

    if (createError.isApplicationError(error)) {
      throw error;
    }

    throw createError.internalError('Erreur lors de la récupération de la répartition par type', {
      context: 'getTicketsByTypeDistributionAction',
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}


