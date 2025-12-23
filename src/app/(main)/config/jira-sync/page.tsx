import { StandardPageHeader } from '@/components/layout/page';
import { JiraSyncDashboard } from './jira-sync-dashboard';

export default function JiraSyncPage() {
  return (
    <div className="space-y-6">
      <StandardPageHeader
        icon="RefreshCw"
        title="Synchronisation JIRA"
        description="Monitoring et statistiques de synchronisation avec JIRA"
      />
      <JiraSyncDashboard />
    </div>
  );
}

