import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Shield, Radio, FileText, Search } from 'lucide-react'
import { Button } from './ui/button'

const PAGES = [
  { path: '', label: 'Canvas', icon: Search },
  { path: '/golden-metrics', label: 'Golden Metrics', icon: BarChart3 },
  { path: '/slo', label: 'SLO', icon: Shield },
  { path: '/war-room', label: 'War Room', icon: Radio },
  { path: '/postmortem', label: 'Post-Mortem', icon: FileText },
]

export default function InvestigationSubNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const base = `/investigation/${id}`

  // Don't show on the canvas itself — only on sub-pages
  if (location.pathname === base) return null

  const currentPath = location.pathname.replace(base, '')

  return (
    <div className="flex items-center gap-1 mb-4 pb-3 border-b border-gray-100">
      <Button variant="ghost" size="sm" className="text-[12px] gap-1" onClick={() => navigate(base)}>
        <ArrowLeft size={13} /> Canvas
      </Button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      {PAGES.filter(p => p.path !== '').map(p => {
        const isActive = currentPath === p.path
        return (
          <Button
            key={p.path}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className={`text-[11px] h-7 ${isActive ? '' : 'text-[#6B7280]'}`}
            onClick={() => navigate(`${base}${p.path}`)}
          >
            <p.icon size={11} /> {p.label}
          </Button>
        )
      })}
    </div>
  )
}
