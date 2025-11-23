import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  DashboardRole,
  DashboardSectionKey,
  DashboardConfigurationInput,
  DashboardConfigurationWithMeta,
  DashboardConfig
} from '@/types/dashboard';
import { getDefaultDashboardConfig } from './default-config';
import { mergeDashboardSections, visibleSectionsToSections } from '@/lib/utils/dashboard-sections';

/**
 * Charge la configuration dashboard depuis la base de données
 * 
 * @param role - Rôle pour lequel charger la configuration
 * @returns Configuration depuis la DB ou null si pas de configuration custom
 */
export async function getDashboardConfigurationFromDB(
  role: DashboardRole
): Promise<DashboardConfigurationWithMeta | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('dashboard_configurations')
      .select('role, sections, updated_at, updated_by')
      .eq('role', role)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      role: data.role as DashboardRole,
      sections: data.sections as Record<DashboardSectionKey, boolean>,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };
  } catch {
    return null;
  }
}

/**
 * Charge toutes les configurations dashboard depuis la DB
 * 
 * @returns Toutes les configurations ou tableau vide
 */
export async function getAllDashboardConfigurations(): Promise<DashboardConfigurationWithMeta[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('dashboard_configurations')
      .select('role, sections, updated_at, updated_by')
      .order('role', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((item) => ({
      role: item.role as DashboardRole,
      sections: item.sections as Record<DashboardSectionKey, boolean>,
      updatedAt: item.updated_at,
      updatedBy: item.updated_by,
    }));
  } catch {
    return [];
  }
}

/**
 * Récupère la configuration dashboard (DB ou defaults)
 * 
 * @param role - Rôle pour lequel récupérer la configuration
 * @param teamId - ID de l'équipe (pour managers)
 * @param agentId - ID de l'agent (pour agents)
 * @returns Configuration fusionnée (DB prioritaire, defaults en fallback)
 */
export async function getDashboardConfiguration(
  role: DashboardRole,
  teamId?: string,
  agentId?: string
): Promise<DashboardConfig> {
  // Essayer de charger depuis la DB
  const dbConfig = await getDashboardConfigurationFromDB(role);
  
  // Obtenir les defaults
  const defaultConfig = getDefaultDashboardConfig(role, teamId, agentId);

  // Si config DB existe, fusionner avec defaults (DB prioritaire)
  if (dbConfig) {
    return {
      role,
      visibleSections: {
        strategicKPIs: dbConfig.sections.strategicKPIs ?? defaultConfig.visibleSections.strategicKPIs,
        teamKPIs: dbConfig.sections.teamKPIs ?? defaultConfig.visibleSections.teamKPIs,
        personalKPIs: dbConfig.sections.personalKPIs ?? defaultConfig.visibleSections.personalKPIs,
        strategicCharts: dbConfig.sections.strategicCharts ?? defaultConfig.visibleSections.strategicCharts,
        teamCharts: dbConfig.sections.teamCharts ?? defaultConfig.visibleSections.teamCharts,
        personalCharts: dbConfig.sections.personalCharts ?? defaultConfig.visibleSections.personalCharts,
        strategicTables: dbConfig.sections.strategicTables ?? defaultConfig.visibleSections.strategicTables,
        teamTables: dbConfig.sections.teamTables ?? defaultConfig.visibleSections.teamTables,
        alerts: dbConfig.sections.alerts ?? defaultConfig.visibleSections.alerts,
      },
      filters: defaultConfig.filters, // Les filters viennent toujours des defaults
    };
  }

  // Sinon, retourner les defaults
  return defaultConfig;
}

/**
 * Met à jour ou crée une configuration dashboard (admin uniquement)
 * 
 * @param input - Configuration à sauvegarder
 * @param updatedBy - ID du profil admin qui effectue la modification
 * @returns Configuration sauvegardée
 */
export async function updateDashboardConfiguration(
  input: DashboardConfigurationInput,
  updatedBy: string
): Promise<DashboardConfigurationWithMeta> {
  const supabase = await createSupabaseServerClient();

  // Charger la config existante ou les defaults pour fusionner
  const existingConfig = await getDashboardConfigurationFromDB(input.role);
  const defaultConfig = getDefaultDashboardConfig(input.role);

  // Fusionner: nouvelles valeurs > existantes > defaults
  const mergedSections = mergeDashboardSections(
    input.sections,
    existingConfig?.sections,
    defaultConfig.visibleSections
  );

  // Validation: au moins une section doit être visible
  const hasAtLeastOneVisible = Object.values(mergedSections).some((visible) => visible);
  if (!hasAtLeastOneVisible) {
    throw new Error('Au moins une section doit être visible pour ce rôle');
  }

  // Upsert (insert ou update)
  const { data, error } = await supabase
    .from('dashboard_configurations')
    .upsert({
      role: input.role,
      sections: mergedSections,
      updated_by: updatedBy,
    }, {
      onConflict: 'role',
    })
    .select('role, sections, updated_at, updated_by')
    .single();

  if (error || !data) {
    throw new Error(`Erreur lors de la sauvegarde: ${error?.message || 'Unknown error'}`);
  }

  return {
    role: data.role as DashboardRole,
    sections: data.sections as Record<DashboardSectionKey, boolean>,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  };
}

/**
 * Réinitialise une configuration aux valeurs par défaut
 * 
 * @param role - Rôle à réinitialiser
 * @param updatedBy - ID du profil admin
 */
export async function resetDashboardConfigurationToDefaults(
  role: DashboardRole,
  updatedBy: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const defaultConfig = getDefaultDashboardConfig(role);

  // Convertir visibleSections en sections
  const sections = visibleSectionsToSections(defaultConfig.visibleSections);

  const { error } = await supabase
    .from('dashboard_configurations')
    .upsert({
      role,
      sections,
      updated_by: updatedBy,
    }, {
      onConflict: 'role',
    });

  if (error) {
    throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
  }
}

