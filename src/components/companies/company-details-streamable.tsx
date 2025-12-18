import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { getCompanyById } from '@/services/companies/get-company-by-id';
import { CompanyInfoCard } from './company-info-card';

type CompanyDetailsProps = {
  companyId: string;
};

/**
 * Composant streamable pour les détails de l'entreprise
 * 
 * ✅ Optimisation Phase 1 : Streaming granulaire
 * - Composant séparé pour permettre le streaming
 * - Affiche les détails critiques en premier
 * - Wrapped dans Suspense dans la page parente
 */
export async function CompanyDetails({ companyId }: CompanyDetailsProps) {
  const company = await getCompanyById(companyId);

  if (!company) {
    notFound();
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Détails de l'entreprise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Nom
            </label>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              {company.name}
            </p>
          </div>

          {company.country && (
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Pays
              </label>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                {company.country.name}
              </p>
            </div>
          )}

          {company.focal_user && (
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Point focal
              </label>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                {company.focal_user.full_name}
              </p>
            </div>
          )}

          {company.sectors && company.sectors.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Secteurs
              </label>
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                {company.sectors.map((sector) => (
                  <span
                    key={sector.id}
                    className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {sector.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyInfoCard company={company} />
    </div>
  );
}

/**
 * Skeleton pour le composant CompanyDetails
 * 
 * Affiche un placeholder pendant le chargement
 */
export function CompanyDetailsSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-3 animate-pulse">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

