'use server';

import { getSupportEvolutionDataV2 } from '@/services/dashboard/support-evolution-data-v2';
import { supportEvolutionParamsSchema } from '@/lib/validators/dashboard-support-evolution';
import type { SupportEvolutionData } from '@/types/dashboard-support-evolution';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError, isApplicationError } from '@/lib/errors/types';

/**
 * Server Action pour récupérer les données d'évolution Support
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (récupérer les données d'évolution)
 * - Validation Zod automatique des paramètres
 * - Authentification vérifiée côté serveur
 * - Type-safe end-to-end
 * 
 * ⚠️ IMPORTANT : Cette Server Action est SPÉCIFIQUE au département Support.
 * Pour les autres départements, créer des Server Actions similaires.
 * 
 * @param params - Paramètres de récupération (period, dimensions, agents)
 * @returns Données d'évolution Support
 * @throws Error si l'authentification échoue ou si les paramètres sont invalides
 */
export async function getSupportEvolutionDataAction(
  params: {
    period: string;
    dimensions?: string[];
    agents?: string[];
  }
): Promise<SupportEvolutionData> {
  // 1. Vérifier l'authentification
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw createError.unauthorized('Non authentifié', {
      context: 'getSupportEvolutionDataAction',
    });
  }

  // 2. Valider les paramètres avec Zod
  const validationResult = supportEvolutionParamsSchema.safeParse({
    period: params.period,
    dimensions: params.dimensions,
    agents: params.agents,
  });

  if (!validationResult.success) {
    throw createError.validationError('Paramètres invalides', {
      errors: validationResult.error.errors,
      context: 'getSupportEvolutionDataAction',
    });
  }

  const { period, dimensions, agents } = validationResult.data;

  // 3. Logger en développement
  if (process.env.NODE_ENV === 'development') {
    console.log('[SupportEvolution Action] Request params:', {
      period,
      dimensions,
      agents,
      userId: user.id,
    });
  }

  try {
    // 4. Récupérer les données via le service
    const data = await getSupportEvolutionDataV2(period, dimensions, agents);

    if (process.env.NODE_ENV === 'development') {
      console.log('[SupportEvolution Action] Success:', {
        dataPointsCount: data?.data?.length || 0,
        agentsCount: data?.agents?.length || 0,
      });
    }

    return data;
  } catch (error) {
    // 5. Logger l'erreur et la propager
    console.error('[SupportEvolution Action] Error:', error);
    
    if (isApplicationError(error)) {
      // Si c'est déjà une ApplicationError, la propager
      throw error;
    }
    
    // Sinon, créer une erreur générique
    throw createError.internalError(
      error instanceof Error ? error.message : 'Erreur lors du chargement des données',
      error instanceof Error ? error : undefined,
      {
        context: 'getSupportEvolutionDataAction',
      }
    );
  }
}

