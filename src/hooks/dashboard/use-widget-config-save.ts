import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { parseApiError, showApiErrorToast } from '@/lib/utils/api-error-handler';
import { ROLE_LABELS } from '@/lib/constants/widget-labels';
import type { DashboardRole, DashboardWidget } from '@/types/dashboard-widgets';

type UseWidgetConfigSaveReturn = {
  savingRole: DashboardRole | null;
  handleSave: (role: DashboardRole, widgets: DashboardWidget[]) => Promise<void>;
};

/**
 * Hook personnalisé pour gérer la sauvegarde de la configuration des widgets
 * 
 * @returns État de sauvegarde et fonction de sauvegarde
 */
export function useWidgetConfigSave(): UseWidgetConfigSaveReturn {
  const router = useRouter();
  const [savingRole, setSavingRole] = useState<DashboardRole | null>(null);

  const handleSave = async (role: DashboardRole, widgets: DashboardWidget[]) => {
    setSavingRole(role);
    try {
      const response = await fetch('/api/dashboard/widgets/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          widgets,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      toast.success(`Widgets sauvegardés pour ${ROLE_LABELS[role]}`);
      router.refresh();
    } catch (error) {
      showApiErrorToast(error, 'Erreur lors de la sauvegarde');
    } finally {
      setSavingRole(null);
    }
  };

  return { savingRole, handleSave };
}

