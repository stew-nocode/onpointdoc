import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Edit } from 'lucide-react';
import { Button } from '@/ui/button';
import { getCompanyById } from '@/services/companies/get-company-by-id';
import { getAdjacentCompanies } from '@/services/companies/navigation';
import { CompanyNavigationLink } from './company-navigation-link';

type CompanyHeaderProps = {
  companyId: string;
};

/**
 * Composant streamable pour le header de la page entreprise
 * 
 * ✅ Optimisation Phase 1 : Streaming granulaire
 * - Charge uniquement les données nécessaires pour le header
 * - Permet d'afficher le shell immédiatement
 * - Wrapped dans Suspense dans la page parente
 */
export async function CompanyHeader({ companyId }: CompanyHeaderProps) {
  // Charger uniquement le nom et la navigation (données minimales pour header)
  const [company, adjacentCompanies] = await Promise.all([
    getCompanyById(companyId),
    getAdjacentCompanies(companyId),
  ]);

  if (!company) {
    notFound();
  }

  const hasPrevious = adjacentCompanies.previous !== null;
  const hasNext = adjacentCompanies.next !== null;

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
      <div className="flex-1">
        <Link
          href="/config/companies"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Retour à la liste
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {company.name}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Navigation buttons */}
        <CompanyNavigationLink
          href={hasPrevious ? `/config/companies/${adjacentCompanies.previous}` : '#'}
          disabled={!hasPrevious}
          direction="previous"
          ariaLabel="Entreprise précédente"
        />
        <CompanyNavigationLink
          href={hasNext ? `/config/companies/${adjacentCompanies.next}` : '#'}
          disabled={!hasNext}
          direction="next"
          ariaLabel="Entreprise suivante"
        />

        {/* Edit button */}
        <Link href={`/config/companies/${companyId}?edit=true`}>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Éditer
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Skeleton pour le composant CompanyHeader
 */
export function CompanyHeaderSkeleton() {
  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4 animate-pulse">
      <div className="flex-1">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-2 h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-9 w-9 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-9 w-20 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

