/**
 * Types pour les tickets avec leurs relations
 * Utilisés après transformation des relations Supabase (tableaux → objets)
 */

import type { Ticket } from './ticket';

/**
 * Profile utilisateur simplifié (utilisé dans les relations tickets)
 */
export type TicketUserRelation = {
  id: string;
  full_name: string;
} | null;

/**
 * Produit simplifié (utilisé dans les relations tickets)
 */
export type TicketProductRelation = {
  id: string;
  name: string;
} | null;

/**
 * Module simplifié (utilisé dans les relations tickets)
 */
export type TicketModuleRelation = {
  id: string;
  name: string;
} | null;

/**
 * Ticket avec ses relations transformées (après transformation Supabase)
 */
export type TicketWithRelations = Ticket & {
  created_user?: TicketUserRelation;
  assigned_user?: TicketUserRelation;
  contact_user?: (TicketUserRelation & {
    company_id?: string | null;
  }) | null;
  product?: TicketProductRelation;
  module?: TicketModuleRelation;
};

/**
 * Type de retour pour listTicketsPaginated
 */
export type TicketsPaginatedResult = {
  tickets: TicketWithRelations[];
  hasMore: boolean;
  total: number;
};

/**
 * Type brut retourné par Supabase avant transformation
 */
export type SupabaseTicketRaw = Omit<Ticket, 'created_user' | 'assigned_user' | 'contact_user' | 'product' | 'module'> & {
  created_user?: TicketUserRelation | TicketUserRelation[];
  assigned_user?: TicketUserRelation | TicketUserRelation[];
  contact_user?: (TicketUserRelation & { company_id?: string | null }) | Array<TicketUserRelation & { company_id?: string | null }>;
  product?: TicketProductRelation | TicketProductRelation[];
  module?: TicketModuleRelation | TicketModuleRelation[];
};

/**
 * Helper pour transformer une relation Supabase (tableau ou objet) en objet unique
 */
export function transformRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  if (Array.isArray(relation)) {
    return relation.length > 0 ? relation[0] : null;
  }
  return relation;
}

