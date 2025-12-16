/**
 * Service de gestion des campagnes email Brevo
 *
 * Gère la synchronisation entre Brevo et Supabase
 * Pattern similaire à src/services/jira/sync.ts
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBrevoClient } from './client';
import { createError } from '@/lib/errors/types';
import type { Json } from '@/types/database.types';
import type {
  BrevoEmailCampaign,
  BrevoEmailCampaignInsert,
  BrevoCampaignResponse,
  CampaignFilters,
  CampaignsPaginatedResult
} from '@/types/brevo';

/**
 * Synchronise une campagne depuis Brevo vers Supabase
 *
 * @param brevoCampaignId - ID de la campagne dans Brevo
 * @returns La campagne synchronisée dans Supabase
 */
export async function syncCampaignFromBrevo(
  brevoCampaignId: number
): Promise<BrevoEmailCampaign> {
  const supabase = await createSupabaseServerClient();
  const brevoClient = getBrevoClient();

  try {
    // Récupérer les données depuis Brevo
    console.log(`[SYNC] Récupération de la campagne Brevo ${brevoCampaignId}...`);
    const brevoCampaign = await brevoClient.getCampaign(brevoCampaignId);
    console.log(`[SYNC] Campagne ${brevoCampaignId} récupérée: ${brevoCampaign.name}`);
    console.log(`[SYNC] Statut: ${brevoCampaign.status}, Statistiques disponibles: ${!!brevoCampaign.statistics}`);

    // Gérer les statistiques qui peuvent être manquantes (campagnes draft, etc.)
    // Note: Brevo retourne les stats dans statistics.globalStats, pas directement dans statistics
    const globalStats = (brevoCampaign.statistics as any)?.globalStats || {};
    const stats = {
      sent: globalStats.sent ?? 0,
      delivered: globalStats.delivered ?? 0,
      uniqueOpens: globalStats.uniqueViews ?? globalStats.uniqueOpens ?? 0,
      openRate: globalStats.opensRate ?? globalStats.openRate ?? 0,
      uniqueClicks: globalStats.uniqueClicks ?? 0,
      clickRate: globalStats.clickRate ?? 0,
      clickers: globalStats.clickers ?? 0,
      hardBounces: globalStats.hardBounces ?? 0,
      softBounces: globalStats.softBounces ?? 0,
      complaints: globalStats.complaints ?? 0,
      unsubscriptions: globalStats.unsubscriptions ?? 0
    };

    // Mapper vers le format Supabase avec gestion des valeurs nulles/undefined
    const campaignData: BrevoEmailCampaignInsert = {
      brevo_campaign_id: brevoCampaign.id,
      campaign_name: brevoCampaign.name,
      email_subject: brevoCampaign.subject || null,
      status: brevoCampaign.status,
      campaign_type: brevoCampaign.type || 'classic',
      created_at: brevoCampaign.createdAt,
      updated_at: brevoCampaign.modifiedAt || brevoCampaign.createdAt || null,
      sent_at: brevoCampaign.sentDate || null,
      scheduled_at: brevoCampaign.scheduledAt || null,
      sender_name: brevoCampaign.sender?.name || null,
      sender_email: brevoCampaign.sender?.email || null,
      sender_id: brevoCampaign.sender?.id || null,
      // Statistiques avec valeurs par défaut si manquantes
      emails_sent: stats.sent ?? 0,
      emails_delivered: stats.delivered ?? 0,
      unique_opens: stats.uniqueOpens ?? 0,
      open_rate: stats.openRate ?? 0,
      unique_clicks: stats.uniqueClicks ?? 0,
      click_rate: stats.clickRate ?? 0,
      clickers_count: stats.clickers ?? 0,
      hard_bounces: stats.hardBounces ?? 0,
      soft_bounces: stats.softBounces ?? 0,
      spam_complaints: stats.complaints ?? 0,
      unsubscribes: stats.unsubscriptions ?? 0,
      total_recipients: brevoCampaign.recipients?.listIds?.length || 0,
      recipient_lists: brevoCampaign.recipients?.listIds || null,
      ab_test_config: brevoCampaign.abTesting ? (brevoCampaign.abTesting as unknown as Json) : null,
      last_synced_at: new Date().toISOString()
    };

    // Logger les données pour le débogage
    console.log(`[SYNC] Données à insérer pour campagne ${brevoCampaignId}:`, {
      brevo_campaign_id: campaignData.brevo_campaign_id,
      campaign_name: campaignData.campaign_name,
      status: campaignData.status,
      emails_sent: campaignData.emails_sent,
      has_statistics: !!brevoCampaign.statistics
    });

    // Upsert dans Supabase (create ou update)
    const { data, error } = await supabase
      .from('brevo_email_campaigns')
      .upsert(campaignData, {
        onConflict: 'brevo_campaign_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error(`[SYNC ERROR] Erreur Supabase pour campagne ${brevoCampaignId}:`);
      console.error('[SYNC ERROR] Code:', error.code);
      console.error('[SYNC ERROR] Message:', error.message);
      console.error('[SYNC ERROR] Details:', error.details);
      console.error('[SYNC ERROR] Hint:', error.hint);
      console.error('[SYNC ERROR] Données tentées:', JSON.stringify(campaignData, null, 2));
      
      throw createError.internalError(
        `Erreur lors de la synchronisation de la campagne ${brevoCampaignId}: ${error.message} (Code: ${error.code})`,
        error
      );
    }

    console.log(`[SYNC] Campagne ${brevoCampaignId} synchronisée avec succès`);
    return data;
  } catch (error) {
    // Logger l'erreur complète
    console.error(`[SYNC ERROR] Échec de synchronisation campagne ${brevoCampaignId}:`);
    console.error('[SYNC ERROR] Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[SYNC ERROR] Message:', error instanceof Error ? error.message : String(error));
    
    // Si c'est une ApplicationError, extraire les détails
    if (error instanceof Error && 'code' in error) {
      console.error('[SYNC ERROR] Code:', (error as any).code);
      console.error('[SYNC ERROR] StatusCode:', (error as any).statusCode);
    }
    
    throw createError.internalError(
      `Échec de synchronisation de la campagne ${brevoCampaignId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Taille max par page pour l'API Brevo (limite imposée par Brevo = 100)
 */
const BREVO_PAGE_SIZE = 100;

/**
 * Taille max par batch pour l'insertion Supabase (évite les timeout)
 */
const DB_BATCH_SIZE = 100;

/**
 * Convertit une campagne Brevo en format Supabase
 */
function mapBrevoCampaignToSupabase(brevoCampaign: BrevoCampaignResponse): BrevoEmailCampaignInsert {
  const globalStats = (brevoCampaign.statistics as any)?.globalStats || {};
  
  // Debug: logger les stats pour la première campagne
  if (brevoCampaign.name) {
    console.log(`[MAPPING] ${brevoCampaign.name}: sent=${globalStats.sent}, delivered=${globalStats.delivered}, uniqueViews=${globalStats.uniqueViews}`);
  }
  
  return {
    brevo_campaign_id: brevoCampaign.id,
    campaign_name: brevoCampaign.name,
    email_subject: brevoCampaign.subject || null,
    status: brevoCampaign.status,
    campaign_type: brevoCampaign.type || 'classic',
    created_at: brevoCampaign.createdAt,
    updated_at: brevoCampaign.modifiedAt || brevoCampaign.createdAt || null,
    sent_at: brevoCampaign.sentDate || null,
    scheduled_at: brevoCampaign.scheduledAt || null,
    sender_name: brevoCampaign.sender?.name || null,
    sender_email: brevoCampaign.sender?.email || null,
    sender_id: brevoCampaign.sender?.id || null,
    // Stats depuis globalStats (structure Brevo confirmée)
    emails_sent: globalStats.sent ?? 0,
    emails_delivered: globalStats.delivered ?? 0,
    unique_opens: globalStats.uniqueViews ?? globalStats.uniqueOpens ?? 0,
    open_rate: globalStats.opensRate ?? 0, // opensRate = % réel (0-100), PAS viewed qui est un compteur!
    unique_clicks: globalStats.uniqueClicks ?? 0,
    // Calcul du taux de clics : clics uniques / emails délivrés * 100
    click_rate: globalStats.delivered > 0 
      ? Math.min(100, Math.round((globalStats.uniqueClicks ?? 0) / globalStats.delivered * 100 * 100) / 100)
      : 0,
    clickers_count: globalStats.clickers ?? 0, // nombre de cliqueurs
    hard_bounces: globalStats.hardBounces ?? 0,
    soft_bounces: globalStats.softBounces ?? 0,
    spam_complaints: globalStats.complaints ?? 0,
    unsubscribes: globalStats.unsubscriptions ?? 0,
    total_recipients: globalStats.sent ?? brevoCampaign.recipients?.listIds?.length ?? 0,
    recipient_lists: brevoCampaign.recipients?.listIds || null,
    ab_test_config: brevoCampaign.abTesting ? (brevoCampaign.abTesting as unknown as Json) : null,
    last_synced_at: new Date().toISOString()
  };
}

/**
 * Synchronise toutes les campagnes depuis Brevo avec pagination automatique
 *
 * Optimisation :
 * - Pagination automatique par lots de 500 (limite Brevo)
 * - 1000 campagnes = 2 appels API seulement (au lieu de 1001 avant)
 * - Insertion par batch en DB pour éviter les timeout
 *
 * @param maxCampaigns - Nombre maximum de campagnes à synchroniser (défaut: toutes)
 * @returns Nombre de campagnes synchronisées et erreurs
 */
export async function syncAllCampaignsFromBrevo(
  maxCampaigns?: number
): Promise<{ synced: number; errors: number; total: number }> {
  const brevoClient = getBrevoClient();
  const supabase = await createSupabaseServerClient();

  let synced = 0;
  let errors = 0;
  let totalCampaigns = 0;
  const allCampaigns: BrevoEmailCampaignInsert[] = [];
  const errorDetails: Array<{ campaignId: number; error: string }> = [];

  // Types de campagnes à synchroniser (Brevo API supporte uniquement classic et trigger)
  const campaignTypes: Array<'classic' | 'trigger'> = ['classic', 'trigger'];

  try {
    console.log(`[SYNC] 🚀 Début de la synchronisation optimisée...`);
    console.log(`[SYNC] 📋 Types à synchroniser: ${campaignTypes.join(', ')}`);
    
    let totalApiCalls = 0;
    
    // Synchroniser chaque type de campagne
    for (const campaignType of campaignTypes) {
      let offset = 0;
      let hasMore = true;
      let pageNumber = 1;
      let typeTotal = 0;
      
      console.log(`[SYNC] 🔄 Synchronisation des campagnes "${campaignType}"...`);
      
      while (hasMore) {
        const pageSize = Math.min(BREVO_PAGE_SIZE, maxCampaigns ? maxCampaigns - allCampaigns.length : BREVO_PAGE_SIZE);
        
        if (pageSize <= 0) break;
        
        const response = await brevoClient.getCampaigns({ type: campaignType, limit: pageSize, offset });
        typeTotal = response.count || 0;
        totalApiCalls++;
        
        if (response.campaigns.length > 0) {
          console.log(`[SYNC] 📄 ${campaignType} page ${pageNumber}: ${response.campaigns.length} campagnes (total: ${typeTotal})`);
        }
        
        // Mapper les campagnes
        for (const brevoCampaign of response.campaigns) {
          try {
            allCampaigns.push(mapBrevoCampaignToSupabase(brevoCampaign));
          } catch (error) {
            errorDetails.push({
              campaignId: brevoCampaign.id,
              error: error instanceof Error ? error.message : String(error)
            });
            errors++;
          }
        }
        
        // Vérifier s'il y a plus de pages
        offset += response.campaigns.length;
        hasMore = response.campaigns.length === pageSize && 
                  offset < typeTotal &&
                  (!maxCampaigns || allCampaigns.length < maxCampaigns);
        pageNumber++;
      }
      
      totalCampaigns += typeTotal;
      
      if (typeTotal > 0) {
        console.log(`[SYNC] ✅ ${campaignType}: ${typeTotal} campagnes trouvées`);
      }
    }
    
    console.log(`[SYNC] ✨ ${totalApiCalls} appel(s) API pour ${allCampaigns.length} campagnes (total Brevo: ${totalCampaigns})`);
    
    // Insertion par batch en DB
    if (allCampaigns.length > 0) {
      console.log(`[SYNC] 💾 Insertion de ${allCampaigns.length} campagnes en base...`);
      
      for (let i = 0; i < allCampaigns.length; i += DB_BATCH_SIZE) {
        const batch = allCampaigns.slice(i, i + DB_BATCH_SIZE);
        const batchNumber = Math.floor(i / DB_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(allCampaigns.length / DB_BATCH_SIZE);
        
        if (totalBatches > 1) {
          console.log(`[SYNC] Batch ${batchNumber}/${totalBatches}: ${batch.length} campagnes...`);
        }
        
        const { error: upsertError } = await supabase
          .from('brevo_email_campaigns')
          .upsert(batch, {
            onConflict: 'brevo_campaign_id',
            ignoreDuplicates: false
          });
        
        if (upsertError) {
          console.error(`[SYNC ERROR] Batch ${batchNumber}: ${upsertError.message}`);
          errors += batch.length;
        } else {
          synced += batch.length;
        }
      }
      
      console.log(`[SYNC] ✅ ${synced} campagnes synchronisées avec succès !`);
    }
    
    if (errors > 0) {
      console.warn(`[SYNC] ⚠️ ${errors} erreurs rencontrées`);
    }

    console.log(`[SYNC] Synchronisation terminée: ${synced} réussies, ${errors} erreurs, ${totalCampaigns} total Brevo`);
    return { synced, errors, total: totalCampaigns };
  } catch (error) {
    console.error('[SYNC ERROR] Échec de synchronisation globale:');
    console.error('[SYNC ERROR] Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[SYNC ERROR] Message:', error instanceof Error ? error.message : String(error));
    
    throw createError.internalError(
      `Échec de synchronisation globale des campagnes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Récupère les campagnes depuis Supabase avec filtres et pagination
 *
 * @param filters - Filtres de recherche
 * @returns Résultat paginé
 */
export async function getCampaigns(
  filters?: CampaignFilters
): Promise<CampaignsPaginatedResult> {
  const supabase = await createSupabaseServerClient();

  try {
    // Construction de la requête de base
    let query = supabase
      .from('brevo_email_campaigns')
      .select('*', { count: 'exact' });

    // Filtres de statut
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    // Filtres de type
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        query = query.in('campaign_type', filters.type);
      } else {
        query = query.eq('campaign_type', filters.type);
      }
    }

    // Filtres de dates
    if (filters?.startDate) {
      query = query.gte('sent_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('sent_at', filters.endDate);
    }

    // Recherche par nom
    if (filters?.searchQuery) {
      query = query.ilike('campaign_name', `%${filters.searchQuery}%`);
    }

    // Tri
    const sortColumn = filters?.sort || 'sent_at';
    const sortOrder = filters?.order || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc', nullsFirst: false });

    // Pagination
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Exécuter la requête
    const { data, error, count } = await query;

    if (error) {
      throw createError.internalError(
        `Erreur lors de la récupération des campagnes: ${error.message}`
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      campaigns: data || [],
      totalCount,
      page: currentPage,
      limit,
      totalPages
    };
  } catch (error) {
    throw createError.internalError(
      'Échec de récupération des campagnes',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Récupère une campagne par son ID Supabase
 *
 * @param campaignId - ID UUID de la campagne dans Supabase
 * @returns La campagne ou null
 */
export async function getCampaignById(
  campaignId: string
): Promise<BrevoEmailCampaign | null> {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('brevo_email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw createError.internalError(
        `Erreur lors de la récupération de la campagne: ${error.message}`
      );
    }

    return data;
  } catch (error) {
    throw createError.internalError(
      `Échec de récupération de la campagne ${campaignId}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Récupère une campagne par son ID Brevo
 *
 * @param brevoCampaignId - ID de la campagne dans Brevo
 * @returns La campagne ou null
 */
export async function getCampaignByBrevoId(
  brevoCampaignId: number
): Promise<BrevoEmailCampaign | null> {
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('brevo_email_campaigns')
      .select('*')
      .eq('brevo_campaign_id', brevoCampaignId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw createError.internalError(
        `Erreur lors de la récupération de la campagne Brevo ${brevoCampaignId}: ${error.message}`
      );
    }

    return data;
  } catch (error) {
    throw createError.internalError(
      `Échec de récupération de la campagne Brevo ${brevoCampaignId}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Met à jour les statistiques d'une campagne depuis Brevo
 *
 * @param brevoCampaignId - ID de la campagne dans Brevo
 * @returns La campagne mise à jour
 */
export async function refreshCampaignStats(
  brevoCampaignId: number
): Promise<BrevoEmailCampaign> {
  // Simplement re-synchroniser la campagne depuis Brevo
  return syncCampaignFromBrevo(brevoCampaignId);
}

/**
 * Calcule les statistiques globales des campagnes
 *
 * @param filters - Filtres optionnels
 * @returns Statistiques agrégées
 */
export async function getCampaignStatistics(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string[];
}) {
  const supabase = await createSupabaseServerClient();

  try {
    let query = supabase
      .from('brevo_email_campaigns')
      .select('*');

    // Appliquer les filtres
    if (filters?.status) {
      query = query.in('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('sent_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('sent_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw createError.internalError(
        `Erreur lors du calcul des statistiques: ${error.message}`
      );
    }

    // Calculer les agrégats
    const campaigns = data || [];
    const totalCampaigns = campaigns.length;
    const totalSent = campaigns.reduce((sum, c) => sum + (c.emails_sent || 0), 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.emails_delivered || 0), 0);
    const totalOpens = campaigns.reduce((sum, c) => sum + (c.unique_opens || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.unique_clicks || 0), 0);
    const totalBounces = campaigns.reduce(
      (sum, c) => sum + (c.hard_bounces || 0) + (c.soft_bounces || 0),
      0
    );
    const totalUnsubscribes = campaigns.reduce((sum, c) => sum + (c.unsubscribes || 0), 0);

    // Calcul des taux moyens
    const avgOpenRate = totalCampaigns > 0
      ? campaigns.reduce((sum, c) => sum + (c.open_rate || 0), 0) / totalCampaigns
      : 0;

    const avgClickRate = totalCampaigns > 0
      ? campaigns.reduce((sum, c) => sum + (c.click_rate || 0), 0) / totalCampaigns
      : 0;

    const deliveryRate = totalSent > 0
      ? (totalDelivered / totalSent) * 100
      : 0;

    const bounceRate = totalSent > 0
      ? (totalBounces / totalSent) * 100
      : 0;

    return {
      totalCampaigns,
      totalSent,
      totalDelivered,
      totalOpens,
      totalClicks,
      totalBounces,
      totalUnsubscribes,
      avgOpenRate: Math.round(avgOpenRate * 100) / 100,
      avgClickRate: Math.round(avgClickRate * 100) / 100,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100
    };
  } catch (error) {
    throw createError.internalError(
      'Échec du calcul des statistiques',
      error instanceof Error ? error : undefined
    );
  }
}
