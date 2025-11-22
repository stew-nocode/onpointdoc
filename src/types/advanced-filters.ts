/**
 * Types pour les filtres avancés de tickets
 */

/**
 * Type de filtre de date (période prédéfinie)
 */
export type DateFilterPreset = 'today' | 'this_week' | 'this_month' | 'custom' | null;

/**
 * Filtre de période de date personnalisé
 */
export type DateRange = {
  start: string | null; // ISO date string (YYYY-MM-DD)
  end: string | null; // ISO date string (YYYY-MM-DD)
};

/**
 * Filtre de date (création ou résolution)
 */
export type DateFilter = {
  preset: DateFilterPreset;
  range: DateRange | null;
};

/**
 * Filtres avancés complets
 */
export type AdvancedFilters = {
  // Multi-sélection
  types: string[]; // BUG, REQ, ASSISTANCE
  statuses: string[]; // Statuts (JIRA ou locaux)
  priorities: string[]; // Critical, High, Medium, Low
  assignedTo: string[]; // IDs de profils
  products: string[]; // IDs de produits
  modules: string[]; // IDs de modules
  channels: string[]; // Whatsapp, Email, Appel, Autre
  
  // Filtres de date
  createdAt: DateFilter | null;
  resolvedAt: DateFilter | null;
  
  // Filtres d'origine
  origins: string[]; // 'supabase' | 'jira'
  hasJiraSync: boolean | null; // true = avec Jira, false = sans Jira, null = tous
};

/**
 * Type pour initialiser des filtres vides
 */
export type EmptyAdvancedFilters = {
  types: [];
  statuses: [];
  priorities: [];
  assignedTo: [];
  products: [];
  modules: [];
  channels: [];
  createdAt: null;
  resolvedAt: null;
  origins: [];
  hasJiraSync: null;
};

