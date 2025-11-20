import { z } from 'zod';
import { BUG_TYPES } from '@/lib/constants/tickets';

// Valeurs alignées avec les enums Supabase
export const ticketChannels = ['Whatsapp', 'Email', 'Appel', 'Autre'] as const;
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
    contactUserId: z.string().uuid({ message: 'Contact requis' }),
    bug_type: z.enum(BUG_TYPES).nullable().optional()
  })
  .refine(
    (data) => {
      // Si type = BUG, bug_type est requis
      if (data.type === 'BUG') {
        return data.bug_type !== undefined && data.bug_type !== null;
      }
      // Sinon, bug_type doit être null ou undefined
      return true;
    },
    {
      message: 'Le type de bug est requis pour les tickets BUG',
      path: ['bug_type']
    }
  );

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

