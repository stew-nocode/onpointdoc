/**
 * Utilitaires pour l'affichage des entreprises
 * 
 * Principe Clean Code :
 * - SRP : Fonctions utilitaires pures pour l'affichage
 * - Réutilisation des patterns existants (tickets/activities)
 */

import React from 'react';
import type { CompanyWithRelations } from '@/types/company-with-relations';

/**
 * Formate une date en format court français
 * 
 * @param dateString - Date ISO string
 * @returns Date formatée (ex: "15/12/2024")
 */
export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
}

/**
 * Formate une date complète avec heure en français
 * 
 * @param dateString - Date ISO string
 * @returns Date formatée complète (ex: "15 décembre 2024 à 14:30")
 */
export function formatDateTimeFull(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

/**
 * Met en surbrillance un terme de recherche dans un texte
 * 
 * @param text - Texte dans lequel chercher
 * @param searchTerm - Terme à mettre en surbrillance
 * @returns JSX avec le terme en surbrillance
 */
export function highlightText(
  text: string,
  searchTerm?: string
): React.ReactNode {
  if (!searchTerm || !text) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-900/50">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * Formate le nom d'une entreprise avec gestion des valeurs null/undefined
 * 
 * @param company - Entreprise
 * @returns Nom formaté ou '-'
 */
export function formatCompanyName(company: CompanyWithRelations | null | undefined): string {
  return company?.name || '-';
}

/**
 * Formate le nom du pays d'une entreprise
 * 
 * @param company - Entreprise
 * @returns Nom du pays ou '-'
 */
export function formatCompanyCountry(company: CompanyWithRelations | null | undefined): string {
  return company?.country?.name || '-';
}

/**
 * Formate le nom du point focal d'une entreprise
 * 
 * @param company - Entreprise
 * @returns Nom du point focal ou '-'
 */
export function formatCompanyFocalUser(company: CompanyWithRelations | null | undefined): string {
  return company?.focal_user?.full_name || '-';
}

/**
 * Formate les secteurs d'une entreprise en liste séparée par virgule
 * 
 * @param company - Entreprise
 * @returns Liste des secteurs ou '-'
 */
export function formatCompanySectors(company: CompanyWithRelations | null | undefined): string {
  if (!company?.sectors || company.sectors.length === 0) {
    return '-';
  }
  return company.sectors.map(s => s?.name).filter(Boolean).join(', ');
}
