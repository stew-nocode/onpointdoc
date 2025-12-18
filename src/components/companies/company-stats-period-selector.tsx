'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PeriodSelector } from '@/components/dashboard/ceo/period-selector';
import type { Period } from '@/types/dashboard';

/**
 * Sélecteur de période pour les statistiques d'une entreprise
 * 
 * Réutilise le composant PeriodSelector du dashboard pour cohérence.
 * Met à jour l'URL avec le paramètre `period` pour déclencher le rechargement des données.
 * 
 * @see src/components/dashboard/ceo/period-selector.tsx
 */
export function CompanyStatsPeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPeriod = (searchParams.get('period') as Period) || 'month';
  
  const handlePeriodChange = (period: Period) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period);
    router.push(`?${params.toString()}`, { scroll: false });
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        Période :
      </span>
      <PeriodSelector 
        value={currentPeriod} 
        onChange={handlePeriodChange} 
      />
    </div>
  );
}

