'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
import { syncAllCampaignsFromBrevo } from '@/services/brevo/campaigns';

/**
 * Résultat de la synchronisation des campagnes
 */
export interface SyncCampaignsResult {
  success: boolean;
  message: string;
  synced: number;
  errors: number;
  total: number;
}

/**
 * Server Action pour synchroniser les campagnes Brevo vers Supabase
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (synchroniser les campagnes)
 * - Utilise directement le service syncAllCampaignsFromBrevo
 * - Vérifie les permissions (admin ou direction)
 * - Utilise revalidatePath pour rafraîchir la page après synchronisation
 * - Types explicites pour tous les paramètres et retours
 * - Gestion d'erreur centralisée avec ApplicationError
 * 
 * Optimisation v2 :
 * - Pagination automatique pour gérer des milliers de campagnes
 * - 1000 campagnes = 2 appels API seulement (au lieu de 1001)
 * - Insertion par batch en DB
 * 
 * @param maxCampaigns - Nombre max de campagnes (optionnel, défaut: toutes)
 * @returns Résultat de la synchronisation avec nombre de campagnes synchronisées
 * @throws ApplicationError si l'utilisateur n'est pas authentifié ou n'a pas les permissions
 */
export async function syncCampaignsAction(
  maxCampaigns?: number
): Promise<SyncCampaignsResult> {
  const supabase = await createSupabaseServerClient();

  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError.unauthorized('Non authentifié');
  }

  // Vérifier les permissions (admin ou direction seulement)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_uid', user.id)
    .single();

  if (!profile?.role || !['admin', 'direction'].includes(profile.role)) {
    throw createError.forbidden(
      'Seuls les administrateurs et la direction peuvent synchroniser les campagnes'
    );
  }

  try {
    // Lancer la synchronisation (pagination automatique)
    const result = await syncAllCampaignsFromBrevo(maxCampaigns);

    // ✅ Revalider la page email marketing pour afficher les nouvelles campagnes
    revalidatePath('/marketing/email');
    
    // Revalider aussi les KPIs qui dépendent des campagnes
    revalidatePath('/marketing/email', 'layout');

    return {
      success: true,
      message: `✅ ${result.synced}/${result.total} campagnes synchronisées${result.errors > 0 ? ` (${result.errors} erreurs)` : ''}`,
      synced: result.synced,
      errors: result.errors,
      total: result.total
    };
  } catch (error) {
    // Logger l'erreur complète pour le débogage
    console.error('[ERROR] Erreur dans syncCampaignsAction:');
    console.error('[ERROR] Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[ERROR] Message:', error instanceof Error ? error.message : String(error));
    console.error('[ERROR] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    // Si c'est une ApplicationError, extraire les détails
    if (error instanceof Error && 'code' in error) {
      console.error('[ERROR] Code:', (error as any).code);
      console.error('[ERROR] StatusCode:', (error as any).statusCode);
      if ((error as any).details) {
        console.error('[ERROR] Details:', (error as any).details);
      }
    }
    
    // Propager l'erreur avec un message plus clair
    if (error instanceof Error && 'code' in error) {
      // C'est déjà une ApplicationError, la propager telle quelle
      throw error;
    }
    
    // Sinon, créer une ApplicationError avec le message original
    throw createError.internalError(
      `Erreur lors de la synchronisation : ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      error instanceof Error ? error : undefined
    );
  }
}

