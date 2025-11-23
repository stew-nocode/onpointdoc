'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

type KPIDocumentationProps = {
  title: string;
  subtitle: string;
  definition: string;
  calculation: string;
  interpretation: string;
  className?: string;
};

/**
 * Composant de documentation pour les KPIs
 * Affiche une icône Info cliquable qui ouvre un Popover avec les détails
 *
 * @param title - Titre du KPI (ex: "MTTR Global")
 * @param subtitle - Sous-titre explicatif visible
 * @param definition - Définition business du KPI
 * @param calculation - Méthode de calcul détaillée
 * @param interpretation - Comment interpréter les résultats
 * @param className - Classes CSS additionnelles
 */
export function KPIDocumentation({
  title,
  subtitle,
  definition,
  calculation,
  interpretation,
  className
}: KPIDocumentationProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Afficher la documentation"
            >
              <Info className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-[500px] overflow-y-auto" align="start">
            <DocumentationContent
              title={title}
              definition={definition}
              calculation={calculation}
              interpretation={interpretation}
            />
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

/**
 * Contenu de la documentation dans le Popover
 */
function DocumentationContent({
  title,
  definition,
  calculation,
  interpretation
}: {
  title: string;
  definition: string;
  calculation: string;
  interpretation: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
          📊 {title}
        </h4>
      </div>

      <Section title="Définition" content={definition} />
      <Section title="Méthode de calcul" content={calculation} />
      <Section title="Interprétation" content={interpretation} />
    </div>
  );
}

/**
 * Section de documentation
 */
function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h5 className="font-medium text-slate-800 dark:text-slate-200 text-xs mb-1.5">
        {title}
      </h5>
      <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
        {content}
      </p>
    </div>
  );
}

