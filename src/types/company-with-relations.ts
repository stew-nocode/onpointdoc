/**
 * Types pour les entreprises avec leurs relations et insights
 * 
 * Utilisés après transformation des relations Supabase et calcul des insights agrégés
 */

import type { Tables } from '@/types';

/**
 * Entreprise de base (sans relations)
 * Utilise le type généré depuis Supabase Tables
 */
export type Company = Tables<'companies'>;

/**
 * Pays simplifié (relation vers countries)
 */
export type CompanyCountryRelation = {
  id: string;
  name: string;
} | null;

/**
 * Utilisateur simplifié (point focal - relation vers profiles)
 */
export type CompanyUserRelation = {
  id: string;
  full_name: string;
} | null;

/**
 * Secteur simplifié (via company_sector_link)
 */
export type CompanySectorRelation = {
  id: string;
  name: string;
} | null;

/**
 * Entreprise avec ses relations transformées et insights agrégés
 * 
 * Différences avec TaskWithRelations/ActivityWithRelations :
 * - Relations descriptives (country, focal_user, sectors)
 * - Insights agrégés (users_count, tickets_count, etc.)
 */
export type CompanyWithRelations = Company & {
  // Relations descriptives
  country?: CompanyCountryRelation;
  focal_user?: CompanyUserRelation;
  sectors?: CompanySectorRelation[];
  // Insights agrégés
  users_count: number;
  tickets_count: number;
  open_tickets_count: number;
  assistance_duration_minutes: number;
};

/**
 * Type de retour pour listCompaniesPaginated
 */
export type CompaniesPaginatedResult = {
  companies: CompanyWithRelations[];
  hasMore: boolean;
  total: number;
};

/**
 * Type brut retourné par Supabase avant transformation
 * 
 * Supabase retourne les relations comme tableaux ou objets
 * Il faut les transformer en structures attendues
 */
export type SupabaseCompanyRaw = Omit<Company, 'country' | 'focal_user' | 'sectors'> & {
  country?: CompanyCountryRelation | CompanyCountryRelation[];
  focal_user?: CompanyUserRelation | CompanyUserRelation[];
  company_sector_link?: Array<{
    sector?: CompanySectorRelation | CompanySectorRelation[];
  }>;
};

/**
 * Helper pour transformer une relation Supabase (tableau ou objet) en objet unique
 * 
 * Utile pour les relations 1:1 (country, focal_user)
 */
export function transformCompanyRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  if (Array.isArray(relation)) {
    return relation.length > 0 ? relation[0] : null;
  }
  return relation;
}
