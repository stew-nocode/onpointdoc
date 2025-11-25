import type { Period, UnifiedDashboardData } from '@/types/dashboard';
import type { DashboardRole, UserDashboardConfig } from '@/types/dashboard-widgets';

type DashboardDataParams = {
  period: Period;
  serializedFilters?: string;
};

type WidgetConfigParams = {
  profileId: string;
  role: DashboardRole;
};

async function handleResponse<T>(response: Response, context: string): Promise<T> {
  if (!response.ok) {
    throw new Error(`[${context}] HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchUnifiedDashboardData({
  period,
  serializedFilters
}: DashboardDataParams): Promise<UnifiedDashboardData> {
  const params = new URLSearchParams(serializedFilters || '');
  params.set('period', period);

  const response = await fetch(`/api/dashboard?${params.toString()}`, {
    cache: 'no-store'
  });
  return handleResponse<UnifiedDashboardData>(response, 'fetchUnifiedDashboardData');
}

export async function fetchDashboardWidgetConfig({
  profileId,
  role
}: WidgetConfigParams): Promise<UserDashboardConfig> {
  const params = new URLSearchParams({
    profileId,
    role
  });

  const response = await fetch(`/api/dashboard/widgets/config?${params.toString()}`, {
    cache: 'no-store'
  });
  return handleResponse<UserDashboardConfig>(response, 'fetchDashboardWidgetConfig');
}
