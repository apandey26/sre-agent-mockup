import { Plug } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'

export default function Integrations() {
  return (
    <div>
      <Breadcrumbs />
      <EmptyState
        icon={Plug}
        title="Integrations Hub"
        description="Grid of 20+ integration cards across 6 tiers. Connected/disconnected states. Click to expand config panel. Integration health dashboard. Built in P18."
        actions={[
          { label: 'Connect Integration' },
        ]}
      />
    </div>
  )
}
