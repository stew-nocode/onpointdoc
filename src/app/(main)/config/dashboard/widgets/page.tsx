import { unstable_noStore as noStore } from 'next/cache';
import { PageLayout } from '@/components/layout/page';
import { getCurrentUserProfile } from '@/services/users/server';
import { getAllRoleWidgets } from '@/services/dashboard/widgets';
import { DashboardWidgetsConfigClient } from '@/components/dashboard/admin/dashboard-widgets-config-client';

/**
 * Page de configuration admin des widgets dashboard par rôle
 * 
 * Permet aux administrateurs d'affecter/retirer des widgets pour chaque rôle
 */
export default async function DashboardWidgetsConfigPage() {
  noStore();

  // Vérifier que l'utilisateur est admin
  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== 'admin') {
    return (
      <PageLayout
        header={{
          label: 'Configuration',
          title: 'Configuration Widgets Dashboard',
          description: 'Accès refusé',
        }}
        card={{
          title: 'Erreur',
        }}
      >
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          Accès refusé. Seuls les administrateurs peuvent accéder à cette page.
        </div>
      </PageLayout>
    );
  }

  // Charger toutes les configurations de widgets par rôle
  const roleWidgets = await getAllRoleWidgets();

  return (
    <PageLayout
      header={{
        label: 'Configuration',
        title: 'Configuration Widgets Dashboard',
        description: 'Affectez les widgets disponibles pour chaque rôle',
      }}
      card={{
        title: 'Affectation des widgets par rôle',
      }}
    >
      <DashboardWidgetsConfigClient initialRoleWidgets={roleWidgets} />
    </PageLayout>
  );
}

