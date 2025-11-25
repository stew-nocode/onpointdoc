'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/ui/button';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import type { DashboardRole, DashboardSectionKey } from '@/types/dashboard';
import { parseApiError, showApiErrorToast } from '@/lib/utils/api-error-handler';

type DashboardConfigActionsProps = {
  role: DashboardRole;
  sections: Record<DashboardSectionKey, boolean>;
  isLoading: boolean;
  isResetting: boolean;
  onSectionsReset: () => void;
  onSaveStart: () => void;
  onSaveEnd: () => void;
  onResetStart: () => void;
  onResetEnd: () => void;
  onSaveSuccess: () => void;
};

/**
 * Actions du formulaire de configuration (Sauvegarder, Réinitialiser)
 * 
 * @param role - Rôle configuré
 * @param sections - Sections actuelles
 * @param isLoading - Si la sauvegarde est en cours
 * @param isResetting - Si la réinitialisation est en cours
 * @param onSectionsReset - Callback après réinitialisation des sections
 * @param onSaveSuccess - Callback après sauvegarde réussie
 */
export function DashboardConfigActions({
  role,
  sections,
  isLoading,
  isResetting,
  onSectionsReset,
  onSaveStart,
  onSaveEnd,
  onResetStart,
  onResetEnd,
  onSaveSuccess,
}: DashboardConfigActionsProps) {
  const router = useRouter();

  /**
   * Sauvegarder la configuration
   */
  const handleSave = async () => {
    // Validation: au moins une section visible
    const hasAtLeastOneVisible = Object.values(sections).some((visible) => visible);
    if (!hasAtLeastOneVisible) {
      toast.error('Au moins une section doit être visible');
      return;
    }

    onSaveStart();
    try {
      const response = await fetch('/api/dashboard/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          sections,
        }),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      toast.success('Configuration sauvegardée avec succès');
      router.refresh();
      onSaveSuccess();
    } catch (error) {
      showApiErrorToast(error, 'Erreur lors de la sauvegarde');
    } finally {
      onSaveEnd();
    }
  };

  /**
   * Réinitialiser aux valeurs par défaut
   */
  const handleReset = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser aux valeurs par défaut ?')) {
      return;
    }

    onResetStart();
    try {
      const response = await fetch(`/api/dashboard/config?role=${role}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        throw new Error(errorMessage);
      }

      toast.success('Configuration réinitialisée aux valeurs par défaut');
      router.refresh();
      onSectionsReset();
      onSaveSuccess();
    } catch (error) {
      showApiErrorToast(error, 'Erreur lors de la réinitialisation');
    } finally {
      onResetEnd();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={handleReset}
        disabled={isLoading || isResetting}
      >
        {isResetting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <RotateCcw className="h-4 w-4 mr-2" />
        )}
        Réinitialiser
      </Button>
      <Button onClick={handleSave} disabled={isLoading || isResetting}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Sauvegarder
      </Button>
    </div>
  );
}

