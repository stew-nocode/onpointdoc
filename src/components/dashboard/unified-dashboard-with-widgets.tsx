'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Period, UnifiedDashboardData } from '@/types/dashboard';
import type { DashboardRole, UserDashboardConfig } from '@/types/dashboard-widgets';
import { filterAlertsByRole } from '@/lib/utils/role-filters';
import { DashboardWidgetGrid } from './widgets';
import { DashboardSkeleton } from './dashboard-skeleton';
import { DashboardFiltersBar } from './dashboard-filters-bar';
import { parseDashboardFiltersFromParams } from '@/lib/utils/dashboard-filters-utils';
import { useRealtimeDashboardData } from '@/hooks/dashboard/use-realtime-dashboard-data';
import { useRealtimeWidgetConfig } from '@/hooks/dashboard/use-realtime-widget-config';
import { usePerformanceMeasure, useRenderCount } from '@/hooks/performance';
import { DateRange } from 'react-day-picker';
import { getPeriodDates } from '@/services/dashboard/period-utils';
import { WIDGET_REGISTRY } from './widgets/registry';

type UnifiedDashboardWithWidgetsProps = {
  role: DashboardRole;
  profileId: string;
  initialData: UnifiedDashboardData;
  initialPeriod: Period | string; // Period (week, month, quarter, year) OU année spécifique ("2024")
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [period, setPeriod] = useState<Period | string>(initialPeriod);
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

  // ✅ OPTIMISATION : Cache en mémoire pour éviter les requêtes dupliquées
  const dashboardCacheRef = useRef<Map<string, { data: UnifiedDashboardData; timestamp: number }>>(new Map());

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
   * Charge les données pour une période donnée (avec SWR intégré)
   *
   * ✅ OPTIMISÉ : Utilise un cache local pour éviter les requêtes répétées
   *
   * @param selectedPeriod - Période standard (week, month, quarter, year) ou année spécifique
   * @param customStartDate - Date de début personnalisée (optionnelle)
   * @param customEndDate - Date de fin personnalisée (optionnelle)
   */
  const loadData = useCallback(async (
    selectedPeriod: Period | string,
    customStartDate?: string,
    customEndDate?: string,
    includeOldOverride?: boolean // ✅ Paramètre optionnel pour override includeOld depuis l'état local
  ) => {
    // Mesure du temps de chargement (dev uniquement)
    if (process.env.NODE_ENV === 'development') {
      console.time('⏱️ DashboardDataLoad');
    }

    setIsLoading(true);
    setError(null);
    try {
      // ✅ Utiliser window.location.search pour avoir les paramètres à jour
      // searchParams peut ne pas être à jour immédiatement après router.push()
      const currentUrlParams = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams(searchParams.toString());
      const params = new URLSearchParams(currentUrlParams.toString());
      params.set('period', selectedPeriod);

      // ✅ Si includeOldOverride est fourni, l'utiliser directement (plus rapide que d'attendre l'URL)
      if (includeOldOverride !== undefined) {
        if (includeOldOverride) {
          params.delete('includeOld'); // true = valeur par défaut, on retire le paramètre
        } else {
          params.set('includeOld', 'false');
        }
      }
      // Sinon, on garde la valeur de l'URL (comportement par défaut)

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
      } else {
        // Supprimer les dates personnalisées si on utilise une période standard
        params.delete('startDate');
        params.delete('endDate');
      }

      const url = `/api/dashboard?${params.toString()}`;

      // ✅ OPTIMISATION : Cache simple en mémoire (évite requêtes dupliquées immédiates)
      const cacheKey = url;
      const cachedData = dashboardCacheRef.current.get(cacheKey);
      const now = Date.now();

      // Si données en cache et fraîches (< 5s), les utiliser
      if (cachedData && (now - cachedData.timestamp) < 5000) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Dashboard] Using cached data (age: ' + (now - cachedData.timestamp) + 'ms)');
        }
        setData(cachedData.data);
        setIsLoading(false);
        if (process.env.NODE_ENV === 'development') {
          console.timeEnd('⏱️ DashboardDataLoad');
        }
        return;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const newData: UnifiedDashboardData = await response.json();

      // ✅ Mettre en cache pour 5s
      dashboardCacheRef.current.set(cacheKey, {
        data: newData,
        timestamp: now,
      });

      // Nettoyer le cache (garder max 10 entrées)
      if (dashboardCacheRef.current.size > 10) {
        const oldestKey = dashboardCacheRef.current.keys().next().value;
        if (oldestKey) {
          dashboardCacheRef.current.delete(oldestKey);
        }
      }

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
        console.timeEnd('⏱️ DashboardDataLoad');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      if (process.env.NODE_ENV === 'development') {
        console.error('[Dashboard] Erreur lors du chargement des données:', err);
        console.timeEnd('⏱️ DashboardDataLoad');
      }
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Ne pas dépendre de searchParams pour éviter les boucles infinies

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
        console.error('[Dashboard] Erreur lors du chargement de la config widgets:', err);
      }
    }
  }, [profileId, role]);

  /**
   * Gère le changement de période
   */
  const handlePeriodChange = useCallback(
    async (newPeriod: Period) => {
      setPeriod(newPeriod);
      // Si on change de période, on réinitialise l'année et les dates personnalisées
      setSelectedYear(undefined);
      setDateRange(undefined);

      // ✅ CORRECTION : Charger les données AVANT de mettre à jour l'URL
      // Cela évite que le Server Component se re-rende avec les nouvelles données pendant le chargement
      await loadData(newPeriod);

      // Mettre à jour l'URL APRÈS le chargement (pour historique et partage de lien)
      const params = new URLSearchParams(window.location.search);
      params.set('period', newPeriod);
      // Supprimer les dates personnalisées si présentes
      params.delete('startDate');
      params.delete('endDate');

      const newUrl = `${pathname}?${params.toString()}`;
      // Utiliser window.history.replaceState au lieu de router.push pour éviter le re-render
      window.history.replaceState(null, '', newUrl);
    },
    [loadData, router, pathname]
  );

  /**
   * Gère le changement de période via le sélecteur personnalisé
   */
  const handleDateRangeChange = useCallback(async (range: { from?: Date; to?: Date } | undefined) => {
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

      // ✅ CORRECTION : Charger les données AVANT de mettre à jour l'URL
      await loadData('year', range.from.toISOString(), range.to.toISOString());

      // Mettre à jour l'URL APRÈS le chargement (pour historique et partage de lien)
      const params = new URLSearchParams(window.location.search);
      params.set('startDate', range.from.toISOString());
      params.set('endDate', range.to.toISOString());
      params.delete('period'); // Supprimer le paramètre period lors de l'utilisation de dates personnalisées

      const newUrl = `${pathname}?${params.toString()}`;
      // Utiliser window.history.replaceState au lieu de router.push pour éviter le re-render
      window.history.replaceState(null, '', newUrl);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Nouvelle plage personnalisée sélectionnée:', {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        });
      }
    } else {
      // Si on efface la période personnalisée, supprimer les paramètres de date personnalisés
      const params = new URLSearchParams(window.location.search);
      params.delete('startDate');
      params.delete('endDate');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      // Utiliser window.history.replaceState au lieu de router.push pour éviter le re-render
      window.history.replaceState(null, '', newUrl);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Période personnalisée désélectionnée');
      }
    }
  }, [loadData, router, pathname]);

  const handleYearChange = useCallback(
    async (year: string | undefined) => {
      // Normaliser : traiter les chaînes vides comme undefined
      const normalizedYear = year === '' || year === undefined ? undefined : year;

      // Réinitialiser la période personnalisée AVANT de définir l'année
      setDateRange(undefined);

      // Définir l'année
      setSelectedYear(normalizedYear);

      if (normalizedYear) {
        // Mettre à jour la période avec l'année sélectionnée
        setPeriod(normalizedYear as Period); // L'année est passée comme période

        // ✅ CORRECTION : Charger les données AVANT de mettre à jour l'URL
        await loadData(normalizedYear as Period);

        // Mettre à jour l'URL APRÈS le chargement (pour historique et partage de lien)
        const params = new URLSearchParams(window.location.search);
        params.set('period', normalizedYear);
        // Supprimer les dates personnalisées si présentes
        params.delete('startDate');
        params.delete('endDate');

        const newUrl = `${pathname}?${params.toString()}`;
        // Utiliser window.history.replaceState au lieu de router.push pour éviter le re-render
        window.history.replaceState(null, '', newUrl);

        if (process.env.NODE_ENV === 'development') {
          console.log('[Dashboard] Année sélectionnée:', normalizedYear);
        }
      } else {
        // Si on désélectionne l'année, supprimer le paramètre period de l'URL
        const params = new URLSearchParams(window.location.search);
        params.delete('period');
        params.delete('startDate');
        params.delete('endDate');
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        // Utiliser window.history.replaceState au lieu de router.push pour éviter le re-render
        window.history.replaceState(null, '', newUrl);

        if (process.env.NODE_ENV === 'development') {
          console.log('[Dashboard] Année désélectionnée, réinitialisation de la période');
        }
      }
    },
    [loadData, router, pathname]
  );

  // Références stables pour les callbacks (évite les réabonnements)
  const loadDataRef = useRef<((selectedPeriod: Period | string) => Promise<void>) | undefined>(undefined);
  const loadWidgetConfigRef = useRef<(() => Promise<void>) | undefined>(undefined);
  const periodRef = useRef<Period | string>(period);

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

  // Récupérer includeOld depuis les paramètres URL
  const parsedFilters = useMemo(() => {
    return parseDashboardFiltersFromParams(Object.fromEntries(searchParams.entries()));
  }, [searchParams]);
  
  // État local pour includeOld (mis à jour immédiatement lors du toggle)
  const [localIncludeOld, setLocalIncludeOld] = useState<boolean>(
    parsedFilters?.includeOld ?? true
  );
  
  // Synchroniser avec searchParams quand il change (mais pas lors du toggle initial)
  useEffect(() => {
    const urlIncludeOld = parsedFilters?.includeOld ?? true;
    setLocalIncludeOld(urlIncludeOld);
  }, [parsedFilters?.includeOld]);
  
  const includeOld = localIncludeOld; // Utiliser l'état local pour une réactivité immédiate

  /**
   * Gère le changement de includeOld
   */
  const handleIncludeOldChange = useCallback(
    async (newIncludeOld: boolean) => {
      // ✅ Mettre à jour l'état local immédiatement pour une réactivité instantanée
      setLocalIncludeOld(newIncludeOld);

      // ✅ CORRECTION : Recharger les données AVANT de mettre à jour l'URL
      const params = new URLSearchParams(window.location.search);
      const urlPeriod = params.get('period');
      const urlStartDate = params.get('startDate');
      const urlEndDate = params.get('endDate');

      if (urlStartDate && urlEndDate) {
        await loadData('year', urlStartDate, urlEndDate, newIncludeOld);
      } else if (urlPeriod) {
        await loadData(urlPeriod, undefined, undefined, newIncludeOld);
      } else {
        await loadData(period, undefined, undefined, newIncludeOld);
      }

      // Mettre à jour l'URL APRÈS le chargement (pour historique et partage de lien)
      if (newIncludeOld) {
        // Si on active, retirer le paramètre (valeur par défaut = true)
        params.delete('includeOld');
      } else {
        // Si on désactive, ajouter explicitement false
        params.set('includeOld', 'false');
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      // Utiliser window.history.replaceState au lieu de router.push pour éviter le re-render
      window.history.replaceState(null, '', newUrl);
    },
    [pathname, loadData, period]
  );

  /**
   * Gère le rafraîchissement manuel des données
   */
  const handleRefresh = useCallback(() => {
    const urlPeriod = searchParams.get('period');
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    // ✅ Passer localIncludeOld directement pour éviter la latence de l'URL
    if (urlStartDate && urlEndDate) {
      loadData('year', urlStartDate, urlEndDate, localIncludeOld);
    } else if (urlPeriod) {
      loadData(urlPeriod, undefined, undefined, localIncludeOld);
    } else {
      loadData(period, undefined, undefined, localIncludeOld);
    }
  }, [loadData, period, localIncludeOld, searchParams]); // ✅ Inclure localIncludeOld pour utiliser la valeur à jour

  /**
   * Synchroniser l'état local avec les paramètres URL après router.refresh()
   *
   * Quand router.refresh() est appelé, le Server Component se recharge avec les nouvelles données
   * basées sur les paramètres URL. On surveille les changements d'URL pour synchroniser l'état.
   */
  useEffect(() => {
    const urlPeriod = searchParams.get('period');
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');

    // Si l'URL contient des dates personnalisées
    if (urlStartDate && urlEndDate) {
      const newDateRange: DateRange = {
        from: new Date(urlStartDate),
        to: new Date(urlEndDate)
      };
      setDateRange(newDateRange);
      setSelectedYear(undefined); // Désactiver le sélecteur d'année

      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Dates personnalisées détectées dans URL:', {
          startDate: urlStartDate,
          endDate: urlEndDate,
        });
      }
    }
    // Si l'URL contient une période
    else if (urlPeriod) {
      setPeriod(urlPeriod);

      // Vérifier si c'est une année (4 chiffres)
      if (/^\d{4}$/.test(urlPeriod)) {
        setSelectedYear(urlPeriod);
        setDateRange(undefined); // Désactiver le sélecteur de dates personnalisées
      } else {
        setSelectedYear(undefined);
        setDateRange(undefined);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Période détectée dans URL:', urlPeriod);
      }
    }
  }, [searchParams]); // Se déclenche quand searchParams change (après router.push/refresh)

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
    [data, role]
  );

  // Séparer les widgets statiques (temps réel) des widgets filtrés
  // Les widgets statiques s'affichent AVANT les filtres de période
  const { staticWidgets, filteredWidgets } = useMemo(() => {
    const staticKPIs: typeof widgetConfig.visibleWidgets = [];
    const filtered: typeof widgetConfig.visibleWidgets = [];

    widgetConfig.visibleWidgets.forEach((widgetId) => {
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
  }, [widgetConfig]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {/* === Barre de filtres responsive === */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <DashboardFiltersBar
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            activeFilterType={activeFilterType}
            includeOld={includeOld}
            onIncludeOldChange={handleIncludeOldChange}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            widgetConfig={widgetConfig}
            onWidgetConfigUpdate={loadWidgetConfig}
          />
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

      {/* === SECTION 2 : Barre de filtres responsive === */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DashboardFiltersBar
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          activeFilterType={activeFilterType}
          includeOld={includeOld}
          onIncludeOldChange={handleIncludeOldChange}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          widgetConfig={widgetConfig}
          onWidgetConfigUpdate={loadWidgetConfig}
        />
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

