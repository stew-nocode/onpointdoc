/**
 * Service de statistiques des résultats de campagnes emails
 * 
 * @description
 * Fournit les données pour le Horizontal Stacked Bar Chart
 * montrant les performances des campagnes emails (Envoyés | Ouverts | Cliqués).
 * 
 * Soumis aux filtres globaux (période).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour les données d'une campagne
 */
export type CampaignResultData = {
  /** ID de la campagne */
  campaignId: string;
  /** Nom de la campagne */
  campaignName: string;
  /** Nombre d'emails envoyés */
  sent: number;
  /** Nombre d'ouvertures uniques */
  opened: number;
  /** Nombre de clics uniques */
  clicked: number;
  /** Total (pour tri) */
  total: number;
};

/**
 * Type des statistiques de résultats de campagnes
 */
export type CampaignsResultsStats = {
  /** Données par campagne (triées par total décroissant) */
  data: CampaignResultData[];
  /** Nombre total de campagnes */
  campaignCount: number;
  /** Total d'emails envoyés */
  totalSent: number;
  /** Limite appliquée (top N) */
  limit: number;
};

/**
 * Récupère les statistiques de résultats de campagnes emails
 * 
 * @param periodStart - Date de début (ISO string)
 * @param periodEnd - Date de fin (ISO string)
 * @param limit - Nombre max de campagnes à retourner (défaut: 10)
 * @returns Statistiques par campagne ou null en cas d'erreur
 */
export const getCampaignsResultsStats = cache(
  async (
    periodStart: string,
    periodEnd: string,
    limit: number = 10
  ): Promise<CampaignsResultsStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // Récupérer les campagnes de la période avec leurs statistiques
      const { data: campaigns, error } = await supabase
        .from('brevo_email_campaigns')
        .select('id, campaign_name, emails_sent, unique_opens, unique_clicks, sent_at, status')
        .not('sent_at', 'is', null)
        .gte('sent_at', periodStart)
        .lte('sent_at', periodEnd)
        .eq('status', 'sent')
        .order('emails_sent', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[getCampaignsResultsStats] Error fetching campaigns:', error);
        return null;
      }

      if (!campaigns || campaigns.length === 0) {
        return {
          data: [],
          campaignCount: 0,
          totalSent: 0,
          limit,
        };
      }

      // Transformer les données pour le chart
      const data: CampaignResultData[] = campaigns.map((campaign: any) => {
        const sent = Number(campaign.emails_sent) || 0;
        const opened = Number(campaign.unique_opens) || 0;
        const clicked = Number(campaign.unique_clicks) || 0;
        
        return {
          campaignId: campaign.id,
          campaignName: campaign.campaign_name || 'Sans nom',
          sent,
          opened,
          clicked,
          total: sent,
        };
      });

      // Calculer les totaux
      const totalSent = data.reduce((sum, c) => sum + c.sent, 0);

      console.log(
        `[getCampaignsResultsStats] Found ${data.length} campaigns, ${totalSent} emails sent`
      );

      return {
        data,
        campaignCount: data.length,
        totalSent,
        limit,
      };
    } catch (error) {
      console.error('[getCampaignsResultsStats] Unexpected error:', error);
      return null;
    }
  }
);

