import { z } from 'zod';

export const ticketChannels = ['whatsapp', 'email', 'appel', 'autre'] as const;
export const ticketTypes = ['BUG', 'REQ', 'ASSISTANCE'] as const;

export const createTicketSchema = z.object({
  title: z.string().min(4).max(180),
  description: z.string().min(10),
  type: z.enum(ticketTypes),
  channel: z.enum(ticketChannels),
  productId: z.string().uuid({ message: 'Produit requis' }),
  moduleId: z.string().uuid({ message: 'Module requis' }),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  durationMinutes: z.number().int().min(0).optional(),
  customerContext: z.string().optional()
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

