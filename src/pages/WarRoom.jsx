import { useParams, useNavigate } from 'react-router-dom'
import { Radio, ArrowLeft } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'

export default function WarRoom() {
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
        icon={Radio}
        title="War Room"
        description="Four-zone layout: participant strip, live feed, embedded canvas, actions & comms panel. Zoom transcript stream integration. Built in P19-P20."
        actions={[{ label: 'Back to Canvas', onClick: () => navigate(`/investigation/${id}`) }]}
      />
    </div>
  )
}
