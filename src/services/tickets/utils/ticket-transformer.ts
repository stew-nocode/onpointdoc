/**
 * Utilitaires pour transformer les tickets depuis Supabase
 * 
 * Optimisé pour éviter JSON.parse(JSON.stringify()) coûteux.
 * Respecte Clean Code : fonctions courtes, types explicites.
 */

import type { SupabaseTicketRaw } from '@/types/ticket-with-relations';
import type { TicketWithRelations } from '@/types/ticket-with-relations';
import { transformRelation } from '@/types/ticket-with-relations';

type CompanyMap = Record<string, { id: string; name: string }>;

/**
 * Type helper pour contact user transformé
 */
type ContactUserTransformed = {
  id: string;
  full_name: string;
  company_id: string | null;
} | null;

/**
 * Transforme une relation contact_user et récupère la company associée
 */
function transformContactUserAndCompany(
  contactUser: unknown,
  companiesMap: CompanyMap
): {
  contactUser: ContactUserTransformed;
  company: TicketWithRelations['company'];
} {
  const transformedContactUser = transformRelation(contactUser);
  
  let company: TicketWithRelations['company'] = null;
  
  if (
    transformedContactUser &&
    typeof transformedContactUser === 'object' &&
    'company_id' in transformedContactUser &&
    transformedContactUser.company_id &&
    'id' in transformedContactUser &&
    'full_name' in transformedContactUser
  ) {
    const contactUserObj = transformedContactUser as {
      id: unknown;
      full_name: unknown;
      company_id: unknown;
    };
    const companyIdStr = String(contactUserObj.company_id);
    const companyData = companiesMap[companyIdStr];
    
    if (companyData) {
      company = {
        id: String(companyData.id),
        name: String(companyData.name),
      };
    }
  }
  
  // Nettoyer contact_user pour le rendre sérialisable
  const cleanContactUser: ContactUserTransformed =
    transformedContactUser &&
    typeof transformedContactUser === 'object' &&
    'id' in transformedContactUser &&
    'full_name' in transformedContactUser
      ? {
          id: String((transformedContactUser as { id: unknown }).id),
          full_name: String((transformedContactUser as { full_name: unknown }).full_name),
          company_id:
            'company_id' in transformedContactUser && transformedContactUser.company_id
              ? String(transformedContactUser.company_id)
              : null,
        }
      : null;
  
  return { 
    contactUser: cleanContactUser || null, 
    company 
  };
}

/**
 * Transforme une relation simple (profile, product, module)
 */
function transformSimpleRelation(relation: unknown): unknown {
  const transformed = transformRelation(relation);
  
  if (!transformed || typeof transformed !== 'object') {
    return transformed;
  }
  
  // Transformer selon le type de relation
  if ('id' in transformed && 'full_name' in transformed) {
    // Relation profile (created_user, assigned_user)
    return {
      id: String(transformed.id),
      full_name: String(transformed.full_name),
    };
  }
  
  if ('id' in transformed && 'name' in transformed) {
    // Relation product ou module
    return {
      id: String(transformed.id),
      name: String(transformed.name),
    };
  }
  
  return transformed;
}

/**
 * Normalise une date en string ISO
 * 
 * @returns string ISO ou null si date est falsy
 */
function normalizeDate(date: unknown): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return String(date);
}

/**
 * Transforme un ticket brut depuis Supabase en TicketWithRelations
 * 
 * Optimisé : Pas de JSON.parse(JSON.stringify()), transformations directes
 */
export function transformTicket(
  ticket: SupabaseTicketRaw,
  companiesMap: CompanyMap
): TicketWithRelations {
  // Transformer contact_user et company
  const { contactUser, company } = transformContactUserAndCompany(
    ticket.contact_user,
    companiesMap
  );
  
  // Transformer les autres relations
  const createdUser = transformSimpleRelation(ticket.created_user);
  const assignedUser = transformSimpleRelation(ticket.assigned_user);
  const product = transformSimpleRelation(ticket.product);
  const module = transformSimpleRelation(ticket.module);
  
  // Créer le ticket transformé directement (pas de JSON.parse/stringify)
  return {
    id: ticket.id,
    title: String(ticket.title),
    description: ticket.description ? String(ticket.description) : null,
    ticket_type: String(ticket.ticket_type) as 'BUG' | 'REQ' | 'ASSISTANCE',
    status: String(ticket.status),
    priority: String(ticket.priority) as 'Low' | 'Medium' | 'High' | 'Critical',
    canal: (ticket.canal ? String(ticket.canal) : null) as TicketWithRelations['canal'],
    jira_issue_key: ticket.jira_issue_key ? String(ticket.jira_issue_key) : null,
    origin: (ticket.origin ? String(ticket.origin) : undefined) as TicketWithRelations['origin'],
    target_date: normalizeDate(ticket.target_date),
    bug_type: (ticket.bug_type ? String(ticket.bug_type) : undefined) as TicketWithRelations['bug_type'],
    created_at: normalizeDate(ticket.created_at) || new Date().toISOString(),
    updated_at: ticket.updated_at ? (normalizeDate(ticket.updated_at) ?? undefined) : undefined,
    created_by: ticket.created_by ? String(ticket.created_by) : null,
    assigned_to: ticket.assigned_to ? String(ticket.assigned_to) : null,
    contact_user_id: ticket.contact_user_id ? String(ticket.contact_user_id) : null,
    created_user: createdUser as TicketWithRelations['created_user'],
    assigned_user: assignedUser as TicketWithRelations['assigned_user'],
    contact_user: contactUser as TicketWithRelations['contact_user'],
    company,
    product: product as TicketWithRelations['product'],
    module: module as TicketWithRelations['module'],
  } satisfies TicketWithRelations;
}

