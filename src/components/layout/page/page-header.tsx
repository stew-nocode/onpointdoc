'use client';

import { ReactNode } from 'react';

type PageHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Header standardisé pour les pages de gestion
 * 
 * Structure :
 * - Label (optionnel, uppercase, tracking-wide)
 * - Titre principal (H2)
 * - Description (optionnelle)
 * - Action à droite (optionnelle, ex: bouton de création)
 * 
 * @param label - Label au-dessus du titre (ex: "Tickets")
 * @param title - Titre principal de la page
 * @param description - Description optionnelle sous le titre
 * @param action - Action à droite (ex: bouton de création)
 */
export function PageHeader({ label, title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        {label && (
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
        )}
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

