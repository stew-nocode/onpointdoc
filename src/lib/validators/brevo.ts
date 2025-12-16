/**
 * Schémas de validation Zod pour Brevo Email Marketing
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTES & ENUMS
// ============================================================================

export const brevoCampaignStatuses = ['draft', 'sent', 'scheduled', 'suspended', 'queued', 'archive'] as const;
export const brevoCampaignTypes = ['classic', 'trigger', 'automated'] as const;

// ============================================================================
// CONFIGURATION BREVO
// ============================================================================

/**
 * Schéma pour la configuration Brevo
 */
export const brevoConfigSchema = z.object({
  apiKey: z.string().min(20, 'Clé API Brevo invalide (minimum 20 caractères)'),
  apiUrl: z.string().url().optional().default('https://api.brevo.com/v3'),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  isActive: z.boolean().optional().default(true)
});

export type BrevoConfigInput = z.infer<typeof brevoConfigSchema>;

// ============================================================================
// CAMPAGNES EMAIL
// ============================================================================

/**
 * Schéma pour créer une campagne email
 */
export const createEmailCampaignSchema = z.object({
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

  subject: z.string()
    .min(5, 'Le sujet doit contenir au moins 5 caractères')
    .max(200, 'Le sujet ne peut pas dépasser 200 caractères'),

  htmlContent: z.string()
    .min(10, 'Le contenu HTML doit contenir au moins 10 caractères')
    .optional(),

  templateId: z.number().int().positive().optional(),

  recipientLists: z.array(z.number().int().positive()).optional(),

  scheduledAt: z.union([
    z.string().datetime(),
    z.date()
  ]).optional(),

  sender: z.object({
    name: z.string().min(2, 'Nom de l\'expéditeur requis'),
    email: z.string().email('Email de l\'expéditeur invalide')
  }).optional(),

  utmParams: z.object({
    utm_campaign: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_source: z.string().optional()
  }).optional()
}).refine(
  (data) => data.htmlContent || data.templateId,
  {
    message: 'Vous devez fournir soit un contenu HTML, soit un ID de template',
    path: ['htmlContent']
  }
);

export type CreateEmailCampaignInput = z.infer<typeof createEmailCampaignSchema>;

/**
 * Schéma pour mettre à jour une campagne email
 */
export const updateEmailCampaignSchema = createEmailCampaignSchema.partial();

export type UpdateEmailCampaignInput = z.infer<typeof updateEmailCampaignSchema>;

/**
 * Schéma pour filtrer les campagnes
 */
export const campaignFiltersSchema = z.object({
  status: z.union([
    z.enum(brevoCampaignStatuses),
    z.array(z.enum(brevoCampaignStatuses))
  ]).optional(),

  type: z.union([
    z.enum(brevoCampaignTypes),
    z.array(z.enum(brevoCampaignTypes))
  ]).optional(),

  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  searchQuery: z.string().min(2).optional(),

  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),

  sort: z.enum(['name', 'sentDate', 'openRate', 'clickRate']).optional().default('sentDate'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
});

export type CampaignFiltersInput = z.infer<typeof campaignFiltersSchema>;

// ============================================================================
// EMAILS TRANSACTIONNELS
// ============================================================================

/**
 * Schéma pour un destinataire
 */
export const emailRecipientSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().optional()
});

/**
 * Schéma pour un expéditeur
 */
export const emailSenderSchema = z.object({
  email: z.string().email('Email de l\'expéditeur invalide'),
  name: z.string().min(1, 'Nom de l\'expéditeur requis')
});

/**
 * Schéma pour une pièce jointe
 */
export const emailAttachmentSchema = z.object({
  content: z.string().min(1, 'Contenu de la pièce jointe requis (base64)'),
  name: z.string().min(1, 'Nom du fichier requis')
});

/**
 * Schéma pour envoyer un email transactionnel
 */
export const sendTransactionalEmailSchema = z.object({
  to: z.array(emailRecipientSchema)
    .min(1, 'Au moins un destinataire requis')
    .max(50, 'Maximum 50 destinataires'),

  sender: emailSenderSchema,

  subject: z.string()
    .min(3, 'Le sujet doit contenir au moins 3 caractères')
    .max(200, 'Le sujet ne peut pas dépasser 200 caractères'),

  htmlContent: z.string().min(10).optional(),

  templateId: z.number().int().positive().optional(),

  params: z.record(z.string()).optional(),

  cc: z.array(emailRecipientSchema).max(10).optional(),
  bcc: z.array(emailRecipientSchema).max(10).optional(),

  replyTo: z.object({
    email: z.string().email(),
    name: z.string().optional()
  }).optional(),

  attachment: z.array(emailAttachmentSchema).max(10).optional(),

  tags: z.array(z.string()).max(10).optional()
}).refine(
  (data) => data.htmlContent || data.templateId,
  {
    message: 'Vous devez fournir soit un contenu HTML, soit un ID de template',
    path: ['htmlContent']
  }
);

export type SendTransactionalEmailInput = z.infer<typeof sendTransactionalEmailSchema>;

// ============================================================================
// CONTACTS
// ============================================================================

/**
 * Schéma pour créer/mettre à jour un contact
 */
export const brevoContactSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  attributes: z.record(z.any()).optional(),
  listIds: z.array(z.number().int().positive()).optional(),
  companyId: z.string().uuid().optional()
});

export type BrevoContactInput = z.infer<typeof brevoContactSchema>;

/**
 * Schéma pour synchroniser des contacts en masse
 */
export const syncContactsSchema = z.object({
  contacts: z.array(brevoContactSchema)
    .min(1, 'Au moins un contact requis')
    .max(1000, 'Maximum 1000 contacts par synchronisation'),
  listId: z.number().int().positive().optional(),
  updateExisting: z.boolean().optional().default(true)
});

export type SyncContactsInput = z.infer<typeof syncContactsSchema>;

// ============================================================================
// WEBHOOK BREVO
// ============================================================================

/**
 * Schéma pour les événements webhook Brevo
 */
export const brevoWebhookEventSchema = z.object({
  event: z.enum([
    'sent',
    'request',
    'delivered',
    'hard_bounce',
    'soft_bounce',
    'unique_opened',
    'opened',
    'click',
    'invalid_email',
    'deferred',
    'blocked',
    'unsubscribed',
    'complaint',
    'error',
    'opened_campaign',
    'click_campaign'
  ]),

  email: z.string().email(),

  id: z.number().int().optional(), // Message ID

  date: z.string().datetime().optional(),

  ts: z.number().optional(), // Timestamp Unix

  'message-id': z.string().optional(),

  ts_event: z.number().optional(),

  subject: z.string().optional(),

  tag: z.string().optional(),

  sending_ip: z.string().optional(),

  ts_epoch: z.number().optional(),

  tags: z.array(z.string()).optional(),

  link: z.string().url().optional(), // Pour les événements 'click'

  from: z.string().optional(),

  template_id: z.number().int().optional(),

  reason: z.string().optional(), // Pour les bounces/errors

  // Campaign specific
  'campaign-id': z.number().int().optional()
});

export type BrevoWebhookEvent = z.infer<typeof brevoWebhookEventSchema>;

/**
 * Schéma pour valider le payload complet du webhook
 */
export const brevoWebhookPayloadSchema = z.object({
  events: z.array(brevoWebhookEventSchema).optional(),
  event: z.string().optional(),
  // Brevo peut envoyer soit un array d'events, soit un seul event
}).transform((data) => {
  // Normaliser le format
  if (data.events) {
    return { events: data.events };
  }
  return { events: [data as BrevoWebhookEvent] };
});

export type BrevoWebhookPayload = z.infer<typeof brevoWebhookPayloadSchema>;

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Schéma pour les statistiques de campagne (réponse API Brevo)
 */
export const brevoCampaignStatisticsSchema = z.object({
  sent: z.number().int().min(0),
  delivered: z.number().int().min(0),
  uniqueOpens: z.number().int().min(0),
  totalOpens: z.number().int().min(0).optional(),
  openRate: z.number().min(0).max(100),
  uniqueClicks: z.number().int().min(0),
  totalClicks: z.number().int().min(0).optional(),
  clickRate: z.number().min(0).max(100),
  clickers: z.number().int().min(0),
  hardBounces: z.number().int().min(0),
  softBounces: z.number().int().min(0),
  complaints: z.number().int().min(0),
  unsubscriptions: z.number().int().min(0),
  trackableViews: z.number().int().min(0).optional(),
  estimatedViews: z.number().int().min(0).optional(),
  forwarded: z.number().int().min(0).optional()
});

export type BrevoCampaignStatisticsInput = z.infer<typeof brevoCampaignStatisticsSchema>;

// ============================================================================
// RÉPONSES API BREVO
// ============================================================================

/**
 * Schéma pour valider la réponse API d'une campagne Brevo
 */
export const brevoCampaignResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  subject: z.string(),
  status: z.enum(brevoCampaignStatuses),
  type: z.enum(brevoCampaignTypes).optional(),
  htmlContent: z.string().optional(),
  sender: z.object({
    name: z.string(),
    email: z.string().email(),
    id: z.number().int().optional()
  }),
  statistics: brevoCampaignStatisticsSchema,
  createdAt: z.string().datetime(),
  modifiedAt: z.string().datetime().optional(),
  sentDate: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  recipients: z.object({
    listIds: z.array(z.number().int()).optional(),
    exclusionListIds: z.array(z.number().int()).optional(),
    segmentIds: z.array(z.number().int()).optional()
  }).optional(),
  tag: z.string().optional(),
  params: z.record(z.string()).optional()
});

export type BrevoCampaignResponseInput = z.infer<typeof brevoCampaignResponseSchema>;

/**
 * Schéma pour la liste paginée de campagnes
 */
export const brevoCampaignsListResponseSchema = z.object({
  campaigns: z.array(brevoCampaignResponseSchema),
  count: z.number().int().min(0),
  limit: z.number().int().min(0).optional(),
  offset: z.number().int().min(0).optional()
});

export type BrevoCampaignsListResponseInput = z.infer<typeof brevoCampaignsListResponseSchema>;
