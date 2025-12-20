'use client';

/**
 * Composant pour afficher une ligne d'entreprise dans le tableau
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (afficher une ligne d'entreprise)
 * - Composant réutilisable et testable
 * - Props typées explicitement
 * 
 * Pattern similaire à TaskRow pour cohérence
 */

import React from 'react';
import Link from 'next/link';
import { Eye, Edit, User, MapPin } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/ui/context-menu';
import { highlightText, formatDateShort, formatDateTimeFull } from '../utils/company-display';
import { CompanyAssistanceDurationCell } from './company-assistance-duration-cell';
import { CompanyInsightCell } from './company-insight-cell';
import type { CompanyWithRelations } from '@/types/company-with-relations';

type CompanyRowProps = {
  /**
   * Entreprise à afficher
   */
  company: CompanyWithRelations;

  /**
   * Fonction pour éditer l'entreprise
   */
  handleEdit: (companyId: string) => void;

  /**
   * Indique si l'utilisateur peut éditer l'entreprise
   */
  canEdit: boolean;

  /**
   * Terme de recherche pour surligner le texte
   */
  search?: string;
};

/**
 * Composant pour afficher une ligne d'entreprise
 * 
 * @param props - Propriétés du composant
 */
export function CompanyRow({
  company,
  handleEdit,
  canEdit,
  search
}: CompanyRowProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <tr
          key={company.id}
          id={company.id}
          data-company-id={company.id}
          className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
        >
          {/* Nom */}
          <td className="py-2.5 pr-4">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/config/companies/${company.id}`}
                className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-brand dark:hover:text-status-info truncate block max-w-[300px]"
              >
                {search ? highlightText(company.name, search) : company.name}
              </Link>
            </div>
          </td>

          {/* Pays */}
          <td className="py-2.5 pr-4">
            {company.country?.name ? (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {company.country.name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </td>

          {/* Point focal */}
          <td className="py-2.5 pr-4">
            {company.focal_user?.full_name ? (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                  {company.focal_user.full_name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </td>

          {/* Nombre d'utilisateurs (Insight) */}
          <td className="py-2.5 pr-4">
            <CompanyInsightCell
              value={company.users_count}
              tooltip={`${company.users_count} utilisateur${company.users_count > 1 ? 's' : ''} associé${company.users_count > 1 ? 's' : ''}`}
            />
          </td>

          {/* Total tickets (Insight) */}
          <td className="py-2.5 pr-4">
            <CompanyInsightCell
              value={company.tickets_count}
              tooltip={`${company.tickets_count} ticket${company.tickets_count > 1 ? 's' : ''} au total`}
            />
          </td>

          {/* Tickets ouverts (Insight) */}
          <td className="py-2.5 pr-4">
            <CompanyInsightCell
              value={company.open_tickets_count}
              tooltip={`${company.open_tickets_count} ticket${company.open_tickets_count > 1 ? 's' : ''} ouvert${company.open_tickets_count > 1 ? 's' : ''}`}
            />
          </td>

          {/* Durée d'assistance cumulée (Insight) */}
          <td className="py-2.5 pr-4">
            <CompanyAssistanceDurationCell durationMinutes={company.assistance_duration_minutes} />
          </td>

          {/* Date de création */}
          <td className="py-2.5 pr-4">
            {company.created_at ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatDateShort(company.created_at)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{formatDateTimeFull(company.created_at)}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </td>

          {/* Actions */}
          <td className="py-2.5 pr-4">
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/config/companies/${company.id}`}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voir l&apos;entreprise</p>
                </TooltipContent>
              </Tooltip>
              
              {canEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleEdit(company.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                    >
                      <Edit className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Éditer l&apos;entreprise</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </td>
        </tr>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem asChild>
          <Link href={`/config/companies/${company.id}`} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            Voir l&apos;entreprise
          </Link>
        </ContextMenuItem>
        {canEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleEdit(company.id)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Éditer l&apos;entreprise
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
