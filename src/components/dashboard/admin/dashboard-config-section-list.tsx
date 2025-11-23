'use client';

import { Switch } from '@/ui/switch';
import { Label } from '@/ui/label';
import type { DashboardSectionKey } from '@/types/dashboard';

/**
 * Groupes de sections pour l'affichage organisé
 */
const SECTION_GROUPS: Array<{
  title: string;
  sections: DashboardSectionKey[];
}> = [
  {
    title: 'KPIs',
    sections: ['strategicKPIs', 'teamKPIs', 'personalKPIs'],
  },
  {
    title: 'Graphiques',
    sections: ['strategicCharts', 'teamCharts', 'personalCharts'],
  },
  {
    title: 'Tables',
    sections: ['strategicTables', 'teamTables'],
  },
  {
    title: 'Alertes',
    sections: ['alerts'],
  },
];

/**
 * Labels des sections pour l'affichage
 */
const SECTION_LABELS: Record<DashboardSectionKey, string> = {
  strategicKPIs: 'KPIs Stratégiques',
  teamKPIs: 'KPIs Équipe',
  personalKPIs: 'KPIs Personnels',
  strategicCharts: 'Graphiques Stratégiques',
  teamCharts: 'Graphiques Équipe',
  personalCharts: 'Graphiques Personnels',
  strategicTables: 'Tables Stratégiques',
  teamTables: 'Tables Équipe',
  alerts: 'Alertes Opérationnelles',
};

type DashboardConfigSectionListProps = {
  sections: Record<DashboardSectionKey, boolean>;
  onToggle: (sectionKey: DashboardSectionKey) => void;
  disabled?: boolean;
};

/**
 * Liste des sections configurables avec switches
 * 
 * @param sections - État actuel des sections
 * @param onToggle - Callback pour toggle une section
 * @param disabled - Si les switches sont désactivés
 */
export function DashboardConfigSectionList({
  sections,
  onToggle,
  disabled = false,
}: DashboardConfigSectionListProps) {
  return (
    <div className="space-y-6">
      {SECTION_GROUPS.map((group) => (
        <div key={group.title}>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {group.title}
          </h3>
          <div className="space-y-3">
            {group.sections.map((sectionKey) => (
              <div
                key={sectionKey}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <Label
                  htmlFor={`section-${sectionKey}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {SECTION_LABELS[sectionKey]}
                </Label>
                <Switch
                  id={`section-${sectionKey}`}
                  checked={sections[sectionKey]}
                  onCheckedChange={() => onToggle(sectionKey)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

