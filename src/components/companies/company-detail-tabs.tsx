'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { CompanyInfoCard } from './company-info-card';
import { CompanyTimeline } from './company-timeline';
import type { CompanyWithRelations } from '@/types/company-with-relations';
import type { CompanyHistoryItem } from '@/services/companies/company-history';

type CompanyDetailTabsProps = {
  company: CompanyWithRelations;
  history: CompanyHistoryItem[];
};

/**
 * Layout en tabs optimisé pour mobile/tablet pour les détails d'une entreprise
 *
 * Affiche trois tabs :
 * - Détails : Informations de l'entreprise
 * - Historique : Timeline des événements
 *
 * Seulement rendu sur mobile/tablet (< lg breakpoint)
 * Pattern identique à TicketDetailTabs pour cohérence
 */
export function CompanyDetailTabs({
  company,
  history
}: CompanyDetailTabsProps) {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="details">Détails</TabsTrigger>
        <TabsTrigger value="history">
          Historique
          {history.length > 0 && (
            <Badge variant="default" className="ml-2">
              {history.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Détails de l'entreprise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Nom
              </label>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {company.name}
              </p>
            </div>
          </CardContent>
        </Card>

        <CompanyInfoCard company={company} />
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <CompanyTimeline history={history} companyName={company.name} />
      </TabsContent>
    </Tabs>
  );
}

