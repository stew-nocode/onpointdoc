import { z } from 'zod';
import { BUG_TYPES, ASSISTANCE_LOCAL_STATUSES } from '@/lib/constants/tickets';

// Valeurs alignées avec l'enum canal_t dans Supabase (mapping one-to-one avec JIRA)
export const ticketChannels = [
  'Whatsapp',
  'Email',
  'Appel',
  'Autre',
  'Appel Téléphonique',
  'Appel WhatsApp',
  'Chat SMS',
  'Chat WhatsApp',
  'Constat Interne',
  'E-mail',
  'En présentiel',
  'En prsentiel',
  'Non enregistré',
  'Online (Google Meet, Teams...)'
] as const;
export const ticketTypes = ['BUG', 'REQ', 'ASSISTANCE'] as const;
export const ticketPriorities = ['Low', 'Medium', 'High', 'Critical'] as const;

export const createTicketSchema = z
  .object({
    title: z.string().min(4).max(180),
    description: z.string().min(10),
    type: z.enum(ticketTypes),
    channel: z.enum(ticketChannels),
    productId: z.string().uuid({ message: 'Produit requis' }),
    moduleId: z.string().uuid({ message: 'Module requis' }),
    // Sous-module et fonctionnalité sont optionnels dans l'UI (chaîne vide acceptée)
    submoduleId: z.union([z.string().uuid(), z.literal('')]).optional(),
    featureId: z.union([z.string().uuid(), z.literal('')]).optional(),
    priority: z.enum(ticketPriorities),
    durationMinutes: z.union([z.number().int().min(0), z.null()]).optional(),
    customerContext: z.string().optional(),
    contactUserId: z.union([z.string().uuid(), z.literal('')]).optional(),
    companyId: z.union([z.string().uuid(), z.literal('')]).optional(),
    // Portée du ticket : single (une seule entreprise), all (toutes), multiple (plusieurs spécifiques)
    scope: z.enum(['single', 'all', 'multiple']).optional(),
    affectsAllCompanies: z.boolean().optional(),
    selectedCompanyIds: z.array(z.string().uuid()).optional(),
    selectedDepartmentIds: z.array(z.string().uuid()).optional(),
    bug_type: z.enum(BUG_TYPES).nullable().optional(),
    // Statut optionnel pour le formulaire (utilisé uniquement en mode édition pour ASSISTANCE)
    status: z.enum(ASSISTANCE_LOCAL_STATUSES).optional()
  })
  .refine(
    (data) => {
      // Si type = BUG, bug_type est requis
      if (data.type === 'BUG') {
        return data.bug_type !== undefined && data.bug_type !== null;
      }
      return true;
    },
    {
      message: 'Le type de bug est requis pour les tickets BUG',
      path: ['bug_type']
    }
  )
  .refine(
    (data) => {
      // Si canal = "Constat Interne", contactUserId n'est pas requis
      if (data.channel === 'Constat Interne') {
        return true; // Contact optionnel pour constat interne
      }
      // Pour les autres canaux, contactUserId est recommandé mais pas obligatoire
      // (on peut avoir un ticket sans contact si nécessaire)
      return true;
    },
    {
      message: 'Le contact n\'est pas requis pour un constat interne',
      path: ['contactUserId']
    }
  )
  .refine(
    (data) => {
      // Si scope = 'all', affectsAllCompanies doit être true
      if (data.scope === 'all') {
        return data.affectsAllCompanies === true;
      }
      return true;
    },
    {
      message: 'La portée "Toutes les entreprises" nécessite que affectsAllCompanies soit true',
      path: ['affectsAllCompanies']
    }
  )
  .refine(
    (data) => {
      // Si scope = 'multiple', au moins 2 entreprises doivent être sélectionnées
      if (data.scope === 'multiple') {
        return data.selectedCompanyIds && data.selectedCompanyIds.length >= 2;
      }
      return true;
    },
    {
      message: 'La portée "Plusieurs entreprises" nécessite au moins 2 entreprises',
      path: ['selectedCompanyIds']
    }
  )
  .refine(
    (data) => {
      // Si scope = 'single', companyId doit être renseigné
      if (data.scope === 'single') {
        return data.companyId && data.companyId !== '';
      }
      return true;
    },
    {
      message: 'La portée "Une seule entreprise" nécessite une entreprise sélectionnée',
      path: ['companyId']
    }
  );

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

/**
 * Schéma pour la mise à jour d'un ticket
 * Tous les champs sont optionnels sauf l'ID
 */
export const updateTicketSchema = z
  .object({
    id: z.string().uuid({ message: 'ID de ticket invalide' }),
    title: z.string().min(4).max(180).optional(),
    description: z.string().min(10).optional(),
    type: z.enum(ticketTypes).optional(),
    channel: z.enum(ticketChannels).optional(),
    productId: z.string().uuid().optional().nullable(),
    moduleId: z.string().uuid().optional().nullable(),
    submoduleId: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
    featureId: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
    priority: z.enum(ticketPriorities).optional(),
    durationMinutes: z.union([z.number().int().min(0), z.null()]).optional(),
    customerContext: z.string().optional().nullable(),
    contactUserId: z.string().uuid().optional().nullable(),
    companyId: z.string().uuid().optional().nullable(),
    bug_type: z.enum(BUG_TYPES).nullable().optional(),
    status: z.enum(ASSISTANCE_LOCAL_STATUSES).optional()
  })
  .refine(
    (data) => {
      // Si type = BUG, bug_type est requis
      if (data.type === 'BUG') {
        return data.bug_type !== undefined && data.bug_type !== null;
      }
      return true;
    },
    {
      message: 'Le type de bug est requis pour les tickets BUG',
      path: ['bug_type']
    }
  );

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
