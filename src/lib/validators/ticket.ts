import { z } from 'zod';

// Valeurs alignées avec les enums Supabase
export const ticketChannels = ['Whatsapp', 'Email', 'Appel', 'Autre'] as const;
export const ticketTypes = ['BUG', 'REQ', 'ASSISTANCE'] as const;
export const ticketPriorities = ['Low', 'Medium', 'High', 'Critical'] as const;

export const createTicketSchema = z.object({
  title: z.string().min(4).max(180),
  description: z.string().min(10),
  type: z.enum(ticketTypes),
  channel: z.enum(ticketChannels),
  productId: z.string().uuid({ message: 'Produit requis' }),
  moduleId: z.string().uuid({ message: 'Module requis' }),
  // Sous-module et fonctionnalité sont optionnels dans l'UI (chaîne vide acceptée)
  submoduleId: z.union([z.string().uuid(), z.literal('')]).optional(),
  featureId: z.union([z.string().uuid(), z.literal('')]).optional(),
  priority: z.enum(ticketPriorities).default('Medium'),
  durationMinutes: z.union([z.number().int().min(0), z.null()]).optional(),
  customerContext: z.string().optional(),
  contactUserId: z.string().uuid({ message: 'Contact requis' })
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

