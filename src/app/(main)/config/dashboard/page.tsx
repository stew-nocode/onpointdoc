import { unstable_noStore as noStore } from 'next/cache';
import { getCurrentUserProfile } from '@/services/users/server';
import { getAllDashboardConfigurations } from '@/services/dashboard/config';
import { DashboardConfigPageClient } from '@/components/dashboard/admin/dashboard-config-page-client';
import { PageLayout } from '@/components/layout/page';

/**
 * Page de configuration admin du dashboard
 * 
 * Permet aux admins de configurer les blocs visibles par rôle
 */
export default async function DashboardConfigPage() {
  noStore();

  // Vérifier que l'utilisateur est admin
  const profile = await getCurrentUserProfile();
  
  if (!profile || profile.role !== 'admin') {
  return (
    <PageLayout
      header={{
        label: 'Configuration',
        title: 'Configuration Dashboard',
        description: 'Configurez les blocs visibles pour chaque rôle'
      }}
      card={{
        title: 'Paramètres de visibilité'
      }}
    >
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          Accès non autorisé. Cette page est réservée aux administrateurs.
        </div>
      </PageLayout>
    );
  }

  // Charger toutes les configurations existantes
  const configurations = await getAllDashboardConfigurations();
  
  // Créer un map pour accès rapide
  const configMap = new Map(
    configurations.map((config) => [config.role, config])
  );

  return (
    <PageLayout
      header={{
        label: 'Configuration',
        title: 'Configuration Dashboard',
        description: 'Configurez les blocs visibles pour chaque rôle'
      }}
      card={{
        title: 'Paramètres de visibilité'
      }}
    >
      <DashboardConfigPageClient
        initialConfigs={configurations}
        configMap={configMap}
      />
    </PageLayout>
  );
}

