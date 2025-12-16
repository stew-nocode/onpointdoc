/**
 * Utilitaires pour l'affichage des campagnes email
 * 
 * Fonctions de formatage et de style pour les campagnes
 */

import React from 'react';
import type { BadgeProps } from '@/ui/badge';

/**
 * Retourne la variante de badge selon le statut de la campagne
 */
export function getCampaignStatusBadgeVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'sent':
      return 'success';
    case 'draft':
      return 'default';
    case 'scheduled':
      return 'info';
    case 'suspended':
      return 'warning';
    case 'archive':
      return 'outline';
    default:
      return 'default';
  }
}

/**
 * Retourne le libellé du statut en français
 */
export function getCampaignStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'sent': 'Envoyée',
    'draft': 'Brouillon',
    'scheduled': 'Planifiée',
    'suspended': 'Suspendue',
    'queued': 'En file d\'attente',
    'archive': 'Archivée'
  };
  return labels[status] || status;
}

/**
 * Retourne la variante de badge selon le type de campagne
 */
export function getCampaignTypeBadgeVariant(campaignType: string): BadgeProps['variant'] {
  switch (campaignType) {
    case 'classic':
      return 'info'; // Bleu - plus léger que le noir
    case 'trigger':
      return 'warning'; // Orange
    case 'automated':
      return 'success'; // Vert
    default:
      return 'outline'; // Bordure seule pour les types inconnus
  }
}

/**
 * Retourne le libellé du type en français
 */
export function getCampaignTypeLabel(campaignType: string): string {
  const labels: Record<string, string> = {
    'classic': 'Classique',
    'trigger': 'Déclencheur',
    'automated': 'Automatisée'
  };
  return labels[campaignType] || campaignType;
}

/**
 * Formate une date courte (DD/MM/YYYY)
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
 * Formate une date complète avec heure (DD/MM/YYYY HH:mm)
 */
export function formatDateTimeFull(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

/**
 * Formate un pourcentage (XX.X%)
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
}

/**
 * Formate un nombre (avec séparateurs de milliers)
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Surligne un terme de recherche dans un texte
 */
export function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

