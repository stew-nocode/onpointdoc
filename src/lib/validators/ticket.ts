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
  priority: z.enum(ticketPriorities).default('Medium'),
  durationMinutes: z.number().int().min(0).optional(),
  customerContext: z.string().optional()
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

