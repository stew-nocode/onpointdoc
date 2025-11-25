'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { DashboardConfigForm } from './dashboard-config-form';
import type {
  DashboardRole,
  DashboardConfigurationWithMeta,
} from '@/types/dashboard';

type DashboardConfigPageClientProps = {
  initialConfigs: DashboardConfigurationWithMeta[];
  configMap: Map<DashboardRole, DashboardConfigurationWithMeta>;
};

/**
 * Client component pour la page de configuration dashboard
 * 
 * Gère les onglets par rôle et la synchronisation des données
 */
export function DashboardConfigPageClient({
  initialConfigs,
  configMap,
}: DashboardConfigPageClientProps) {
  const [configs, setConfigs] = useState(initialConfigs);
  const [activeRole, setActiveRole] = useState<DashboardRole>('direction');

  /**
   * Recharge les configurations depuis le serveur
   */
  const handleConfigChange = async () => {
    try {
      const response = await fetch('/api/dashboard/config');
      if (response.ok) {
        const newConfigs = await response.json();
        setConfigs(newConfigs);
      }
    } catch (error) {
      // Erreur silencieuse, l'utilisateur sera notifié par le toast
    }
  };

  const roles: DashboardRole[] = ['direction', 'manager', 'agent', 'admin'];
  const roleLabels: Record<DashboardRole, string> = {
    direction: 'Direction',
    manager: 'Manager',
    agent: 'Agent',
    admin: 'Admin',
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeRole} onValueChange={(value: string) => setActiveRole(value as DashboardRole)}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          {roles.map((role) => (
            <TabsTrigger key={role} value={role}>
              {roleLabels[role]}
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((role) => {
          const config = configMap.get(role);
          return (
            <TabsContent key={role} value={role} className="mt-6">
              <DashboardConfigForm
                role={role}
                initialConfig={config || null}
                onConfigChange={handleConfigChange}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

