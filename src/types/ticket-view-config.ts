/**
 * Configuration de la vue tickets selon le rôle utilisateur
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Configuration centralisée pour la personnalisation par rôle
 * - DRY : Évite la duplication de logique dans les composants
 * - Type-safe : Types explicites pour toutes les configurations
 * - Extensible : Facile d'ajouter de nouveaux rôles ou configurations
 */

import type { ColumnId } from '@/lib/utils/column-preferences';
import type { QuickFilter } from '@/types/ticket-filters';

/**
 * Rôle de vue pour la personnalisation de l'interface
 */
export type TicketViewRole = 'agent' | 'manager' | 'admin' | 'director';

/**
 * Configuration complète de la vue tickets pour un rôle
 */
export type TicketViewConfig = {
  /**
   * Colonnes visibles par défaut pour ce rôle
   */
  defaultVisibleColumns: ColumnId[];
  
  /**
   * Filtres rapides disponibles
   */
  availableQuickFilters: QuickFilter[];
  
  /**
   * Afficher la sidebar de filtres avancés
   */
  showAdvancedFilters: boolean;
  
  /**
   * Afficher les KPIs
   */
  showKPIs: boolean;
  
  /**
   * Permissions d'édition individuelle (bouton Edit sur chaque ticket)
   */
  canEdit: boolean;
  
  /**
   * Permissions de sélection multiple (checkboxes + actions en masse)
   */
  canSelectMultiple: boolean;
  
  /**
   * Titre de la page
   */
  pageTitle: string;
  
  /**
   * Description de la page
   */
  pageDescription: string;
};

/**
 * Configuration par défaut pour chaque rôle
 * 
 * Ces configurations sont utilisées pour personnaliser l'interface
 * selon les besoins et permissions de chaque type d'utilisateur.
 */
export const TICKET_VIEW_CONFIGS: Record<TicketViewRole, TicketViewConfig> = {
  /**
   * Configuration pour les agents du support
   * 
   * Focus : Vue simplifiée, focus sur leurs tickets (créés + assignés)
   * Permissions : Actions en masse autorisées, édition individuelle limitée
   */
  agent: {
    defaultVisibleColumns: [
      'title',
      'type',
      'status',
      'priority',
      'created_at',
      'assigned'
    ],
    availableQuickFilters: ['all', 'mine', 'week', 'month', 'bug_in_progress', 'req_in_progress'],
    showAdvancedFilters: false, // Vue simplifiée pour agents
    showKPIs: true, // KPIs personnels uniquement
    canEdit: false, // Agents ne peuvent pas éditer directement (via actions en masse uniquement)
    canSelectMultiple: true, // ✅ Actions en masse autorisées
    pageTitle: 'Mes tickets',
    pageDescription: 'Suivez vos tickets assignés et créez de nouveaux tickets'
  },
  
  /**
   * Configuration pour les managers support
   * 
   * Focus : Vue complète avec toutes les fonctionnalités
   * Permissions : Toutes les actions autorisées
   */
  manager: {
    defaultVisibleColumns: [
      'title',
      'type',
      'status',
      'priority',
      'canal',
      'company',
      'product',
      'module',
      'jira',
      'created_at',
      'reporter',
      'assigned'
    ],
    availableQuickFilters: ['all', 'mine', 'unassigned', 'overdue', 'to_validate', 'week', 'month', 'bug_in_progress', 'req_in_progress'],
    showAdvancedFilters: true, // Vue complète pour managers
    showKPIs: true, // KPIs équipe
    canEdit: true,
    canSelectMultiple: true,
    pageTitle: 'Gestion des tickets Support',
    pageDescription: 'Cycle de vie : Nouveau → En cours → Transféré → Résolu'
  },
  
  /**
   * Configuration pour les administrateurs
   * 
   * Focus : Vue complète avec toutes les fonctionnalités
   * Permissions : Toutes les actions autorisées
   */
  admin: {
    defaultVisibleColumns: [
      'title',
      'type',
      'status',
      'priority',
      'canal',
      'company',
      'product',
      'module',
      'jira',
      'created_at',
      'reporter',
      'assigned'
    ],
    availableQuickFilters: ['all', 'mine', 'unassigned', 'overdue', 'to_validate', 'week', 'month', 'bug_in_progress', 'req_in_progress'],
    showAdvancedFilters: true,
    showKPIs: true,
    canEdit: true,
    canSelectMultiple: true,
    pageTitle: 'Gestion des tickets Support',
    pageDescription: 'Vue complète avec toutes les fonctionnalités'
  },
  
  /**
   * Configuration pour la direction (DG/DAF)
   * 
   * Focus : Vue d'ensemble pour le pilotage
   * Permissions : Lecture seule, pas d'édition
   */
  director: {
    defaultVisibleColumns: [
      'title',
      'type',
      'status',
      'priority',
      'company',
      'product',
      'module',
      'created_at',
      'reporter',
      'assigned'
    ],
    availableQuickFilters: ['all', 'week', 'month'], // Filtres temporels + tous
    showAdvancedFilters: true,
    showKPIs: true,
    canEdit: false, // Lecture seule pour direction
    canSelectMultiple: false,
    pageTitle: 'Vue Direction - Tickets',
    pageDescription: 'Vue d\'ensemble des tickets pour le pilotage'
  }
};

/**
 * Détermine le rôle de vue à partir du rôle utilisateur
 * 
 * Principe Clean Code - Niveau Senior :
 * - Fonction pure (pas d'effets de bord)
 * - Mapping déterministe
 * - Gestion des cas limites (null, valeurs inconnues)
 * 
 * @param userRole - Le rôle de l'utilisateur depuis profiles.role
 * @returns Le rôle de vue correspondant (par défaut 'agent')
 * 
 * @example
 * ```tsx
 * const userRole = await getCachedCurrentUserRole();
 * const viewRole = getTicketViewRole(userRole);
 * const config = TICKET_VIEW_CONFIGS[viewRole];
 * ```
 */
export function getTicketViewRole(userRole: string | null): TicketViewRole {
  if (!userRole) {
    return 'agent'; // Par défaut, vue agent
  }
  
  // Normaliser le rôle (en minuscules pour comparaison)
  const normalizedRole = userRole.toLowerCase();
  
  // Mapping explicite des rôles
  if (normalizedRole === 'admin') {
    return 'admin';
  }
  
  if (normalizedRole === 'director' || normalizedRole === 'daf') {
    return 'director';
  }
  
  // Vérifier si le rôle contient "manager" (manager_support, manager_marketing, etc.)
  if (normalizedRole.includes('manager')) {
    return 'manager';
  }
  
  // Par défaut, vue agent
  return 'agent';
}

