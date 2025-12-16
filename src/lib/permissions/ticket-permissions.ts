/**
 * Module de gestion des permissions des tickets
 *
 * Centralise toute la logique métier de permissions
 * pour faciliter la maintenance et les tests
 */

type Ticket = {
  ticket_type?: string | null;
  status?: string | null;
};

type UserRole = string | null;

/**
 * Permissions des tickets
 *
 * Chaque fonction retourne un boolean indiquant si l'action est autorisée
 */
export const ticketPermissions = {
  /**
   * Vérifie si un ticket peut être transféré vers JIRA
   *
   * Règles :
   * - Type ASSISTANCE uniquement
   * - Statut En_cours
   *
   * @param ticket - Le ticket à vérifier
   * @returns true si le transfert est autorisé
   */
  canTransfer: (ticket: Ticket): boolean => {
    return ticket.ticket_type === 'ASSISTANCE' && ticket.status === 'En_cours';
  },

  /**
   * Vérifie si l'utilisateur peut valider un ticket
   *
   * Règles :
   * - Rôle manager (exact ou contenant "manager")
   * - Rôle admin
   *
   * @param role - Le rôle de l'utilisateur
   * @returns true si la validation est autorisée
   */
  canValidate: (role: UserRole): boolean => {
    if (!role) return false;
    return role === 'manager' || role.includes('manager') || role === 'admin';
  },

  /**
   * Vérifie si l'utilisateur peut archiver un ticket
   *
   * Règles : Identiques à canValidate (managers et admins)
   *
   * @param role - Le rôle de l'utilisateur
   * @returns true si l'archivage est autorisé
   */
  canArchive: (role: UserRole): boolean => {
    if (!role) return false;
    return role === 'manager' || role.includes('manager') || role === 'admin';
  },

  /**
   * Vérifie si l'utilisateur peut éditer un ticket
   *
   * Par défaut, tous les utilisateurs authentifiés peuvent éditer
   * Cette fonction peut être étendue avec des règles plus complexes
   *
   * @param role - Le rôle de l'utilisateur
   * @returns true si l'édition est autorisée
   */
  canEdit: (role: UserRole): boolean => {
    return role !== null;
  },

  /**
   * Vérifie si l'utilisateur peut dupliquer un ticket
   *
   * Par défaut, tous les utilisateurs authentifiés peuvent dupliquer
   *
   * @param role - Le rôle de l'utilisateur
   * @returns true si la duplication est autorisée
   */
  canDuplicate: (role: UserRole): boolean => {
    return role !== null;
  },

  /**
   * Vérifie si l'utilisateur peut exporter un ticket en PDF
   *
   * Par défaut, tous les utilisateurs authentifiés peuvent exporter
   *
   * @param role - Le rôle de l'utilisateur
   * @returns true si l'export est autorisé
   */
  canExport: (role: UserRole): boolean => {
    return role !== null;
  },

  /**
   * Vérifie si l'utilisateur peut partager un ticket
   *
   * Par défaut, tous les utilisateurs authentifiés peuvent partager
   *
   * @param role - Le rôle de l'utilisateur
   * @returns true si le partage est autorisé
   */
  canShare: (role: UserRole): boolean => {
    return role !== null;
  },
} as const;

/**
 * Helper pour obtenir toutes les permissions d'un utilisateur pour un ticket
 *
 * @param ticket - Le ticket concerné
 * @param role - Le rôle de l'utilisateur
 * @returns Objet avec toutes les permissions
 */
export function getTicketPermissions(ticket: Ticket, role: UserRole) {
  return {
    canTransfer: ticketPermissions.canTransfer(ticket),
    canValidate: ticketPermissions.canValidate(role),
    canArchive: ticketPermissions.canArchive(role),
    canEdit: ticketPermissions.canEdit(role),
    canDuplicate: ticketPermissions.canDuplicate(role),
    canExport: ticketPermissions.canExport(role),
    canShare: ticketPermissions.canShare(role),
  };
}
