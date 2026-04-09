import { Link, useLocation, useParams } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const ROUTE_LABELS = {
  '': 'Home',
  'investigation': 'Investigation',
  'golden-metrics': 'Golden Metrics',
  'slo': 'SLO Workflow',
  'war-room': 'War Room',
  'postmortem': 'Post-Mortem',
  'memory': 'Memory Explorer',
  'integrations': 'Integrations',
  'settings': 'Settings & Analytics',
  'setup': 'Setup Wizard',
}

const INVESTIGATION_NAMES = {
  'inv-0892': 'checkout-service',
  'inv-0893': 'api-gateway',
}

export default function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  const crumbs = []
  let path = ''

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    path += `/${seg}`

    // Skip investigation IDs as standalone crumbs — merge with "Investigation"
    if (segments[i - 1] === 'investigation' && seg.startsWith('inv-')) {
      const name = INVESTIGATION_NAMES[seg] || seg
      crumbs[crumbs.length - 1] = {
        ...crumbs[crumbs.length - 1],
        label: `Investigation: ${name}`,
        path,
      }
      continue
    }

    const label = ROUTE_LABELS[seg] || seg
    crumbs.push({ label, path })
  }

  return (
    <nav className="flex items-center gap-1.5 text-[13px] text-text-secondary mb-4">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-nr-blue transition-colors"
      >
        <Home size={14} />
        <span>Home</span>
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-text-secondary/50" />
          {i === crumbs.length - 1 ? (
            <span className="text-text-primary font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-nr-blue transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
