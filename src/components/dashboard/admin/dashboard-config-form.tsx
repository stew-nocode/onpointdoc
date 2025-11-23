'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import type {
  DashboardRole,
  DashboardSectionKey,
  DashboardConfigurationWithMeta,
} from '@/types/dashboard';
import { getDefaultDashboardConfig } from '@/services/dashboard/default-config';
import { initializeSectionsFromVisibleSections } from '@/lib/utils/dashboard-sections';
import { DashboardConfigSectionList } from './dashboard-config-section-list';
import { DashboardConfigActions } from './dashboard-config-actions';

type DashboardConfigFormProps = {
  role: DashboardRole;
  initialConfig?: DashboardConfigurationWithMeta | null;
  onConfigChange?: () => void;
};

/**
 * Formulaire de configuration des blocs dashboard pour un rôle
 * 
 * @param role - Rôle à configurer
 * @param initialConfig - Configuration existante (si custom)
 * @param onConfigChange - Callback après sauvegarde réussie
 */
export function DashboardConfigForm({
  role,
  initialConfig,
  onConfigChange,
}: DashboardConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Obtenir les defaults pour ce rôle
  const defaultConfig = getDefaultDashboardConfig(role);
  
  // État local des sections (initialisé avec config existante ou defaults)
  const [sections, setSections] = useState<Record<DashboardSectionKey, boolean>>(() => {
    if (initialConfig) {
      return initialConfig.sections;
    }
    return initializeSectionsFromVisibleSections(defaultConfig.visibleSections);
  });

  /**
   * Toggle une section
   */
  const toggleSection = (sectionKey: DashboardSectionKey) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  /**
   * Réinitialiser les sections aux valeurs par défaut
   */
  const handleSectionsReset = () => {
    setSections(initializeSectionsFromVisibleSections(defaultConfig.visibleSections));
  };

  const roleLabels: Record<DashboardRole, string> = {
    direction: 'Direction',
    manager: 'Manager',
    agent: 'Agent',
    admin: 'Admin',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Configuration Dashboard - {roleLabels[role]}</CardTitle>
            <CardDescription>
              Activez ou désactivez les blocs visibles pour ce rôle
            </CardDescription>
          </div>
          <DashboardConfigActions
            role={role}
            sections={sections}
            isLoading={isLoading}
            isResetting={isResetting}
            onSectionsReset={handleSectionsReset}
            onSaveStart={() => setIsLoading(true)}
            onSaveEnd={() => setIsLoading(false)}
            onResetStart={() => setIsResetting(true)}
            onResetEnd={() => setIsResetting(false)}
            onSaveSuccess={() => onConfigChange?.()}
          />
        </div>
      </CardHeader>
      <CardContent>
        <DashboardConfigSectionList
          sections={sections}
          onToggle={toggleSection}
          disabled={isLoading || isResetting}
        />

        {initialConfig && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">
              Dernière modification :{' '}
              {new Date(initialConfig.updatedAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

