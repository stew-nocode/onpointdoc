'use client';

import React from 'react';
import { KPIDocumentation } from './kpi-documentation';
import type { DocumentationContent } from './dashboard-documentation-content';
import { cn } from '@/lib/utils';

type SectionTitleWithDocProps = {
  title: string;
  documentation: DocumentationContent;
  className?: string;
  children?: React.ReactNode; // Élément additionnel (ex: TrendIndicator)
};

/**
 * Composant de titre de section avec documentation intégrée
 * Utilisé pour les graphiques et tableaux
 *
 * @param title - Titre de la section
 * @param documentation - Contenu de documentation
 * @param className - Classes CSS additionnelles
 * @param children - Éléments additionnels (ex: TrendIndicator)
 */
export function SectionTitleWithDoc({
  title,
  documentation,
  className,
  children
}: SectionTitleWithDocProps) {
  return (
    <div className={cn('flex items-start justify-between gap-2', className)}>
      <div className="flex-1">
        <KPIDocumentation
          title={documentation.title}
          subtitle={documentation.subtitle}
          definition={documentation.definition}
          calculation={documentation.calculation}
          interpretation={documentation.interpretation}
        />
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}

