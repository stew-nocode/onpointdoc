/**
 * Brevo Email Marketing Types
 *
 * Types pour l'intégration avec l'API Brevo (anciennement Sendinblue)
 * et les tables Supabase associées.
 */

import type { Database } from './database.types';

// ============================================================================
// TYPES SUPABASE (depuis database.types.ts)
// ============================================================================

export type BrevoEmailCampaign = Database['public']['Tables']['brevo_email_campaigns']['Row'];
export type BrevoEmailCampaignInsert = Database['public']['Tables']['brevo_email_campaigns']['Insert'];
export type BrevoEmailCampaignUpdate = Database['public']['Tables']['brevo_email_campaigns']['Update'];

export type BrevoConfig = Database['public']['Tables']['brevo_config']['Row'];
export type BrevoConfigInsert = Database['public']['Tables']['brevo_config']['Insert'];
export type BrevoConfigUpdate = Database['public']['Tables']['brevo_config']['Update'];

// ============================================================================
// TYPES BREVO API (Réponses API v3)
// ============================================================================

/**
 * Statut d'une campagne Brevo
 */
export type BrevoCampaignStatus = 'draft' | 'sent' | 'scheduled' | 'suspended' | 'queued' | 'archive';

/**
 * Type de campagne Brevo
 */
export type BrevoCampaignType = 'classic' | 'trigger' | 'automated';

/**
 * Statistiques d'une campagne email Brevo
 *
 * Source: https://developers.brevo.com/reference/getemailcampaigns-1
 *
 * Note: Depuis février 2025, openRate inclut Apple Mail Privacy Protection
 */
export interface BrevoCampaignStatistics {
  /** Nombre total d'emails envoyés */
  sent: number;

  /** Nombre d'emails délivrés avec succès */
  delivered: number;

  /** Nombre d'ouvertures uniques */
  uniqueOpens: number;

  /** Nombre total d'ouvertures (incluant multiples par destinataire) */
  totalOpens?: number;

  /** Taux d'ouverture en pourcentage */
  openRate: number;

  /** Nombre de clics uniques */
  uniqueClicks: number;

  /** Nombre total de clics */
  totalClicks?: number;

  /** Taux de clic en pourcentage */
  clickRate: number;

  /** Nombre de personnes ayant cliqué */
  clickers: number;

  /** Nombre de hard bounces (échecs permanents) */
  hardBounces: number;

  /** Nombre de soft bounces (échecs temporaires) */
  softBounces: number;

  /** Nombre de plaintes spam */
  complaints: number;

  /** Nombre de désabonnements */
  unsubscriptions: number;

  /** Nombre d'ouvertures trackables (fiables) */
  trackableViews?: number;

  /** Ouvertures estimées (calcul plus précis) */
  estimatedViews?: number;

  /** Emails transférés */
  forwarded?: number;
}

/**
 * Informations sender d'une campagne
 */
export interface BrevoCampaignSender {
  /** Nom de l'expéditeur */
  name: string;

  /** Email de l'expéditeur */
  email: string;

  /** ID de l'expéditeur dans Brevo */
  id?: number;
}

/**
 * Configuration A/B test d'une campagne
 */
export interface BrevoCampaignABTest {
  /** Sujet A */
  subjectA: string;

  /** Sujet B */
  subjectB: string;

  /** Critère de sélection du gagnant */
  winnerCriteria: 'open' | 'click';

  /** Pourcentage du groupe A (1-50) */
  splitRule?: number;

  /** Date/heure de sélection du gagnant */
  winnerSelection?: string;
}

/**
 * Réponse API Brevo pour une campagne email
 *
 * GET /v3/emailCampaigns/{id}
 */
export interface BrevoCampaignResponse {
  /** ID unique de la campagne dans Brevo */
  id: number;

  /** Nom de la campagne */
  name: string;

  /** Sujet de l'email */
  subject: string;

  /** Statut de la campagne */
  status: BrevoCampaignStatus;

  /** Type de campagne */
  type?: BrevoCampaignType;

  /** Contenu HTML de l'email */
  htmlContent?: string;

  /** Informations de l'expéditeur */
  sender: BrevoCampaignSender;

  /** Statistiques de la campagne (optionnel pour les campagnes draft/non envoyées) */
  statistics?: BrevoCampaignStatistics;

  /** Date de création (ISO 8601) */
  createdAt: string;

  /** Date de dernière modification (ISO 8601) */
  modifiedAt?: string;

  /** Date d'envoi réelle (ISO 8601) */
  sentDate?: string;

  /** Date d'envoi programmée (ISO 8601) */
  scheduledAt?: string;

  /** Configuration A/B test */
  abTesting?: BrevoCampaignABTest;

  /** Liste des destinataires */
  recipients?: {
    /** Listes de contacts */
    listIds?: number[];

    /** Listes d'exclusion */
    exclusionListIds?: number[];

    /** Segments */
    segmentIds?: number[];
  };

  /** Tags de la campagne */
  tag?: string;

  /** Paramètres UTM */
  params?: {
    utm_campaign?: string;
    utm_medium?: string;
    utm_source?: string;
  };
}

/**
 * Liste paginée de campagnes Brevo
 *
 * GET /v3/emailCampaigns
 */
export interface BrevoCampaignsListResponse {
  /** Liste des campagnes */
  campaigns: BrevoCampaignResponse[];

  /** Nombre total de campagnes */
  count: number;

  /** Limite par page */
  limit?: number;

  /** Offset de pagination */
  offset?: number;
}

/**
 * Contact Brevo
 */
export interface BrevoContact {
  /** Email du contact */
  email: string;

  /** ID du contact dans Brevo */
  id?: number;

  /** Prénom */
  firstName?: string;

  /** Nom */
  lastName?: string;

  /** Attributs personnalisés */
  attributes?: Record<string, unknown>;

  /** Listes auxquelles le contact appartient */
  listIds?: number[];

  /** Email blacklisté */
  emailBlacklisted?: boolean;

  /** SMS blacklisté */
  smsBlacklisted?: boolean;

  /** Date de création */
  createdAt?: string;

  /** Date de modification */
  modifiedAt?: string;
}

/**
 * Template email Brevo
 */
export interface BrevoTemplate {
  /** ID du template dans Brevo */
  id: number;

  /** Nom du template */
  name: string;

  /** Sujet du template */
  subject: string;

  /** Contenu HTML */
  htmlContent?: string;

  /** Expéditeur */
  sender?: BrevoCampaignSender;

  /** Type de template */
  type?: 'transactional' | 'marketing';

  /** Actif */
  isActive?: boolean;

  /** Date de création */
  createdAt?: string;

  /** Date de modification */
  modifiedAt?: string;
}

// ============================================================================
// TYPES POUR L'APPLICATION
// ============================================================================

/**
 * Payload pour créer une campagne email
 */
export interface CreateEmailCampaignPayload {
  /** Nom de la campagne */
  name: string;

  /** Sujet de l'email */
  subject: string;

  /** Contenu HTML (optionnel si templateId est fourni) */
  htmlContent?: string;

  /** ID du template Brevo (optionnel) */
  templateId?: number;

  /** Liste des destinataires (emails ou IDs de listes) */
  recipientLists?: number[];

  /** Date d'envoi programmée */
  scheduledAt?: Date | string;

  /** Expéditeur */
  sender?: {
    name: string;
    email: string;
  };

  /** Tags UTM pour tracking */
  utmParams?: {
    utm_campaign?: string;
    utm_medium?: string;
    utm_source?: string;
  };
}

/**
 * Payload pour envoyer un email transactionnel via Brevo
 */
export interface SendTransactionalEmailPayload {
  /** Destinataires */
  to: Array<{ email: string; name?: string }>;

  /** Expéditeur */
  sender: { name: string; email: string };

  /** Sujet */
  subject: string;

  /** Contenu HTML */
  htmlContent?: string;

  /** ID du template */
  templateId?: number;

  /** Paramètres pour le template */
  params?: Record<string, string>;

  /** CC */
  cc?: Array<{ email: string; name?: string }>;

  /** BCC */
  bcc?: Array<{ email: string; name?: string }>;

  /** Reply to */
  replyTo?: { email: string; name?: string };

  /** Pièces jointes */
  attachment?: Array<{
    /** Contenu encodé en base64 */
    content: string;
    /** Nom du fichier */
    name: string;
  }>;

  /** Tags */
  tags?: string[];
}

/**
 * Statistiques de campagne enrichies pour l'UI
 */
export interface CampaignStats {
  /** ID de la campagne */
  campaignId: string;

  /** Nom de la campagne */
  campaignName: string;

  /** Métriques principales */
  metrics: {
    sent: number;
    delivered: number;
    deliveryRate: number; // %
    opens: number;
    openRate: number; // %
    clicks: number;
    clickRate: number; // %
    bounces: number;
    bounceRate: number; // %
    unsubscribes: number;
    unsubscribeRate: number; // %
  };

  /** Date d'envoi */
  sentAt?: string;

  /** Statut */
  status: BrevoCampaignStatus;
}

/**
 * Filtre pour les campagnes
 */
export interface CampaignFilters {
  /** Statut */
  status?: BrevoCampaignStatus | BrevoCampaignStatus[];

  /** Type */
  type?: BrevoCampaignType | BrevoCampaignType[];

  /** Date de début */
  startDate?: string;

  /** Date de fin */
  endDate?: string;

  /** Recherche par nom */
  searchQuery?: string;

  /** Limite */
  limit?: number;

  /** Offset */
  offset?: number;

  /** Tri */
  sort?: 'name' | 'sentDate' | 'openRate' | 'clickRate';

  /** Ordre */
  order?: 'asc' | 'desc';
}

/**
 * Résultat paginé de campagnes
 */
export interface CampaignsPaginatedResult {
  /** Campagnes */
  campaigns: BrevoEmailCampaign[];

  /** Nombre total */
  totalCount: number;

  /** Page actuelle */
  page: number;

  /** Limite par page */
  limit: number;

  /** Nombre total de pages */
  totalPages: number;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Configuration Brevo pour le client API
 */
export interface BrevoClientConfig {
  /** Clé API Brevo */
  apiKey: string;

  /** URL de l'API (par défaut: https://api.brevo.com/v3) */
  apiUrl?: string;

  /** Timeout en ms */
  timeout?: number;
}

/**
 * Résultat d'une opération Brevo
 */
export interface BrevoOperationResult<T = unknown> {
  /** Succès */
  success: boolean;

  /** Données */
  data?: T;

  /** Message d'erreur */
  error?: string;

  /** Code d'erreur */
  errorCode?: string;
}
