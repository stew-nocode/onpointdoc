/**
 * Section pour indiquer que le ticket concerne toutes les entreprises
 * 
 * Composant atomique pour la portée "all"
 */

'use client';

import type { BasicProfile } from '@/services/users';

type TicketScopeAllCompaniesProps = {
  contactUserId?: string;
  contactCompanyName?: string | null;
  contacts: BasicProfile[];
};

/**
 * Message informatif pour les tickets globaux (toutes les entreprises)
 */
export function TicketScopeAllCompanies({
  contactUserId,
  contactCompanyName,
  contacts
}: TicketScopeAllCompaniesProps) {
  const contactName = contactUserId
    ? contacts.find((c) => c.id === contactUserId)?.full_name || 'Contact'
    : null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
      <div className="flex items-start gap-2">
        <span className="text-amber-600 dark:text-amber-400">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Ticket Global
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Ce ticket sera visible par toutes les entreprises du système.
            {contactName && contactCompanyName && (
              <span className="block mt-1">
                Signalé par : {contactName} ({contactCompanyName})
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

