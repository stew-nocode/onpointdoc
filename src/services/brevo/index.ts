/**
 * Exports des services Brevo Email Marketing
 */

// Client API
export { BrevoClient, getBrevoClient, createBrevoClient } from './client';

// Gestion des campagnes
export {
  syncCampaignFromBrevo,
  syncAllCampaignsFromBrevo,
  getCampaigns,
  getCampaignById,
  getCampaignByBrevoId,
  refreshCampaignStats,
  getCampaignStatistics
} from './campaigns';
