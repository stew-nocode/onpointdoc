/**
 * Service de statistiques des BUGs par type et module
 * 
 * @description
 * Fournit les données pour le Horizontal Stacked Bar Chart
 * montrant les types de BUGs avec répartition par module (empilé).
 * 
 * Soumis aux filtres globaux (période).
 * 
 * @see docs/dashboard/REFONTE-DASHBOARD-SPECIFICATION.md - Section 3.3
 */
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Type pour les données d'un type de BUG
 * Chaque clé dynamique représente un module
 */
export type BugTypeModuleData = {
  /** Type de BUG */
  bugType: string;
  /** Total tous modules */
  total: number;
  /** Répartition par module (clés dynamiques) */
  [moduleId: string]: number | string; // moduleId -> count
};

/**
 * Type des statistiques BUGs par type et module
 */
export type BugsByTypeAndModuleStats = {
  /** Données par type de BUG */
  data: BugTypeModuleData[];
  /** Liste des modules (pour les barres empilées) */
  modules: Array<{
    id: string;
    name: string;
  }>;
  /** Nombre total de BUGs */
  totalBugs: number;
  /** Limite appliquée (top N types) */
  limit: number;
};

/**
 * Récupère les statistiques de BUGs par type et module
 * 
 * @param productId - ID du produit
 * @param periodStart - Date de début (ISO string)
 * @param periodEnd - Date de fin (ISO string)
 * @param limit - Nombre max de types de BUG à retourner (défaut: 15)
 * @returns Statistiques par type et module ou null en cas d'erreur
 */
export const getBugsByTypeAndModuleStats = cache(
  async (
    productId: string,
    periodStart: string,
    periodEnd: string,
    limit: number = 15
  ): Promise<BugsByTypeAndModuleStats | null> => {
    const supabase = await createSupabaseServerClient();

    try {
      // 1. Récupérer les BUGs de la période avec leur type et module
      const { data: bugs, error: bugsError } = await supabase
        .from('tickets')
        .select('id, bug_type, module_id')
        .eq('ticket_type', 'BUG')
        .eq('product_id', productId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (bugsError) {
        console.error('[getBugsByTypeAndModuleStats] Error fetching bugs:', bugsError);
        return null;
      }

      if (!bugs || bugs.length === 0) {
        return {
          data: [],
          modules: [],
          totalBugs: 0,
          limit,
        };
      }

      // 2. Collecter les module_id uniques
      const uniqueModuleIds = [...new Set(
        bugs
          .map((b: any) => b.module_id)
          .filter((id: any) => id !== null)
      )];

      // 3. Récupérer les noms des modules
      const modulesMap = new Map<string, string>();
      if (uniqueModuleIds.length > 0) {
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('id, name')
          .in('id', uniqueModuleIds);

        if (modulesError) {
          console.error('[getBugsByTypeAndModuleStats] Error fetching modules:', modulesError);
        } else if (modules) {
          modules.forEach((m: any) => {
            modulesMap.set(m.id, m.name || 'Module inconnu');
          });
        }
      }

      // 4. Agréger par bug_type et module_id
      const typeModuleMap = new Map<string, Map<string, number>>();

      bugs.forEach((bug: any) => {
        const bugType = bug.bug_type || 'Non spécifié';
        const moduleId = bug.module_id || 'no-module';

        if (!typeModuleMap.has(bugType)) {
          typeModuleMap.set(bugType, new Map<string, number>());
        }

        const moduleCounts = typeModuleMap.get(bugType)!;
        moduleCounts.set(moduleId, (moduleCounts.get(moduleId) || 0) + 1);
      });

      // 5. Transformer en format pour Recharts
      const data: BugTypeModuleData[] = [];

      typeModuleMap.forEach((moduleCounts, bugType) => {
        const row: BugTypeModuleData = {
          bugType,
          total: 0,
        };

        moduleCounts.forEach((count, moduleId) => {
          row[moduleId] = count;
          row.total += count;
        });

        data.push(row);
      });

      // 6. Trier par total décroissant et limiter
      const sortedData = data
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);

      // 7. Préparer la liste des modules pour les barres
      const modules = Array.from(modulesMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));

      // Ajouter le module "Sans module" si présent
      if (bugs.some((b: any) => !b.module_id)) {
        modules.push({ id: 'no-module', name: 'Sans module' });
      }

      const totalBugs = sortedData.reduce((sum, item) => sum + item.total, 0);

      console.log(
        `[getBugsByTypeAndModuleStats] Found ${sortedData.length} bug types, ${modules.length} modules, ${totalBugs} bugs total`
      );

      return {
        data: sortedData,
        modules,
        totalBugs,
        limit,
      };
    } catch (error) {
      console.error('[getBugsByTypeAndModuleStats] Unexpected error:', error);
      return null;
    }
  }
);




