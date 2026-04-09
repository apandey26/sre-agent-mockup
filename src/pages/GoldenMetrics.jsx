import { useParams, useNavigate } from 'react-router-dom'
import { BarChart3, ArrowLeft } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'

export default function GoldenMetrics() {
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
        icon={BarChart3}
        title="Golden Metrics Deep Dive"
        description="4-quadrant chart layout (throughput, errors, latency, saturation) with shared time range selector, correlation overlays, entity comparison, and AI annotations. Built in P13-P14."
        actions={[{ label: 'Back to Canvas', onClick: () => navigate(`/investigation/${id}`) }]}
      />
    </div>
  )
}
