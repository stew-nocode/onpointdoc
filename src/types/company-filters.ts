/**
 * Types pour les filtres d'entreprises
 * 
 * Définit les filtres rapides disponibles pour les entreprises
 */

/**
 * Filtre rapide pour les entreprises
 */
export type CompanyQuickFilter =
  | 'all'              // Toutes les entreprises
  | 'with_users'       // Avec utilisateurs (users_count > 0)
  | 'without_users'    // Sans utilisateurs (users_count = 0)
  | 'with_tickets'     // Avec tickets (tickets_count > 0)
  | 'with_open_tickets' // Avec tickets ouverts (open_tickets_count > 0)
  | 'with_assistance'; // Avec assistance (assistance_duration_minutes > 0)
