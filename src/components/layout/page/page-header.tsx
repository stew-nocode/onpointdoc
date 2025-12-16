'use client';

import { ReactNode } from 'react';
import { StandardPageHeader } from './standard-page-header';
import type { PageHeaderConfig } from './types';

type PageHeaderProps = PageHeaderConfig;

/**
 * Header standardisé pour les pages de gestion
 * 
 * Supporte deux styles :
 * - Style classique : label + title (H2) + description + action
 * - Style standardisé : icon + title (H1) + description + actions
 * 
 * Utilise automatiquement le style standardisé si une icône est fournie,
 * sinon utilise le style classique pour la rétrocompatibilité.
 * 
 * @param label - Label au-dessus du titre (style classique)
 * @param title - Titre principal de la page
 * @param description - Description optionnelle sous le titre
 * @param action - Action unique à droite (style classique)
 * @param icon - Icône à côté du titre (style standardisé)
 * @param actions - Actions multiples à droite (style standardisé)
 */
export function PageHeader({
  label,
  title,
  description,
  action,
  icon,
  actions
}: PageHeaderProps) {
  // Si une icône est fournie, utiliser le style standardisé
  if (icon || actions) {
    return (
      <StandardPageHeader
        icon={icon}
        title={title}
        description={description}
        actions={actions || action}
      />
    );
  }

  // Sinon, utiliser le style classique (rétrocompatibilité)
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

