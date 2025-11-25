'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';

type PageCardProps = {
  title: string;
  titleSuffix?: ReactNode;
  search?: ReactNode;
  quickFilters?: ReactNode;
  children: ReactNode;
};

/**
 * Card principale standardisée pour les pages de gestion
 * 
 * Structure :
 * - Header avec titre et recherche (optionnelle)
 * - Filtres rapides (optionnels, sous le header)
 * - Contenu principal (children)
 * 
 * @param title - Titre de la card
 * @param titleSuffix - Suffixe optionnel au titre (ex: count)
 * @param search - Composant de recherche optionnel
 * @param quickFilters - Composant de filtres rapides optionnel
 * @param children - Contenu principal de la card
 */
export function PageCard({
  title,
  titleSuffix,
  search,
  quickFilters,
  children
}: PageCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>
            {title}
            {titleSuffix && (
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                {titleSuffix}
              </span>
            )}
          </CardTitle>
          {search && <div>{search}</div>}
        </div>
      </CardHeader>
      {quickFilters && <div className="px-6 pb-4">{quickFilters}</div>}
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

