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
  // Sous-module et fonctionnalité sont optionnels dans l’UI → on tolère la chaîne vide et on la convertit en undefined
  submoduleId: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().uuid().optional()
  ),
  featureId: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().uuid().optional()
  ),
  priority: z.enum(ticketPriorities).default('Medium'),
  durationMinutes: z
    .preprocess(
      (v) => (v === null || v === '' ? undefined : v),
      z.number().int().min(0).optional()
    ),
  customerContext: z.string().optional(),
  contactUserId: z.string().uuid({ message: 'Contact requis' })
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

