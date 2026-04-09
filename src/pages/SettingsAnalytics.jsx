import { Settings } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'

export default function SettingsAnalytics() {
  return (
    <div>
      <Breadcrumbs />
      <EmptyState
        icon={Settings}
        title="Settings & Analytics"
        description="Investigation analytics dashboard (MTTR trends, root cause distribution, confidence calibration). Agent configuration toggles. Memory management admin view. Built in P22."
        actions={[
          { label: 'View Analytics' },
        ]}
      />
    </div>
  )
}
