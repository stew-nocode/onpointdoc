import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { parseApiError, showApiErrorToast } from '@/lib/utils/api-error-handler';
import type { DashboardWidget } from '@/types/dashboard-widgets';

type UseWidgetPreferencesSaveReturn = {
  isLoading: boolean;
  handleSave: (hiddenWidgets: DashboardWidget[]) => Promise<void>;
};

/**
 * Hook personnalisé pour gérer la sauvegarde des préférences utilisateur
 * 
 * @returns État de chargement et fonction de sauvegarde
 */
export function useWidgetPreferencesSave(): UseWidgetPreferencesSaveReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (hiddenWidgets: DashboardWidget[]) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard/widgets/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hiddenWidgets,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      toast.success('Préférences sauvegardées');
      router.refresh();
    } catch (error) {
      showApiErrorToast(error, 'Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleSave };
}

