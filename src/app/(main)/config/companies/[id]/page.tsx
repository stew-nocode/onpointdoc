import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

import { getCompanyById } from '@/services/companies/get-company-by-id';
import { parsePeriodFromParams } from '@/lib/utils/period-utils';
import { Card, CardContent } from '@/ui/card';
import {
  CompanyDetailTabs,
  CompanyHeader,
  CompanyHeaderSkeleton,
  CompanyDetails,
  CompanyDetailsSkeleton,
  CompanyStats,
  CompanyStatsSkeleton,
  CompanyTimelineWrapper,
  CompanyTimelineSkeleton,
} from '@/components/companies';

type CompanyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; period?: string }>;
};

/**
 * Page de détail d'une entreprise
 * 
 * ✅ Optimisation Phase 1 : Streaming granulaire
 * - Shell statique immédiat (structure de la page)
 * - Header streamé en premier (nom + navigation)
 * - Détails streamés ensuite (contenu critique)
 * - Stats streamées indépendamment
 * - Timeline streamée en dernier (non critique)
 * 
 * Pattern identique à TicketDetailPage pour cohérence :
 * - Layout 2 colonnes sur desktop (détails à gauche, timeline à droite)
 * - Tabs sur mobile/tablet
 * - Navigation précédent/suivant
 * - Bouton d'édition
 * 
 * Principe Clean Code :
 * - Streaming granulaire avec Suspense boundaries
 * - Gestion d'erreur avec notFound() si entreprise non trouvée
 * - Responsive design avec tabs mobile et layout desktop
 */
export default async function CompanyDetailPage({
  params,
  searchParams
}: CompanyDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const { edit, period: periodParam } = resolvedSearchParams;
  const isEditMode = edit === 'true';

  // Si mode édition, charger l'entreprise complète (nécessaire pour le formulaire)
  // ✅ noStore() nécessaire en mode édition pour garantir les données les plus récentes
  if (isEditMode) {
    noStore();
    const company = await getCompanyById(id);
    if (!company) {
      notFound();
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/config/companies"
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              ← Retour à la liste
            </Link>
            <h1 className="mt-2 text-2xl font-bold">Édition : {company.name}</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Formulaire d&apos;édition à implémenter
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Mode vue : Streaming granulaire
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      {/* ✅ Header streamé en premier (nom + navigation) */}
      <Suspense fallback={<CompanyHeaderSkeleton />}>
        <CompanyHeader companyId={id} />
      </Suspense>

      {/* Contenu principal : Tabs sur mobile, 2 colonnes sur desktop */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        {/* Mobile/Tablet: Tabs (nécessite company + history) */}
        <div className="lg:hidden w-full">
          <Suspense fallback={<div className="h-full w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />}>
            <CompanyDetailTabsWrapper companyId={id} />
          </Suspense>
        </div>

        {/* Desktop: 2-column layout avec streaming granulaire */}
        <div className="hidden lg:flex lg:flex-1 lg:gap-4 lg:overflow-hidden">
          {/* Colonne gauche : Détails + Stats streamés indépendamment */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
            {/* ✅ Détails streamés en premier (contenu critique) */}
            <Suspense fallback={<CompanyDetailsSkeleton />}>
              <CompanyDetails companyId={id} />
            </Suspense>

            {/* ✅ Stats streamées ensuite (moins critique) */}
            <Suspense fallback={<CompanyStatsSkeleton />}>
              <CompanyStats companyId={id} period={periodParam} />
            </Suspense>
          </div>

          {/* Colonne droite : Timeline streamée en dernier (non critique) */}
          <div className="w-96 flex-shrink-0">
            <Suspense fallback={<CompanyTimelineSkeleton />}>
              <CompanyTimelineWrapper companyId={id} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper pour CompanyDetailTabs (nécessite company + history)
 * 
 * Utilisé uniquement sur mobile/tablet
 * Charge les données côté serveur et les passe au composant client
 */
async function CompanyDetailTabsWrapper({ companyId }: { companyId: string }) {
  const { CompanyDetailTabs } = await import('@/components/companies/company-detail-tabs');
  const { loadCompanyHistory } = await import('@/services/companies/company-history');
  
  const [company, history] = await Promise.all([
    getCompanyById(companyId),
    loadCompanyHistory(companyId),
  ]);

  if (!company) {
    notFound();
  }

  return <CompanyDetailTabs company={company} history={history} />;
}

