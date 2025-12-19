'use client';

import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import type { CompanyHistoryItem } from '@/services/companies/company-history';
import { CompanyTimelineItem } from './company-timeline-item';
import { CompanyHistorySearch } from './company-history-search';

type CompanyTimelineProps = {
  history: CompanyHistoryItem[];
  companyName: string;
};

/**
 * Composant Timeline pour afficher l'historique d'une entreprise
 * Affiche une timeline verticale avec les tickets, utilisateurs et modifications
 * 
 * Pattern identique à TicketTimeline pour cohérence
 * 
 * ✅ Enrichi avec recherche en temps réel (filtrage côté client)
 * 
 * @param history - Liste des événements historiques triés chronologiquement
 * @param companyName - Nom de l'entreprise pour l'affichage
 */
export function CompanyTimeline({
  history,
  companyName
}: CompanyTimelineProps) {
  const [filteredHistory, setFilteredHistory] = useState<CompanyHistoryItem[]>(history);

  // Mettre à jour filteredHistory quand history change (nouveau chargement)
  useEffect(() => {
    setFilteredHistory(history);
  }, [history]);

  const isEmpty = history.length === 0;
  const hasNoResults = !isEmpty && filteredHistory.length === 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0 border-b space-y-3">
        <CardTitle className="text-lg">Historique de l'entreprise</CardTitle>
        {!isEmpty && (
          <CompanyHistorySearch
            history={history}
            onFiltered={setFilteredHistory}
          />
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pt-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400">
            <History className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Aucun historique pour le moment</p>
          </div>
        ) : hasNoResults ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 dark:text-slate-400">
            <History className="mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Aucun résultat trouvé</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Essayez avec d'autres mots-clés
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredHistory.map((item) => (
              <CompanyTimelineItem key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

