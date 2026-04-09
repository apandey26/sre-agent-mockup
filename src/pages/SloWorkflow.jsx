import { useParams, useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'

export default function SloWorkflow() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div>
      <Breadcrumbs />
      <button
        onClick={() => navigate(`/investigation/${id}`)}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-nr-blue mb-4 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Canvas
      </button>
      <EmptyState
        icon={Shield}
        title="SLO Workflow"
        description="SLO overview cards, burn rate multi-window chart, budget consumption timeline, historical heatmap, and SLO-driven action buttons. Built in P15."
        actions={[{ label: 'Back to Canvas', onClick: () => navigate(`/investigation/${id}`) }]}
      />
    </div>
  )
}
