'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import type { Period, UnifiedDashboardData } from '@/types/dashboard';
import type { DashboardRole, UserDashboardConfig } from '@/types/dashboard-widgets';
import { filterAlertsByRole } from '@/lib/utils/role-filters';
import { DashboardWidgetGrid } from './widgets';
import { CustomPeriodSelector } from './ceo/custom-period-selector';
import { YearSelector } from './ceo/year-selector';
import { WidgetPreferencesDialog } from './user/widget-preferences-dialog';
import { DashboardSkeleton } from './dashboard-skeleton';
import { Loader2 } from 'lucide-react';
import { useRealtimeDashboardData } from '@/hooks/dashboard/use-realtime-dashboard-data';
import { useRealtimeWidgetConfig } from '@/hooks/dashboard/use-realtime-widget-config';
import { usePerformanceMeasure, useRenderCount } from '@/hooks/performance';
import { DateRange } from 'react-day-picker';
import { getPeriodDates } from '@/services/dashboard/period-utils';

type UnifiedDashboardWithWidgetsProps = {
  role: DashboardRole;
  profileId: string;
  initialData: UnifiedDashboardData;
  initialPeriod: Period;
  initialWidgetConfig: UserDashboardConfig;
};

/**
 * Dashboard unifié utilisant le système de widgets
 * 
 * Charge la configuration des widgets depuis la DB et affiche uniquement
 * les widgets visibles pour l'utilisateur (affectés au rôle - masqués par l'utilisateur)
 * 
 * @param role - Rôle de l'utilisateur
 * @param profileId - ID du profil utilisateur
 * @param initialData - Données initiales chargées côté serveur
 * @param initialPeriod - Période initiale
 * @param initialWidgetConfig - Configuration initiale des widgets (chargée côté serveur)
 */
/**
 * Composant Dashboard - Version interne non memoizée
 * 
 * Logique principale du composant.
 */
function UnifiedDashboardWithWidgetsComponent({
  role,
  profileId,
  initialData,
  initialPeriod,
  initialWidgetConfig,
}: UnifiedDashboardWithWidgetsProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<UnifiedDashboardData>(initialData);
  const [widgetConfig, setWidgetConfig] = useState<UserDashboardConfig>(initialWidgetConfig);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
  
  // Initialiser la plage de dates en fonction de la période initiale
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const { startDate, endDate } = getPeriodDates(initialPeriod);
    return {
      from: new Date(startDate),
      to: new Date(endDate)
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mesures de performance (dev uniquement)
  const { startMeasure, endMeasure } = usePerformanceMeasure({
    name: 'DashboardRender',
    measureRender: true,
    logToConsole: process.env.NODE_ENV === 'development',
  });
  const renderCount = useRenderCount({
    componentName: 'UnifiedDashboardWithWidgets',
    warningThreshold: 5,
  });

  /**
   * Charge les données pour une période donnée
   */
  const loadData = useCallback(async (selectedPeriod: Period | string) => {
    // Mesure du temps de chargement (dev uniquement)
    const loadStartTime = performance.now();
    if (process.env.NODE_ENV === 'development') {
      console.time('⏱️ DashboardDataLoad');
    }

    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      params.set('period', selectedPeriod);

      const response = await fetch(`/api/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const newData: UnifiedDashboardData = await response.json();
      
      // Log pour debug (dev uniquement)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Data loaded from API:', {
          role: newData.role,
          period: newData.period,
          periodStart: newData.periodStart,
          periodEnd: newData.periodEnd,
          hasStrategic: !!newData.strategic,
          strategicFluxOpened: newData.strategic?.flux?.opened,
          strategicFluxResolved: newData.strategic?.flux?.resolved,
          strategicMTTR: newData.strategic?.mttr?.global,
          strategicData: newData.strategic, // Structure complète pour debug
        });
      }
      
      setData(newData);

      // Logger le temps de chargement (dev uniquement)
      if (process.env.NODE_ENV === 'development') {
        const loadDuration = performance.now() - loadStartTime;
        console.timeEnd('⏱️ DashboardDataLoad');
        const rating = loadDuration < 500 ? '✅' : loadDuration < 1000 ? '⚠️' : '❌';
        console.log(`${rating} DashboardDataLoad: ${Math.round(loadDuration)}ms`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[Dashboard] Erreur lors du chargement des données:', err);
        console.timeEnd('⏱️ DashboardDataLoad');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Charge la configuration des widgets depuis l'API
   */
  const loadWidgetConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/widgets/config?profileId=${profileId}&role=${role}`);
      if (!response.ok) {
        return;
      }
      const config: UserDashboardConfig = await response.json();
      setWidgetConfig(config);
    } catch (err) {
      // Ignorer les erreurs silencieusement
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[Dashboard] Erreur lors du chargement de la config widgets:', err);
      }
    }
  }, [profileId, role]);

  /**
   * Gère le changement de période
   */
  const handlePeriodChange = useCallback(
    (newPeriod: Period) => {
      setPeriod(newPeriod);
      // Si on change de période, on réinitialise l'année si c'était une sélection d'année
      // (Logique à affiner selon le besoin métier exact)
      loadData(newPeriod);
    },
    [loadData]
  );

  /**
   * Gère le changement de période via le sélecteur personnalisé
   */
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    setSelectedYear(undefined); // Réinitialiser l'année si on utilise une plage personnalisée
    
    if (range?.from && range?.to) {
      // Utiliser une période personnalisée (on passe les dates directement)
      // Pour les widgets, on utilise 'year' comme période mais avec une plage personnalisée
      // Les widgets devront gérer cette plage via dateRange dans le contexte ou les props
      setPeriod('year'); // Utiliser 'year' comme période par défaut pour les plages personnalisées
      
      // Recharger les données du dashboard avec la nouvelle plage
      loadData('year');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Nouvelle plage sélectionnée:', {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        });
      }
    }
  }, [loadData]);

  const handleYearChange = useCallback(
    (year: string | undefined) => {
      setSelectedYear(year);
      setDateRange(undefined); // Réinitialiser la plage personnalisée si on utilise l'année
      
      if (year) {
        // Mettre à jour la période avec l'année sélectionnée
        setPeriod(year as Period); // L'année est passée comme période
        loadData(year as Period);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Année sélectionnée:', year);
        }
      }
    },
    [loadData]
  );

  // Références stables pour les callbacks (évite les réabonnements)
  const loadDataRef = useRef<((selectedPeriod: Period) => Promise<void>) | undefined>(undefined);
  const loadWidgetConfigRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const periodRef = useRef<Period>(period);

  // Mettre à jour les refs à chaque changement de fonction
  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  useEffect(() => {
    loadWidgetConfigRef.current = loadWidgetConfig;
  }, [loadWidgetConfig]);

  // Mettre à jour periodRef quand period change
  useEffect(() => {
    periodRef.current = period;
  }, [period]);

  // Callbacks stables pour les hooks realtime (évite les réabonnements)
  // Utilise periodRef pour éviter la dépendance à period
  const stableOnDataChange = useCallback(() => {
    loadDataRef.current?.(periodRef.current);
  }, []); // Pas de dépendance à period

  const stableOnConfigChange = useCallback(() => {
    loadWidgetConfigRef.current?.();
  }, []);

  // Écouter les changements temps réel des données
  useRealtimeDashboardData({
    period,
    onDataChange: stableOnDataChange,
  });

  // Écouter les changements temps réel de la configuration des widgets
  useRealtimeWidgetConfig({
    profileId,
    role,
    onConfigChange: stableOnConfigChange,
  });

  // Filtrer les alertes selon le rôle (mémorisé pour éviter les recalculs)
  const filteredAlerts = useMemo(
    () => filterAlertsByRole(data.alerts, role),
    [data.alerts, role]
  );

  // Déterminer quel sélecteur est actif pour l'affichage visuel
  // Priorité : dateRange > selectedYear > aucun (période standard)
  const activeFilterType = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return 'custom-period';
    }
    if (selectedYear) {
      return 'year';
    }
    return 'none';
  }, [dateRange, selectedYear]);

  // Mettre à jour les alertes dans les données (mémorisé pour éviter les re-renders)
  // Comparaison fine : ne recréer que si les propriétés essentielles changent
  // Mettre à jour la période dans les données du dashboard pour les widgets
  // La période vient toujours de l'état local (period, selectedYear, ou dateRange)
  const dashboardDataWithFilteredAlerts = useMemo(() => {
    // Déterminer la période active : année sélectionnée > période > période par défaut
    const activePeriod: Period | string = selectedYear || period || data.period;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dashboard] Active period for widgets:', {
        selectedYear,
        period,
        dataPeriod: data.period,
        activePeriod,
        activeFilterType,
      });
    }
    
    return {
      ...data,
      alerts: filteredAlerts,
      // S'assurer que la période est toujours à jour avec l'état local
      period: activePeriod as Period,
    };
  }, [
    data.role,
    data.strategic,
    data.team,
    data.personal,
    data.config,
    data.periodStart,
    data.periodEnd,
    data.period, // Garder data.period comme fallback
    filteredAlerts,
    period, // Période de l'état local (week, month, quarter, year)
    selectedYear, // Année sélectionnée (ex: "2024")
    activeFilterType,
  ]); // Dépendances granulaires au lieu de l'objet complet

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <WidgetPreferencesDialog widgetConfig={widgetConfig} onUpdate={loadWidgetConfig} />
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <YearSelector 
            value={selectedYear} 
            onValueChange={handleYearChange} 
            className="w-[120px]"
            isActive={activeFilterType === 'year'}
          />
          <CustomPeriodSelector 
            date={dateRange} 
            onSelect={handleDateRangeChange}
            isActive={activeFilterType === 'custom-period'}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Affichage des widgets via DashboardWidgetGrid avec Suspense pour streaming */}
      {widgetConfig.visibleWidgets.length > 0 ? (
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardWidgetGrid
            widgets={widgetConfig.visibleWidgets}
            dashboardData={dashboardDataWithFilteredAlerts}
          />
        </Suspense>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Aucun widget configuré pour votre rôle. Contactez un administrateur pour activer des widgets.
        </div>
      )}
    </div>
  );
}

/**
 * Composant exporté avec memoization pour éviter les re-renders inutiles
 * 
 * Ne se re-rend que si les props changent réellement.
 */
export const UnifiedDashboardWithWidgets = React.memo(
  UnifiedDashboardWithWidgetsComponent,
  (prevProps, nextProps) => {
    // Comparer les props primitives
    if (
      prevProps.role !== nextProps.role ||
      prevProps.profileId !== nextProps.profileId ||
      prevProps.initialPeriod !== nextProps.initialPeriod
    ) {
      return false; // Props différentes = re-render
    }

    // Comparer initialData par référence (si l'objet change, re-render)
    // On pourrait optimiser davantage en comparant les propriétés individuelles
    if (prevProps.initialData !== nextProps.initialData) {
      return false;
    }

    // Comparer initialWidgetConfig par référence
    if (prevProps.initialWidgetConfig !== nextProps.initialWidgetConfig) {
      return false;
    }

    // Props identiques = pas de re-render
    return true;
  }
);

UnifiedDashboardWithWidgets.displayName = 'UnifiedDashboardWithWidgets';

