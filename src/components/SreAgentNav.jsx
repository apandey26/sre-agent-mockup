import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Brain, Plug, Settings, BarChart3 } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/memory', label: 'Memory', icon: Brain },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function SreAgentNav() {
  const location = useLocation()

  // Hide on investigation sub-pages (canvas, golden metrics, slo, etc.)
  if (location.pathname.startsWith('/investigation')) return null
  // Hide on setup wizard
  if (location.pathname === '/setup') return null

  return (
    <nav className="flex items-center gap-1 mb-4 border-b border-gray-100 pb-2">
      {ITEMS.map(item => {
        const isActive = item.exact
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to)

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              isActive
                ? 'text-[#0B6ACB] bg-[#0B6ACB]/5'
                : 'text-[#6B7280] hover:text-[#1D2433] hover:bg-gray-50'
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
