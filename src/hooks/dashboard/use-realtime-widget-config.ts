import { useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { DashboardRole } from '@/types/dashboard-widgets';

type UseRealtimeWidgetConfigProps = {
  profileId: string;
  role: DashboardRole;
  onConfigChange: () => void;
};

/**
 * Hook pour écouter les changements temps réel de la configuration des widgets
 * 
 * @param profileId - ID du profil utilisateur
 * @param role - Rôle de l'utilisateur
 * @param onConfigChange - Callback appelé lors d'un changement
 */
export function useRealtimeWidgetConfig({
  profileId,
  role,
  onConfigChange,
}: UseRealtimeWidgetConfigProps): void {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

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
        () => {
          onConfigChange();
        }
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
        () => {
          onConfigChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(preferencesChannel);
      supabase.removeChannel(roleWidgetsChannel);
    };
  }, [profileId, role, onConfigChange]);
}

