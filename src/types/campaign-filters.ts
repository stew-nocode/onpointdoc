/**
 * Types pour les filtres de campagnes email
 * 
 * Définit les filtres rapides disponibles pour les campagnes email Brevo
 */

/**
 * Filtre rapide pour les campagnes email
 */
export type CampaignQuickFilter =
  | 'all'        // Toutes les campagnes
  | 'sent'       // Campagnes envoyées (status = 'sent')
  | 'draft'      // Brouillons (status = 'draft')
  | 'scheduled'; // Planifiées (status = 'scheduled')

