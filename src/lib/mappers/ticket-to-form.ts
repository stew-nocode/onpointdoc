/**
 * Mappers pour convertir un ticket en données de formulaire
 *
 * Centralise les conversions de types et les valeurs par défaut
 * pour éviter la duplication de logique
 */

import type { CreateTicketInput } from '@/lib/validators/ticket';

type TicketType = 'BUG' | 'REQ' | 'ASSISTANCE';
type CanalType = 'Whatsapp' | 'Email' | 'Appel' | 'Autre';
type PriorityType = 'Low' | 'Medium' | 'High' | 'Critical';
type BugType = CreateTicketInput['bug_type'];

type TicketData = {
  title?: string | null;
  description?: string | null;
  ticket_type?: string | null;
  status?: string | null;
  canal?: string | null;
  priority?: string | null;
  customer_context?: string | null;
  contact_user_id?: string | null;
  company_id?: string | null;
  bug_type?: string | null;
  product_id?: string | null;
  module_id?: string | null;
  submodule_id?: string | null;
  feature_id?: string | null;
};

/**
 * Type de retour pour les données du formulaire d'édition
 */
export type TicketFormData = {
  title: string;
  description: string;
  ticket_type: TicketType;
  status: string;
  canal: string;
  priority: string;
  customer_context: string | null;
  contact_user_id: string | null;
  company_id: string | null;
  bug_type: string | null;
  product_id: string | null;
  module_id: string | null;
  submodule_id: string | null;
  feature_id: string | null;
};

/**
 * Convertit un ticket en données de formulaire pour l'édition
 *
 * Applique les valeurs par défaut et conversions de types nécessaires
 *
 * @param ticket - Le ticket à convertir
 * @returns Données formatées pour le formulaire
 */
export function mapTicketToFormData(ticket: TicketData): TicketFormData {
  return {
    title: ticket.title ?? '',
    description: ticket.description ?? '',
    ticket_type: (ticket.ticket_type ?? 'ASSISTANCE') as TicketType,
    status: ticket.status ?? 'Nouveau',
    canal: ticket.canal ?? 'Whatsapp',
    priority: ticket.priority ?? 'Medium',
    customer_context: ticket.customer_context ?? null,
    contact_user_id: ticket.contact_user_id ?? null,
    company_id: ticket.company_id ?? null,
    bug_type: ticket.bug_type ?? null,
    product_id: ticket.product_id ?? null,
    module_id: ticket.module_id ?? null,
    submodule_id: ticket.submodule_id ?? null,
    feature_id: ticket.feature_id ?? null,
  };
}

/**
 * Valeurs par défaut pour un nouveau ticket
 */
export const DEFAULT_TICKET_VALUES: TicketFormData = {
  title: '',
  description: '',
  ticket_type: 'ASSISTANCE',
  status: 'Nouveau',
  canal: 'Whatsapp',
  priority: 'Medium',
  customer_context: null,
  contact_user_id: null,
  company_id: null,
  bug_type: null,
  product_id: null,
  module_id: null,
  submodule_id: null,
  feature_id: null,
};
