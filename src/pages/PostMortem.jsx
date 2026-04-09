import { useParams, useNavigate } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import EmptyState from '../components/EmptyState'

export default function PostMortem() {
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
        icon={FileText}
        title="Post-Mortem Generator"
        description="Auto-populated template with timeline, root cause, impact, action items. Source panel with external docs. Multi-format export. Built in P21."
        actions={[{ label: 'Back to Canvas', onClick: () => navigate(`/investigation/${id}`) }]}
      />
    </div>
  )
}
