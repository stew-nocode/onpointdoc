import { useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { DashboardRole } from '@/types/dashboard-widgets';
import { debounce } from '@/lib/utils/debounce';

type UseRealtimeWidgetConfigProps = {
  profileId: string;
  role: DashboardRole;
  onConfigChange: () => void;
};

/**
 * Hook pour écouter les changements temps réel de la configuration des widgets
 * 
 * Optimisé avec debouncing pour éviter les re-renders excessifs.
 * 
 * @param profileId - ID du profil utilisateur
 * @param role - Rôle de l'utilisateur
 * @param onConfigChange - Callback appelé lors d'un changement (debounced 300ms)
 */
export function useRealtimeWidgetConfig({
  profileId,
  role,
  onConfigChange,
}: UseRealtimeWidgetConfigProps): void {
  // Référence stable pour le callback (évite les réabonnements)
  const onConfigChangeRef = useRef(onConfigChange);
  
  // Mettre à jour la référence lorsque le callback change
  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Debounce le callback pour éviter les re-renders excessifs (300ms)
    const debouncedOnChange = debounce(() => {
      onConfigChangeRef.current();
    }, 300);

    const preferencesChannel = supabase
      .channel('dashboard-widget-preferences')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_user_preferences',
          filter: `profile_id=eq.${profileId}`,
        },
        debouncedOnChange
      )
      .subscribe();

    const roleWidgetsChannel = supabase
      .channel('dashboard-role-widgets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_role_widgets',
          filter: `role=eq.${role}`,
        },
        debouncedOnChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(preferencesChannel);
      supabase.removeChannel(roleWidgetsChannel);
    };
  }, [profileId, role]); // Supprimer onConfigChange des dépendances pour éviter les réabonnements
}

