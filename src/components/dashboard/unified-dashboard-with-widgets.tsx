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
  staticOnly?: boolean;     // Afficher uniquement les KPIs statiques
  filteredOnly?: boolean;   // Afficher uniquement les widgets filtrés (sans KPIs statiques)
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
  staticOnly = false,
  filteredOnly = false,
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
   * 
   * @param selectedPeriod - Période standard (week, month, quarter, year) ou année spécifique
   * @param customStartDate - Date de début personnalisée (optionnelle)
   * @param customEndDate - Date de fin personnalisée (optionnelle)
   */
  const loadData = useCallback(async (
    selectedPeriod: Period | string,
    customStartDate?: string,
    customEndDate?: string
  ) => {
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
      
      // Ajouter les dates personnalisées si fournies
      if (customStartDate && customEndDate) {
        params.set('startDate', customStartDate);
        params.set('endDate', customEndDate);
        if (process.env.NODE_ENV === 'development') {
          console.log('[Dashboard] Loading with custom dates:', {
            period: selectedPeriod,
            startDate: customStartDate,
            endDate: customEndDate,
          });
        }
      }

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
  const handleDateRangeChange = useCallback((range: { from?: Date; to?: Date } | undefined) => {
    // Réinitialiser l'année AVANT de définir la période personnalisée
    setSelectedYear(undefined);
    
    // Définir la période personnalisée
    // Convertir en DateRange | undefined (DateRange nécessite from et to)
    const dateRange: DateRange | undefined = range?.from && range?.to 
      ? { from: range.from, to: range.to }
      : undefined;
    setDateRange(dateRange);
    
    if (range?.from && range?.to) {
      // Utiliser une période personnalisée - transmettre les dates à l'API
      setPeriod('year'); // Pour la compatibilité avec les widgets
      
      // Transmettre les dates personnalisées à loadData
      loadData('year', range.from.toISOString(), range.to.toISOString());
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Nouvelle plage personnalisée sélectionnée:', {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        });
      }
    } else {
      // Si on efface la période personnalisée, réinitialiser aussi
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Période personnalisée désélectionnée');
      }
    }
  }, [loadData]);

  const handleYearChange = useCallback(
    (year: string | undefined) => {
      // Normaliser : traiter les chaînes vides comme undefined
      const normalizedYear = year === '' || year === undefined ? undefined : year;
      
      // Réinitialiser la période personnalisée AVANT de définir l'année
      setDateRange(undefined);
      
      // Définir l'année
      setSelectedYear(normalizedYear);
      
      if (normalizedYear) {
        // Mettre à jour la période avec l'année sélectionnée
        setPeriod(normalizedYear as Period); // L'année est passée comme période
        loadData(normalizedYear as Period);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[Dashboard] Année sélectionnée:', normalizedYear);
        }
      } else {
        // Si on désélectionne l'année, réinitialiser aussi la période
        if (process.env.NODE_ENV === 'development') {
          console.log('[Dashboard] Année désélectionnée, réinitialisation de la période');
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

  // ✅ OPTIMISÉ : Écouter uniquement les tickets pertinents (produit + période)
  const OBC_PRODUCT_ID = '91304e02-2ce6-4811-b19d-1cae091a6fde'; // TODO: Rendre configurable
  useRealtimeDashboardData({
    period,
    productId: OBC_PRODUCT_ID, // ✅ Filtre par produit
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

  // Séparer les widgets statiques (temps réel) des widgets filtrés
  // Les widgets statiques s'affichent AVANT les filtres de période
  const { staticWidgets, filteredWidgets } = useMemo(() => {
    const staticKPIs: typeof widgetConfig.visibleWidgets = [];
    const filtered: typeof widgetConfig.visibleWidgets = [];

    widgetConfig.visibleWidgets.forEach((widgetId) => {
      // Importer dynamiquement le registry pour vérifier le layoutType
      const { WIDGET_REGISTRY } = require('./widgets/registry');
      const widgetDef = WIDGET_REGISTRY[widgetId];
      
      if (widgetDef?.layoutType === 'kpi-static') {
        staticKPIs.push(widgetId);
      } else {
        filtered.push(widgetId);
      }
    });

    return {
      staticWidgets: staticKPIs,
      filteredWidgets: filtered,
    };
  }, [widgetConfig.visibleWidgets]);

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

  // Détecter et résoudre les conflits entre les sélecteurs
  useEffect(() => {
    const hasDateRange = dateRange?.from && dateRange?.to;
    const hasSelectedYear = !!selectedYear;

    // Conflit : les deux sont définis simultanément
    if (hasDateRange && hasSelectedYear) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Conflit détecté : dateRange et selectedYear sont tous deux définis. Réinitialisation de selectedYear.');
      }
      // Priorité : dateRange > selectedYear, donc on réinitialise selectedYear
      setSelectedYear(undefined);
    }
  }, [dateRange, selectedYear]);

  // Mettre à jour les alertes dans les données (mémorisé pour éviter les re-renders)
  // Comparaison fine : ne recréer que si les propriétés essentielles changent
  // Mettre à jour la période dans les données du dashboard pour les widgets
  // La période vient toujours de l'état local (period, selectedYear, ou dateRange)
  const dashboardDataWithFilteredAlerts = useMemo(() => {
    // Déterminer la période active et les dates
    let activePeriod: Period | string;
    let customPeriodStart: string | undefined;
    let customPeriodEnd: string | undefined;
    
    // Priorité : dateRange > selectedYear > period
    if (dateRange?.from && dateRange?.to) {
      // Période personnalisée active
      activePeriod = 'custom'; // Indiquer que c'est une période personnalisée
      customPeriodStart = dateRange.from.toISOString();
      customPeriodEnd = dateRange.to.toISOString();
    } else if (selectedYear) {
      activePeriod = selectedYear;
    } else {
      activePeriod = period || data.period;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Dashboard] Active period for widgets:', {
        selectedYear,
        period,
        dataPeriod: data.period,
        activePeriod,
        activeFilterType,
        hasCustomDates: !!(customPeriodStart && customPeriodEnd),
        customStart: customPeriodStart,
        customEnd: customPeriodEnd,
      });
    }
    
    return {
      ...data,
      alerts: filteredAlerts,
      // S'assurer que la période est toujours à jour avec l'état local
      period: activePeriod as Period,
      // Transmettre les dates personnalisées si disponibles
      ...(customPeriodStart && customPeriodEnd && {
        periodStart: customPeriodStart,
        periodEnd: customPeriodEnd,
      }),
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
    dateRange, // Période personnalisée
    activeFilterType,
  ]); // Dépendances granulaires au lieu de l'objet complet

  // Mode "staticOnly" : afficher uniquement les KPIs statiques (pour la section kpis)
  if (staticOnly) {
    return (
      <div>
        {staticWidgets.length > 0 && (
          <Suspense fallback={null}>
            <DashboardWidgetGrid
              widgets={staticWidgets}
              dashboardData={dashboardDataWithFilteredAlerts}
              hideSectionLabels={false}
            />
          </Suspense>
        )}
      </div>
    );
  }

  // Mode "filteredOnly" : afficher uniquement les widgets filtrés (pour la card principale)
  if (filteredOnly) {
    return (
      <div className="space-y-6">
        {/* === Filtres de période === */}
        <div className="flex items-center justify-between">
          <WidgetPreferencesDialog widgetConfig={widgetConfig} onUpdate={loadWidgetConfig} />
          <div className="flex items-center gap-3">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <YearSelector 
              key={`year-selector-${selectedYear || 'none'}`}
              value={selectedYear} 
              onValueChange={handleYearChange} 
              className="w-[120px]"
              isActive={activeFilterType === 'year'}
            />
            <CustomPeriodSelector 
              key={`custom-period-${dateRange?.from?.toISOString() || 'none'}-${dateRange?.to?.toISOString() || 'none'}`}
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

        {/* === Widgets filtrés (KPIs, Charts, Tables, Full-width) === */}
        {filteredWidgets.length > 0 ? (
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardWidgetGrid
              widgets={filteredWidgets}
              dashboardData={dashboardDataWithFilteredAlerts}
            />
          </Suspense>
        ) : widgetConfig.visibleWidgets.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Aucun widget configuré pour votre rôle. Contactez un administrateur pour activer des widgets.
          </div>
        ) : null}
      </div>
    );
  }

  // Mode "complet" : afficher tout (KPIs statiques + filtres + widgets filtrés)
  return (
    <div className="space-y-6">
      {/* === SECTION 1 : KPIs STATIQUES (Temps réel, non filtrés) - Admin/Direction only === */}
      {staticWidgets.length > 0 && (
        <Suspense fallback={null}>
          <DashboardWidgetGrid
            widgets={staticWidgets}
            dashboardData={dashboardDataWithFilteredAlerts}
            hideSectionLabels={false}
          />
        </Suspense>
      )}

      {/* === SECTION 2 : Filtres de période === */}
      <div className="flex items-center justify-between">
        <WidgetPreferencesDialog widgetConfig={widgetConfig} onUpdate={loadWidgetConfig} />
        <div className="flex items-center gap-3">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <YearSelector 
            key={`year-selector-${selectedYear || 'none'}`}
            value={selectedYear} 
            onValueChange={handleYearChange} 
            className="w-[120px]"
            isActive={activeFilterType === 'year'}
          />
          <CustomPeriodSelector 
            key={`custom-period-${dateRange?.from?.toISOString() || 'none'}-${dateRange?.to?.toISOString() || 'none'}`}
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

      {/* === SECTION 3 : Widgets filtrés (KPIs, Charts, Tables, Full-width) === */}
      {filteredWidgets.length > 0 ? (
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardWidgetGrid
            widgets={filteredWidgets}
            dashboardData={dashboardDataWithFilteredAlerts}
          />
        </Suspense>
      ) : widgetConfig.visibleWidgets.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Aucun widget configuré pour votre rôle. Contactez un administrateur pour activer des widgets.
        </div>
      ) : null}
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

